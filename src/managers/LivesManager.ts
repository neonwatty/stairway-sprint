import Phaser from 'phaser';

export class LivesManager {
  private scene: Phaser.Scene;
  private lives: number;
  private maxLives: number;
  private heartIcons: Phaser.GameObjects.Image[] = [];
  private events: Phaser.Events.EventEmitter;
  private invincible: boolean = false;
  private invincibilityDuration: number = 2000;
  
  constructor(scene: Phaser.Scene, startingLives: number = 3) {
    this.scene = scene;
    this.maxLives = startingLives;
    this.lives = startingLives;
    this.events = new Phaser.Events.EventEmitter();
  }
  
  public createDisplay(x: number, y: number): void {
    // Display creation now handled by UIManager
    // This method is kept for compatibility but does nothing
  }
  
  public loseLife(): boolean {
    if (this.invincible || this.lives <= 0) {
      return this.lives <= 0;
    }
    
    this.lives--;
    this.updateHeartDisplay();
    this.playLifeLossAnimation();
    this.startInvincibility();
    
    this.events.emit('lifeChanged', this.lives);
    
    if (this.lives <= 0) {
      this.events.emit('gameOver');
      return true;
    }
    
    return false;
  }
  
  public addLife(): void {
    if (this.lives < this.maxLives) {
      this.lives++;
      this.updateHeartDisplay();
      this.playLifeGainAnimation();
      this.events.emit('lifeChanged', this.lives);
    }
  }
  
  public getLives(): number {
    return this.lives;
  }
  
  public getMaxLives(): number {
    return this.maxLives;
  }
  
  public isInvincible(): boolean {
    return this.invincible;
  }
  
  public reset(): void {
    this.lives = this.maxLives;
    this.invincible = false;
    this.updateHeartDisplay();
  }
  
  public getEvents(): Phaser.Events.EventEmitter {
    return this.events;
  }
  
  private updateHeartDisplay(): void {
    // Heart display is now handled by UIManager through events
  }
  
  private playLifeLossAnimation(): void {
    // Only do camera effects if not game over
    if (this.lives > 0) {
      this.scene.cameras.main.shake(300, 0.02);
      this.scene.cameras.main.flash(300, 255, 0, 0);
    }
  }
  
  private playLifeGainAnimation(): void {
    // Life gain effects are shown at player position
    if (this.lives > 0) {
      const centerX = this.scene.cameras.main.width / 2;
      const centerY = this.scene.cameras.main.height / 2;
      
      const emitter = this.scene.add.particles(centerX, centerY, 'star', {
        speed: { min: 100, max: 200 },
        scale: { start: 0.5, end: 0 },
        lifespan: 500,
        quantity: 10,
        tint: 0xff69b4
      });
      
      this.scene.time.delayedCall(500, () => {
        emitter.destroy();
      });
    }
  }
  
  private startInvincibility(): void {
    this.invincible = true;
    
    this.events.emit('invincibilityStart');
    
    if (this.scene.time) {
      this.scene.time.delayedCall(this.invincibilityDuration, () => {
        this.invincible = false;
        this.events.emit('invincibilityEnd');
      });
    }
  }
  
  public destroy(): void {
    this.events.removeAllListeners();
  }
}