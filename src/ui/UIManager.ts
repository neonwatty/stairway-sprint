import Phaser from 'phaser';
import { ScoreManager } from '../managers/ScoreManager';
import { LivesManager } from '../managers/LivesManager';
import { ResponsiveUtils, FontSize, getResponsive } from '../utils/ResponsiveUtils';
import { AccessibilityManager } from '../managers/AccessibilityManager';
import { UISoundManager } from '../managers/UISoundManager';

export class UIManager {
  private scene: Phaser.Scene;
  private scoreManager: ScoreManager;
  private livesManager: LivesManager;
  private responsive: ResponsiveUtils;
  private accessibilityManager?: AccessibilityManager;
  private uiSoundManager?: UISoundManager;
  
  // UI Elements
  private scoreText!: Phaser.GameObjects.Text;
  private streakText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private heartIcons: Phaser.GameObjects.Image[] = [];
  private pauseButton!: Phaser.GameObjects.Image;
  
  // Animation tracking
  private lastScore: number = 0;
  private lastStreak: number = 0;
  
  // Timer properties
  private startTime: number = 0;
  private elapsedTime: number = 0;
  private isTimerRunning: boolean = false;
  
  constructor(scene: Phaser.Scene, scoreManager: ScoreManager, livesManager: LivesManager) {
    this.scene = scene;
    this.scoreManager = scoreManager;
    this.livesManager = livesManager;
    this.responsive = getResponsive(scene);
  }
  
  /**
   * Set accessibility manager for enhanced UI features
   */
  public setAccessibilityManager(manager: AccessibilityManager): void {
    this.accessibilityManager = manager;
  }
  
  /**
   * Set UI sound manager
   */
  public setUISoundManager(manager: UISoundManager): void {
    this.uiSoundManager = manager;
  }
  
  /**
   * Initialize all UI elements
   */
  public create(): void {
    const { width } = this.scene.cameras.main;
    const padding = this.responsive.getPadding();
    const spacing = this.responsive.getSpacing();
    const safeArea = this.responsive.getSafeAreaInsets();
    
    // Apply accessibility settings if available
    const settings = this.accessibilityManager?.getSettings();
    
    // Create score display (top-left)
    this.createScoreDisplay(padding.x + safeArea.left, padding.y + safeArea.top);
    
    // Create streak counter (below score)
    this.createStreakDisplay(padding.x + safeArea.left, padding.y + safeArea.top + spacing * 2);
    
    // Create timer (top-center)
    this.createTimerDisplay(width / 2, padding.y + safeArea.top);
    
    // Create lives display (top-right)
    const livesX = width - this.responsive.scale(150) - safeArea.right;
    this.createLivesDisplay(livesX, padding.y + safeArea.top + spacing * 0.5);
    
    // Create pause button (top-right, below lives)
    const pauseX = width - this.responsive.scale(60) - safeArea.right;
    this.createPauseButton(pauseX, padding.y + safeArea.top + spacing * 3);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start the timer
    this.startTimer();
    
    // Set up resize handler
    this.scene.scale.on('resize', this.handleResize, this);
  }
  
  /**
   * Create score display in top-left corner
   */
  private createScoreDisplay(x: number, y: number): void {
    const settings = this.accessibilityManager?.getSettings();
    const textColor = settings?.highContrast ? '#ffff00' : '#ffffff';
    const style = this.responsive.getFontStyle(FontSize.LARGE, textColor);
    this.scoreText = this.scene.add.text(x, y, 'Score: 0', {
      ...style,
      stroke: '#000000',
      strokeThickness: this.responsive.scale(settings?.highContrast ? 6 : 4)
    });
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(100);
  }
  
  /**
   * Create streak counter below score
   */
  private createStreakDisplay(x: number, y: number): void {
    const style = this.responsive.getFontStyle(FontSize.NORMAL, '#ffff00');
    this.streakText = this.scene.add.text(x, y, 'Streak: 0', {
      ...style,
      stroke: '#000000',
      strokeThickness: this.responsive.scale(3)
    });
    this.streakText.setScrollFactor(0);
    this.streakText.setDepth(100);
  }
  
  /**
   * Create timer display in top-center
   */
  private createTimerDisplay(x: number, y: number): void {
    const style = this.responsive.getFontStyle(FontSize.NORMAL, '#ffffff');
    this.timerText = this.scene.add.text(x, y, 'Time: 0s', {
      ...style,
      stroke: '#000000',
      strokeThickness: this.responsive.scale(4)
    });
    this.timerText.setOrigin(0.5, 0);
    this.timerText.setScrollFactor(0);
    this.timerText.setDepth(100);
  }
  
  /**
   * Create lives display in top-right corner
   */
  private createLivesDisplay(x: number, y: number): void {
    const spacing = this.responsive.scale(40);
    const maxLives = this.livesManager.getMaxLives();
    const currentLives = this.livesManager.getLives();
    const scale = this.responsive.getUIScale();
    
    for (let i = 0; i < maxLives; i++) {
      const heartTexture = i < currentLives ? 'heart-full' : 'heart-empty';
      const heart = this.scene.add.image(x + i * spacing, y, heartTexture);
      heart.setScale(scale);
      heart.setScrollFactor(0);
      heart.setDepth(100);
      
      if (i >= currentLives) {
        heart.setAlpha(0.5);
      }
      
      this.heartIcons.push(heart);
    }
  }
  
