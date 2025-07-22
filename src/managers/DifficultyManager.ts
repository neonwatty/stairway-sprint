import Phaser from 'phaser';

export enum DifficultyLevel {
  EASY = 0,
  MEDIUM = 1,
  HARD = 2,
  NIGHTMARE = 3
}

export interface DifficultyConfig {
  spawnRateMultiplier: number;
  speedMultiplier: number;
  hazardVariety: number;
  assassinAggressiveness: number;
  backgroundColor: string;
  backgroundTint: number;
  displayName: string;
}

export interface DifficultyStats {
  currentLevel: DifficultyLevel;
  timeInDifficulty: number;
  highestLevelReached: DifficultyLevel;
  difficultyChanges: number;
  currentMultipliers: {
    spawnRate: number;
    speed: number;
  };
}

export class DifficultyManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private currentDifficulty: DifficultyLevel = DifficultyLevel.EASY;
  private gameStartTime: number;
  private difficultyStartTime: number;
  private highestDifficultyReached: DifficultyLevel = DifficultyLevel.EASY;
  private difficultyChangeCount: number = 0;
  
  // Time thresholds in seconds
  private readonly TIME_THRESHOLDS = {
    MEDIUM: 30,
    HARD: 60,
    NIGHTMARE: 120
  };
  
  // Score thresholds
  private readonly SCORE_THRESHOLDS = {
    MEDIUM: 10,
    HARD: 25,
    NIGHTMARE: 50,
    ULTRA_NIGHTMARE: 100
  };
  
  // Difficulty configurations
  private readonly DIFFICULTY_CONFIGS: Map<DifficultyLevel, DifficultyConfig> = new Map([
    [DifficultyLevel.EASY, {
      spawnRateMultiplier: 1.0,
      speedMultiplier: 1.0,
      hazardVariety: 1,
      assassinAggressiveness: 1.0,
      backgroundColor: '#2a4d3a',
      backgroundTint: 0x2a4d3a,
      displayName: 'Leisurely Stroll'
    }],
    [DifficultyLevel.MEDIUM, {
      spawnRateMultiplier: 1.5,
      speedMultiplier: 1.2,
      hazardVariety: 2,
      assassinAggressiveness: 1.2,
      backgroundColor: '#4d4a2a',
      backgroundTint: 0x4d4a2a,
      displayName: 'Moderate Pace'
    }],
    [DifficultyLevel.HARD, {
      spawnRateMultiplier: 2.0,
      speedMultiplier: 1.5,
      hazardVariety: 3,
      assassinAggressiveness: 1.5,
      backgroundColor: '#4d3a2a',
      backgroundTint: 0x4d3a2a,
      displayName: 'Frantic Rush'
    }],
    [DifficultyLevel.NIGHTMARE, {
      spawnRateMultiplier: 3.0,
      speedMultiplier: 2.0,
      hazardVariety: 4,
      assassinAggressiveness: 2.0,
      backgroundColor: '#4d2a2a',
      backgroundTint: 0x4d2a2a,
      displayName: 'Nightmare Descent'
    }]
  ]);
  
  // Adaptive difficulty tracking
  private performanceMetrics = {
    livesLostInLastMinute: 0,
    scoreGainRate: 0,
    streakFrequency: 0,
    lastDeathTime: 0,
    scoreHistory: [] as { time: number; score: number }[]
  };
  
  private timeCheckTimer?: Phaser.Time.TimerEvent;
  private adaptiveCheckTimer?: Phaser.Time.TimerEvent;
  
  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    this.gameStartTime = Date.now();
    this.difficultyStartTime = this.gameStartTime;
    
    this.setupTimers();
    this.setupEventListeners();
  }
  
  private setupTimers(): void {
    // Check time-based difficulty every second
    this.timeCheckTimer = this.scene.time.addEvent({
      delay: 1000,
      callback: () => this.checkTimeDifficulty(),
      callbackScope: this,
      loop: true
    });
    
    // Check adaptive difficulty every 5 seconds
    this.adaptiveCheckTimer = this.scene.time.addEvent({
      delay: 5000,
      callback: () => this.evaluatePlayerPerformance(),
      callbackScope: this,
      loop: true
    });
  }
  
  private setupEventListeners(): void {
    // Listen for score changes from ScoreManager
    this.scene.events.on('scoreChanged', this.checkScoreDifficulty, this);
    
    // Listen for life loss events
    this.scene.events.on('lifeLost', this.trackLifeLoss, this);
    
    // Listen for streak events
    this.scene.events.on('streakAchieved', this.trackStreak, this);
  }
  
  private checkTimeDifficulty(): void {
    const elapsedSeconds = (Date.now() - this.gameStartTime) / 1000;
    
    if (elapsedSeconds >= this.TIME_THRESHOLDS.NIGHTMARE && this.currentDifficulty < DifficultyLevel.NIGHTMARE) {
      this.setDifficulty(DifficultyLevel.NIGHTMARE, 'time');
    } else if (elapsedSeconds >= this.TIME_THRESHOLDS.HARD && this.currentDifficulty < DifficultyLevel.HARD) {
      this.setDifficulty(DifficultyLevel.HARD, 'time');
    } else if (elapsedSeconds >= this.TIME_THRESHOLDS.MEDIUM && this.currentDifficulty < DifficultyLevel.MEDIUM) {
      this.setDifficulty(DifficultyLevel.MEDIUM, 'time');
    }
  }
  
  private checkScoreDifficulty(score: number): void {
    // Track score for adaptive difficulty
    this.performanceMetrics.scoreHistory.push({
      time: Date.now(),
      score: score
    });
    
    // Keep only last minute of score history
    const oneMinuteAgo = Date.now() - 60000;
    this.performanceMetrics.scoreHistory = this.performanceMetrics.scoreHistory.filter(
      entry => entry.time > oneMinuteAgo
    );
    
    // Check score thresholds
    if (score >= this.SCORE_THRESHOLDS.ULTRA_NIGHTMARE && this.currentDifficulty < DifficultyLevel.NIGHTMARE) {
      this.setDifficulty(DifficultyLevel.NIGHTMARE, 'score');
    } else if (score >= this.SCORE_THRESHOLDS.NIGHTMARE && this.currentDifficulty < DifficultyLevel.NIGHTMARE) {
      this.setDifficulty(DifficultyLevel.NIGHTMARE, 'score');
    } else if (score >= this.SCORE_THRESHOLDS.HARD && this.currentDifficulty < DifficultyLevel.HARD) {
      this.setDifficulty(DifficultyLevel.HARD, 'score');
    } else if (score >= this.SCORE_THRESHOLDS.MEDIUM && this.currentDifficulty < DifficultyLevel.MEDIUM) {
      this.setDifficulty(DifficultyLevel.MEDIUM, 'score');
    }
  }
  
  private setDifficulty(level: DifficultyLevel, trigger: 'time' | 'score' | 'adaptive'): void {
    if (level === this.currentDifficulty) return;
    
    const previousDifficulty = this.currentDifficulty;
    this.currentDifficulty = level;
    this.difficultyStartTime = Date.now();
    this.difficultyChangeCount++;
    
    if (level > this.highestDifficultyReached) {
      this.highestDifficultyReached = level;
    }
    
    const config = this.getDifficultyConfig();
    
    // Apply visual feedback
    this.applyVisualFeedback(config);
    
    // Play audio feedback
    this.playAudioFeedback(level > previousDifficulty);
    
    // Emit difficulty change event
    this.emit('difficultyChanged', {
      level: level,
      config: config,
      trigger: trigger,
      previousLevel: previousDifficulty
    });
    
    // Log difficulty change
    console.log(`Difficulty changed to ${config.displayName} (${DifficultyLevel[level]}) via ${trigger}`);
  }
  
  private applyVisualFeedback(config: DifficultyConfig): void {
    const camera = this.scene.cameras.main;
    
    // Flash effect
    camera.flash(500, 255, 255, 255, false);
    
    // Background color transition
    this.scene.tweens.add({
      targets: { tint: camera.backgroundColor.color },
      tint: config.backgroundTint,
      duration: 1000,
      onUpdate: (tween) => {
        const value = Math.floor(tween.getValue());
        camera.setBackgroundColor(value);
      }
    });
    
    // Screen shake for nightmare mode
    if (this.currentDifficulty === DifficultyLevel.NIGHTMARE) {
      camera.shake(300, 0.01);
    }
  }
  
  private playAudioFeedback(isIncrease: boolean): void {
    // Play appropriate sound effect
    const soundKey = isIncrease ? 'difficulty_increase' : 'difficulty_decrease';
    
    // Check if sound exists before playing
    if (this.scene.sound.get(soundKey)) {
      this.scene.sound.play(soundKey, { volume: 0.5 });
    }
  }
  
  private trackLifeLoss(): void {
    this.performanceMetrics.livesLostInLastMinute++;
    this.performanceMetrics.lastDeathTime = Date.now();
    
    // Decay old life loss tracking
    this.scene.time.delayedCall(60000, () => {
      this.performanceMetrics.livesLostInLastMinute--;
    });
  }
  
  private trackStreak(): void {
    this.performanceMetrics.streakFrequency++;
  }
  
  private evaluatePlayerPerformance(): void {
    // Skip adaptive difficulty in easy mode or if disabled
    if (this.currentDifficulty === DifficultyLevel.EASY) return;
    
    // Calculate score gain rate (points per second)
    if (this.performanceMetrics.scoreHistory.length >= 2) {
      const recent = this.performanceMetrics.scoreHistory;
      const timeSpan = (recent[recent.length - 1].time - recent[0].time) / 1000;
      const scoreGain = recent[recent.length - 1].score - recent[0].score;
      this.performanceMetrics.scoreGainRate = scoreGain / timeSpan;
    }
    
    // Emit adaptive difficulty event for fine-tuning
    this.emit('adaptiveDifficulty', {
      livesLostRate: this.performanceMetrics.livesLostInLastMinute,
      scoreGainRate: this.performanceMetrics.scoreGainRate,
      streakFrequency: this.performanceMetrics.streakFrequency,
      recommendation: this.getAdaptiveRecommendation()
    });
  }
  
  private getAdaptiveRecommendation(): number {
    // Return a multiplier between 0.9 and 1.1 based on performance
    const livesLostPenalty = Math.min(this.performanceMetrics.livesLostInLastMinute * 0.02, 0.1);
    const scoreGainBonus = Math.min(this.performanceMetrics.scoreGainRate * 0.001, 0.1);
    
    return 1.0 - livesLostPenalty + scoreGainBonus;
  }
  
  // Public methods
  
  public getDifficultyConfig(): DifficultyConfig {
    return this.DIFFICULTY_CONFIGS.get(this.currentDifficulty)!;
  }
  
  public getCurrentDifficulty(): DifficultyLevel {
    return this.currentDifficulty;
  }
  
  public getSpawnRateMultiplier(): number {
    const config = this.getDifficultyConfig();
    const adaptive = this.getAdaptiveRecommendation();
    return config.spawnRateMultiplier * adaptive;
  }
  
  public getSpeedMultiplier(): number {
    return this.getDifficultyConfig().speedMultiplier;
  }
  
  public getHazardVariety(): number {
    return this.getDifficultyConfig().hazardVariety;
  }
  
  public getAssassinAggressiveness(): number {
    return this.getDifficultyConfig().assassinAggressiveness;
  }
  
  public getDifficultyStats(): DifficultyStats {
    return {
      currentLevel: this.currentDifficulty,
      timeInDifficulty: (Date.now() - this.difficultyStartTime) / 1000,
      highestLevelReached: this.highestDifficultyReached,
      difficultyChanges: this.difficultyChangeCount,
      currentMultipliers: {
        spawnRate: this.getSpawnRateMultiplier(),
        speed: this.getSpeedMultiplier()
      }
    };
  }
  
  public forceDifficulty(level: DifficultyLevel): void {
    this.setDifficulty(level, 'adaptive');
  }
  
  public reset(): void {
    this.currentDifficulty = DifficultyLevel.EASY;
    this.gameStartTime = Date.now();
    this.difficultyStartTime = this.gameStartTime;
    this.difficultyChangeCount = 0;
    this.performanceMetrics = {
      livesLostInLastMinute: 0,
      scoreGainRate: 0,
      streakFrequency: 0,
      lastDeathTime: 0,
      scoreHistory: []
    };
    
    // Reset visual elements
    const config = this.getDifficultyConfig();
    this.scene.cameras.main.setBackgroundColor(config.backgroundTint);
  }
  
  public destroy(): void {
    if (this.timeCheckTimer) {
      this.timeCheckTimer.destroy();
    }
    if (this.adaptiveCheckTimer) {
      this.adaptiveCheckTimer.destroy();
    }
    
    this.scene.events.off('scoreChanged', this.checkScoreDifficulty, this);
    this.scene.events.off('lifeLost', this.trackLifeLoss, this);
    this.scene.events.off('streakAchieved', this.trackStreak, this);
    
    this.removeAllListeners();
  }
}