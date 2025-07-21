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
    const spacing = 40;
    
    for (let i = 0; i < this.maxLives; i++) {
      const heart = this.scene.add.image(x + i * spacing, y, 'heart-full');
      heart.setScale(1.2);
      heart.setScrollFactor(0);
      heart.setDepth(100);
      this.heartIcons.push(heart);
    }
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
    for (let i = 0; i < this.heartIcons.length; i++) {
      if (i < this.lives) {
        this.heartIcons[i].setTexture('heart-full');
        this.heartIcons[i].setAlpha(1);
      } else {
        this.heartIcons[i].setTexture('heart-empty');
        this.heartIcons[i].setAlpha(0.5);
      }
    }
  }
  
  private playLifeLossAnimation(): void {
    if (this.lives >= 0 && this.lives < this.heartIcons.length) {
      const lostHeart = this.heartIcons[this.lives];
      
      this.scene.tweens.add({
        targets: lostHeart,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          lostHeart.setTexture('heart-empty');
          lostHeart.setAlpha(0.5);
          lostHeart.setScale(1.2);
        }
      });
      
      // Only do camera effects if not game over
      if (this.lives > 0) {
        this.scene.cameras.main.shake(300, 0.02);
        this.scene.cameras.main.flash(300, 255, 0, 0, false, 0.3);
      }
    }
  }
  
  private playLifeGainAnimation(): void {
    if (this.lives > 0 && this.lives <= this.heartIcons.length) {
      const gainedHeart = this.heartIcons[this.lives - 1];
      
      this.scene.tweens.add({
        targets: gainedHeart,
        scaleX: { from: 0, to: 1.5 },
        scaleY: { from: 0, to: 1.5 },
        duration: 300,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.scene.tweens.add({
            targets: gainedHeart,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            ease: 'Power2'
          });
        }
      });
      
      const emitter = this.scene.add.particles(gainedHeart.x, gainedHeart.y, 'star', {
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
    this.heartIcons.forEach(heart => heart.destroy());
    this.heartIcons = [];
  }
}