  /**
   * Create pause button in top-right corner
   */
  private createPauseButton(x: number, y: number): void {
    const scale = this.responsive.getUIScale();
    const touchSize = this.responsive.getTouchTargetSize();
    
    this.pauseButton = this.scene.add.image(x, y, 'pause-icon');
    this.pauseButton.setScale(scale * 1.2);
    this.pauseButton.setScrollFactor(0);
    this.pauseButton.setDepth(100);
    
    // Make button interactive with proper touch target size
    const hitAreaSize = touchSize / 2;
    this.pauseButton.setInteractive({ 
      useHandCursor: true,
      hitArea: new Phaser.Geom.Rectangle(-hitAreaSize, -hitAreaSize, touchSize, touchSize),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains
    });
    
    // Visual feedback on hover
    this.pauseButton.on('pointerover', () => {
      this.pauseButton.setAlpha(0.8);
      this.pauseButton.setScale(scale * 1.3);
    });
    
    this.pauseButton.on('pointerout', () => {
      this.pauseButton.setAlpha(1);
      this.pauseButton.setScale(scale * 1.2);
    });
    
    // Visual feedback on press
    this.pauseButton.on('pointerdown', () => {
      this.pauseButton.setScale(scale * 1.1);
      // Play click sound using UI sound manager
      if (this.uiSoundManager) {
        this.uiSoundManager.playClick();
      } else if (this.scene.sound.get('sfx-collect')) {
        this.scene.sound.play('sfx-collect', { volume: 0.5 });
      }
    });
    
    // Handle click/tap
    this.pauseButton.on('pointerup', () => {
      this.pauseButton.setScale(scale * 1.2);
      // Emit pause event
      this.scene.events.emit('pauseGame');
    });
  }
  
  /**
   * Set up event listeners for UI updates
   */
  private setupEventListeners(): void {
    // Score change events
    this.scoreManager.getEvents().on('scoreChanged', (score: number) => {
      this.updateScore(score);
    });
    
    // Streak change events
    this.scoreManager.getEvents().on('streakChanged', (streak: number) => {
      this.updateStreak(streak);
    });
    
    // Lives change events
    this.livesManager.getEvents().on('lifeChanged', (lives: number) => {
      this.updateLives(lives);
    });
  }
  
  /**
   * Update score display with animation
   */
  private updateScore(score: number): void {
    this.scoreText.setText(`Score: ${score}`);
    
    // Only animate if score actually changed
    if (score !== this.lastScore) {
      // Quick scale tween (1.2x for 200ms)
      this.scene.tweens.add({
        targets: this.scoreText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Power2'
      });
      
      this.lastScore = score;
    }
  }
  
