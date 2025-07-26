import Phaser from 'phaser';
import { BaseEntity } from './BaseEntity';
import { AnimationManager } from '../managers/AnimationManager';

export class VIP extends BaseEntity {
  private animationManager?: AnimationManager;
  private glowEffect?: Phaser.GameObjects.Graphics;
  private protected: boolean = false;
  private breathingAnimationId?: string;
  private glowAnimationId?: string;
  
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
  
  public setAnimationManager(animationManager: AnimationManager): void {
    this.animationManager = animationManager;
  }
  
  protected onSpawn(): void {
    this.protected = false;
    
    if (this.animationManager) {
      // Enhanced VIP animations
      this.animationManager.playAnimation(this, 'vip-idle');
      
      // Breathing animation
      this.breathingAnimationId = this.animationManager.createTweenAnimation(
        this,
        { 
          scaleX: { from: 0.9, to: 0.95 },
          scaleY: { from: 0.9, to: 0.95 }
        },
        2000,
        'Sine.easeInOut'
      );
      
      // Add dignified floating animation
      this.animationManager.createFloatAnimation(this, 5, 4000);
      
      // Add occasional subtle glow pulse
      if (Math.random() < 0.5) {
        this.glowAnimationId = this.animationManager.createTweenAnimation(
          this,
          { alpha: { from: 1, to: 0.8 } },
          1500,
          'Sine.easeInOut'
        );
      }
    } else {
      // Fallback animation
      this.scene.tweens.add({
        targets: this,
        scaleX: { from: 0.9, to: 0.95 },
        scaleY: { from: 0.9, to: 0.95 },
        duration: 2000,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }
    
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
    if (this.animationManager) {
      this.animationManager.stopAllAnimationsForTarget(this);
      this.breathingAnimationId = undefined;
      this.glowAnimationId = undefined;
    }
    
    if (this.glowEffect) {
      this.glowEffect.clear();
      this.glowEffect.setVisible(false);
    }
    this.setScale(0.9);
    this.setAlpha(1);
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
    
    if (this.animationManager) {
      // Enhanced protection animation
      this.setTint(0x00ff00);
      
      // Add celebratory bounce
      this.animationManager.createBounceAnimation(this, 0.3, 400);
      
      // Add protective shimmer effect
      this.animationManager.createTweenAnimation(
        this,
        { alpha: { from: 1, to: 0.7 } },
        200,
        'Sine.easeInOut'
      );
      
      // Add scale pulse for protection
      this.animationManager.createPulseAnimation(this, 1.1, 600, 2);
      
      this.scene.time.delayedCall(1000, () => {
        this.clearTint();
        if (this.animationManager) {
          this.animationManager.createFadeAnimation(this, 1, 300);
        }
      });
    } else {
      // Fallback animation
      this.setTint(0x00ff00);
      this.scene.time.delayedCall(1000, () => {
        this.clearTint();
      });
    }
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