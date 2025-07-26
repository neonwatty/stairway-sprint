import Phaser from 'phaser';
import { BaseEntity } from './BaseEntity';
import { AnimationManager } from '../managers/AnimationManager';

export enum HazardType {
  LAWNMOWER = 'hazard-lawnmower',
  CRATE = 'hazard-crate',
  TRASHCAN = 'hazard-trashcan'
}

export class Hazard extends BaseEntity {
  private hazardType: HazardType;
  private animationManager?: AnimationManager;
  private wobbleAnimation?: Phaser.Tweens.Tween;
  private currentAnimationId?: string;
  
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'hazard-lawnmower');
    
    this.hazardType = HazardType.LAWNMOWER;
    this.setDepth(5);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(40, 40);
    body.setOffset(5, 5);
  }
  
  public spawn(lane: number, speed: number, x?: number, y?: number): void {
    const types = Object.values(HazardType);
    this.hazardType = types[Phaser.Math.Between(0, types.length - 1)];
    this.setTexture(this.hazardType);
    
    super.spawn(lane, speed, x, y);
  }
  
  protected onSpawn(): void {
    switch (this.hazardType) {
      case HazardType.LAWNMOWER:
        this.setScale(0.8);
        // Rotating blade animation
        this.wobbleAnimation = this.scene.tweens.add({
          targets: this,
          angle: 360,
          duration: 2000,
          repeat: -1,
          ease: 'Linear'
        });
        break;
        
      case HazardType.CRATE:
        this.setScale(0.9);
        // Slight wobble like it's unstable
        this.wobbleAnimation = this.scene.tweens.add({
          targets: this,
          angle: { from: -3, to: 3 },
          duration: 1500,
          repeat: -1,
          yoyo: true,
          ease: 'Sine.easeInOut'
        });
        break;
        
      case HazardType.TRASHCAN:
        this.setScale(0.85);
        // Subtle bounce animation
        this.wobbleAnimation = this.scene.tweens.add({
          targets: this,
          scaleY: { from: 0.85, to: 0.9 },
          duration: 1200,
          repeat: -1,
          yoyo: true,
          ease: 'Sine.easeInOut'
        });
        break;
    }
  }
  
  protected onDeactivate(): void {
    if (this.wobbleAnimation) {
      this.wobbleAnimation.stop();
      this.wobbleAnimation = undefined;
    }
    this.setAngle(0);
    this.setScale(0.8);
    this.setAlpha(1);
  }
  
  protected onUpdate(): void {
    // Additional update logic if needed
  }
  
  public getHazardType(): HazardType {
    return this.hazardType;
  }
}