  /**
   * Update streak display with animation
   */
  private updateStreak(streak: number): void {
    this.streakText.setText(`Streak: ${streak}`);
    
    if (streak > this.lastStreak) {
      // Pulse effect (scale 1.0 to 1.3 and back) when streak increases
      this.scene.tweens.add({
        targets: this.streakText,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 300,
        yoyo: true,
        ease: 'Back.easeOut'
      });
      
      // Color flash for milestone streaks (every 5)
      if (streak % 5 === 0 && streak > 0) {
        // Create color flash: yellow -> white -> yellow
        this.scene.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 600,
          yoyo: true,
          onUpdate: (tween) => {
            const progress = tween.getValue();
            // Interpolate between yellow (#ffff00) and white (#ffffff)
            const red = 255;
            const green = 255;
            const blue = Math.floor(255 * progress); // 0 to 255
            const color = Phaser.Display.Color.GetColor(red, green, blue);
            this.streakText.setTint(color);
          },
          onComplete: () => {
            // Reset to original yellow tint
            this.streakText.clearTint();
          }
        });
        
        // Play powerup sound for milestone
        if (this.uiSoundManager) {
          this.uiSoundManager.playSuccess();
        } else if (this.scene.sound.get('sfx-powerup')) {
          this.scene.sound.play('sfx-powerup', { volume: 0.6 });
        }
      }
    }
    
    this.lastStreak = streak;
  }
  
  /**
   * Update lives display
   */
  private updateLives(lives: number): void {
    for (let i = 0; i < this.heartIcons.length; i++) {
      if (i < lives) {
        this.heartIcons[i].setTexture('heart-full');
        this.heartIcons[i].setAlpha(1);
      } else {
        this.heartIcons[i].setTexture('heart-empty');
        this.heartIcons[i].setAlpha(0.5);
      }
    }
  }
  
  /**
   * Start the timer
   */
  public startTimer(): void {
    this.startTime = this.scene.time.now;
    this.isTimerRunning = true;
  }
  
  /**
   * Stop the timer
   */
  public stopTimer(): void {
    this.isTimerRunning = false;
  }
  
  /**
   * Resume the timer
   */
  public resumeTimer(): void {
    if (!this.isTimerRunning) {
      this.startTime = this.scene.time.now - this.elapsedTime;
      this.isTimerRunning = true;
    }
  }
  
  /**
   * Update timer display - should be called from GameScene's update method
   */
  public updateTimer(): void {
    if (this.isTimerRunning) {
      this.elapsedTime = this.scene.time.now - this.startTime;
      const seconds = Math.floor(this.elapsedTime / 1000);
      this.timerText.setText(`Time: ${seconds}s`);
    }
  }
  
  /**
   * Get elapsed time in milliseconds
   */
  public getElapsedTime(): number {
    return this.elapsedTime;
  }
  
  /**
   * Handle window resize events
   */
  private handleResize(): void {
    // Update responsive utilities
    this.responsive.update();
    
    // Update layout
    this.updateLayout();
    
    // Update font sizes
    this.updateFontSizes();
  }
  
  /**
   * Update UI element positions for responsive design
   */
  public updateLayout(): void {
    const { width } = this.scene.cameras.main;
    const padding = this.responsive.getPadding();
    const spacing = this.responsive.getSpacing();
    const safeArea = this.responsive.getSafeAreaInsets();
    
    // Update score and streak positions
    if (this.scoreText) {
      this.scoreText.setPosition(padding.x + safeArea.left, padding.y + safeArea.top);
    }
    
    if (this.streakText) {
      this.streakText.setPosition(padding.x + safeArea.left, padding.y + safeArea.top + spacing * 2);
    }
    
    // Update timer position to stay centered
    if (this.timerText) {
      this.timerText.setX(width / 2);
      this.timerText.setY(padding.y + safeArea.top);
    }
    
    // Update lives position to stay at right edge
    if (this.heartIcons.length > 0) {
      const startX = width - this.responsive.scale(150) - safeArea.right;
      const heartSpacing = this.responsive.scale(40);
      const scale = this.responsive.getUIScale();
      
      for (let i = 0; i < this.heartIcons.length; i++) {
        this.heartIcons[i].setX(startX + i * heartSpacing);
        this.heartIcons[i].setY(padding.y + safeArea.top + spacing * 0.5);
        this.heartIcons[i].setScale(scale);
      }
    }
    
    // Update pause button position
    if (this.pauseButton) {
      const pauseX = width - this.responsive.scale(60) - safeArea.right;
      this.pauseButton.setX(pauseX);
      this.pauseButton.setY(padding.y + safeArea.top + spacing * 3);
      this.pauseButton.setScale(this.responsive.getUIScale() * 1.2);
    }
  }
  
  /**
   * Update font sizes for all text elements
   */
  private updateFontSizes(): void {
    // Update score text
    if (this.scoreText) {
      const style = this.responsive.getFontStyle(FontSize.LARGE, '#ffffff');
      if (typeof style.fontSize === 'number') {
        this.scoreText.setFontSize(style.fontSize);
      } else if (typeof style.fontSize === 'string') {
        this.scoreText.setFontSize(parseInt(style.fontSize));
      }
      this.scoreText.setStroke('#000000', this.responsive.scale(4));
    }
    
    // Update streak text
    if (this.streakText) {
      const style = this.responsive.getFontStyle(FontSize.NORMAL, '#ffff00');
      if (typeof style.fontSize === 'number') {
        this.streakText.setFontSize(style.fontSize);
      } else if (typeof style.fontSize === 'string') {
        this.streakText.setFontSize(parseInt(style.fontSize));
      }
      this.streakText.setStroke('#000000', this.responsive.scale(3));
    }
    
    // Update timer text
    if (this.timerText) {
      const style = this.responsive.getFontStyle(FontSize.NORMAL, '#ffffff');
      if (typeof style.fontSize === 'number') {
        this.timerText.setFontSize(style.fontSize);
      } else if (typeof style.fontSize === 'string') {
        this.timerText.setFontSize(parseInt(style.fontSize));
      }
      this.timerText.setStroke('#000000', this.responsive.scale(4));
    }
  }
  
  /**
   * Clean up UI elements
   */
  public destroy(): void {
    // Remove event listeners
    this.scoreManager.getEvents().off('scoreChanged');
    this.scoreManager.getEvents().off('streakChanged');
    this.livesManager.getEvents().off('lifeChanged');
    
    // Remove resize listener
    this.scene.scale.off('resize', this.handleResize, this);
    
    // Destroy text elements
    if (this.scoreText) this.scoreText.destroy();
    if (this.streakText) this.streakText.destroy();
    if (this.timerText) this.timerText.destroy();
    
    // Destroy pause button
    if (this.pauseButton) {
      this.pauseButton.removeAllListeners();
      this.pauseButton.destroy();
    }
    
    // Destroy heart icons
    this.heartIcons.forEach(heart => heart.destroy());
    this.heartIcons = [];
  }
}