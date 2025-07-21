import Phaser from 'phaser';
import { BaseEntity } from './BaseEntity';

export class VIP extends BaseEntity {
  private glowEffect?: Phaser.GameObjects.Graphics;
  private protected: boolean = false;
  
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'vip');
    
    this.setDepth(6);
    this.setScale(0.9);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(45, 60);
    body.setOffset(7, 5);
    
    this.glowEffect = scene.add.graphics();
    this.glowEffect.setDepth(5);
    this.glowEffect.setVisible(false);
  }
  
  protected onSpawn(): void {
    this.protected = false;
    
    this.scene.tweens.add({
      targets: this,
      scaleX: { from: 0.9, to: 0.95 },
      scaleY: { from: 0.9, to: 0.95 },
      duration: 2000,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
    
    this.createGlowEffect();
  }
  
  private createGlowEffect(): void {
    if (!this.glowEffect) return;
    
    this.glowEffect.setVisible(true);
    
    const updateGlow = () => {
      if (!this.active || !this.glowEffect) return;
      
      this.glowEffect.clear();
      this.glowEffect.lineStyle(3, 0xffd700, 0.5);
      this.glowEffect.strokeCircle(this.x, this.y, 35);
      
      this.glowEffect.lineStyle(2, 0xffd700, 0.3);
      this.glowEffect.strokeCircle(this.x, this.y, 40);
    };
    
    this.scene.events.on('postupdate', updateGlow);
    
    this.scene.tweens.add({
      targets: this.glowEffect,
      alpha: { from: 0.3, to: 0.7 },
      duration: 1000,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }
  
  protected onDeactivate(): void {
    if (this.glowEffect) {
      this.glowEffect.clear();
      this.glowEffect.setVisible(false);
    }
    this.setScale(0.9);
    this.protected = false;
  }
  
  protected onUpdate(): void {
    // VIPs move at 80% of their initial speed
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.y > 0) {
      body.setVelocityY(this.speed * 0.8);
    }
  }
  
  public protect(): void {
    this.protected = true;
    this.setTint(0x00ff00);
    
    this.scene.time.delayedCall(1000, () => {
      this.clearTint();
    });
  }
  
  public isProtected(): boolean {
    return this.protected;
  }
  
  destroy(): void {
    if (this.glowEffect) {
      this.glowEffect.destroy();
    }
    super.destroy();
  }
}