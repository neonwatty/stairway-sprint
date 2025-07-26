import Phaser from 'phaser';
import { BaseEntity } from './BaseEntity';
import { AnimationManager } from '../managers/AnimationManager';

export class Stroller extends BaseEntity {
  private animationManager?: AnimationManager;
  private rollAnimationId?: string;
  private bounceAnimationId?: string;
  private rollAnimation?: Phaser.Tweens.Tween; // Fallback for non-AnimationManager scenes
  private strollerType: number = 1;
  
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'stroller-1');
    
    this.setDepth(5);
    this.setScale(0.8);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(50, 50);
    body.setOffset(5, 5);
  }
  
  public setAnimationManager(animationManager: AnimationManager): void {
    this.animationManager = animationManager;
  }
  
  protected onSpawn(): void {
    // Randomize stroller type and appearance
    this.strollerType = Phaser.Math.Between(1, 3);
    this.setTexture(`stroller-${this.strollerType}`);
    this.setTint(Phaser.Math.Between(0xcccccc, 0xffffff));
    
    if (this.animationManager) {
      // Enhanced rolling animation with sprite cycling
      this.animationManager.playAnimation(this, 'stroller-rolling');
      
      // Add continuous rotation for rolling effect
      this.rollAnimationId = this.animationManager.createTweenAnimation(
        this,
        { angle: 360 },
        2000,
        'Linear'
      );
      
      // Add subtle bounce animation
      this.bounceAnimationId = this.animationManager.createBounceAnimation(this, 0.05, 600);
      
      // Add random wobble effect
      if (Math.random() < 0.3) {
        this.animationManager.createTweenAnimation(
          this,
          { 
            scaleX: { from: 0.8, to: 0.85 },
            scaleY: { from: 0.8, to: 0.75 }
          },
          1500,
          'Sine.easeInOut'
        );
      }
    } else {
      // Fallback to basic animation
      this.rollAnimation = this.scene.tweens.add({
        targets: this,
        angle: 360,
        duration: 2000,
        repeat: -1,
        ease: 'Linear'
      });
    }
  }
  
  protected onDeactivate(): void {
    if (this.animationManager) {
      this.animationManager.stopAllAnimationsForTarget(this);
      this.rollAnimationId = undefined;
      this.bounceAnimationId = undefined;
    } else if (this.rollAnimation) {
      this.rollAnimation.stop();
      this.rollAnimation = undefined;
    }
    
    this.setAngle(0);
    this.setScale(0.8);
    this.clearTint();
  }
  
  protected onUpdate(): void {
    // Additional update logic if needed
  }
}