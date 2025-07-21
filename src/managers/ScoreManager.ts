import Phaser from 'phaser';

export class ScoreManager {
  private scene: Phaser.Scene;
  private score: number = 0;
  private highScore: number = 0;
  private streak: number = 0;
  private scoreText?: Phaser.GameObjects.Text;
  private streakText?: Phaser.GameObjects.Text;
  private highScoreText?: Phaser.GameObjects.Text;
  private events: Phaser.Events.EventEmitter;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.events = new Phaser.Events.EventEmitter();
    this.loadHighScore();
  }
  
  public createDisplay(x: number, y: number): void {
    this.scoreText = this.scene.add.text(x, y, 'Score: 0', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(100);
    
    this.streakText = this.scene.add.text(x, y + 40, 'Streak: 0', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.streakText.setScrollFactor(0);
    this.streakText.setDepth(100);
    
    this.highScoreText = this.scene.add.text(x, y + 75, `High: ${this.highScore}`, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.highScoreText.setScrollFactor(0);
    this.highScoreText.setDepth(100);
  }
  
  public addPoints(points: number): void {
    const previousScore = this.score;
    this.score = Math.max(0, this.score + points);
    this.updateScoreDisplay();
    
    if (points > 0) {
      this.showFloatingText(points, 0x00ff00);
    } else if (points < 0) {
      this.showFloatingText(points, 0xff0000);
    }
    
    this.events.emit('scoreChanged', this.score, previousScore);
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
      this.updateHighScoreDisplay();
      this.events.emit('newHighScore', this.highScore);
    }
  }
  
  public addStreak(): void {
    this.streak++;
    this.updateStreakDisplay();
    this.events.emit('streakChanged', this.streak);
    
    if (this.streak >= 10) {
      this.addPoints(10);
      this.showStreakBonus();
      this.resetStreak();
      this.events.emit('perfectStreak');
    }
  }
  
  public resetStreak(): void {
    this.streak = 0;
    this.updateStreakDisplay();
    this.events.emit('streakChanged', this.streak);
  }
  
  public getScore(): number {
    return this.score;
  }
  
  public getHighScore(): number {
    return this.highScore;
  }
  
  public getStreak(): number {
    return this.streak;
  }
  
  public reset(): void {
    this.score = 0;
    this.streak = 0;
    this.updateScoreDisplay();
    this.updateStreakDisplay();
  }
  
  public getEvents(): Phaser.Events.EventEmitter {
    return this.events;
  }
  
  private updateScoreDisplay(): void {
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${this.score}`);
      
      this.scene.tweens.add({
        targets: this.scoreText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true,
        ease: 'Power2'
      });
    }
  }
  
  private updateStreakDisplay(): void {
    if (this.streakText) {
      this.streakText.setText(`Streak: ${this.streak}`);
      
      if (this.streak > 0) {
        this.scene.tweens.add({
          targets: this.streakText,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 150,
          yoyo: true,
          ease: 'Back.easeOut'
        });
      }
    }
  }
  
  private updateHighScoreDisplay(): void {
    if (this.highScoreText) {
      this.highScoreText.setText(`High: ${this.highScore}`);
      
      this.scene.tweens.add({
        targets: this.highScoreText,
        alpha: { from: 0.5, to: 1 },
        scaleX: { from: 1, to: 1.3 },
        scaleY: { from: 1, to: 1.3 },
        duration: 500,
        yoyo: true,
        ease: 'Power2'
      });
    }
  }
  
  private showFloatingText(points: number, color: number): void {
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;
    
    const floatingText = this.scene.add.text(
      centerX + Phaser.Math.Between(-50, 50),
      centerY,
      `${points > 0 ? '+' : ''}${points}`,
      {
        fontSize: '36px',
        fontFamily: 'Arial',
        color: `#${color.toString(16).padStart(6, '0')}`,
        stroke: '#000000',
        strokeThickness: 4
      }
    );
    floatingText.setOrigin(0.5);
    floatingText.setDepth(101);
    
    this.scene.tweens.add({
      targets: floatingText,
      y: centerY - 100,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        floatingText.destroy();
      }
    });
  }
  
  private showStreakBonus(): void {
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;
    
    const bonusText = this.scene.add.text(centerX, centerY - 50, 'PERFECT STREAK!', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 6
    });
    bonusText.setOrigin(0.5);
    bonusText.setDepth(102);
    
    this.scene.tweens.add({
      targets: bonusText,
      scaleX: { from: 0, to: 1.2 },
      scaleY: { from: 0, to: 1.2 },
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(1000, () => {
          this.scene.tweens.add({
            targets: bonusText,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              bonusText.destroy();
            }
          });
        });
      }
    });
  }
  
  private saveHighScore(): void {
    try {
      localStorage.setItem('stairwaySprintHighScore', this.highScore.toString());
    } catch (e) {
      console.warn('Failed to save high score:', e);
    }
  }
  
  private loadHighScore(): void {
    try {
      const savedScore = localStorage.getItem('stairwaySprintHighScore');
      if (savedScore) {
        this.highScore = parseInt(savedScore, 10);
      }
    } catch (e) {
      console.warn('Failed to load high score:', e);
    }
  }
  
  public destroy(): void {
    this.events.removeAllListeners();
    if (this.scoreText) this.scoreText.destroy();
    if (this.streakText) this.streakText.destroy();
    if (this.highScoreText) this.highScoreText.destroy();
  }
}