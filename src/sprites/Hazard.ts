import Phaser from 'phaser';
import { BaseEntity } from './BaseEntity';

export enum HazardType {
  CONE = 'cone',
  BANANA = 'banana-peel',
  PUDDLE = 'puddle'
}

export class Hazard extends BaseEntity {
  private hazardType: HazardType;
  private wobbleAnimation?: Phaser.Tweens.Tween;
  
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'cone');
    
    this.hazardType = HazardType.CONE;
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
      case HazardType.CONE:
        this.setScale(0.8);
        this.wobbleAnimation = this.scene.tweens.add({
          targets: this,
          angle: { from: -5, to: 5 },
          duration: 1000,
          repeat: -1,
          yoyo: true,
          ease: 'Sine.easeInOut'
        });
        break;
        
      case HazardType.BANANA:
        this.setScale(0.7);
        this.wobbleAnimation = this.scene.tweens.add({
          targets: this,
          scaleX: { from: 0.7, to: 0.75 },
          scaleY: { from: 0.7, to: 0.65 },
          duration: 800,
          repeat: -1,
          yoyo: true,
          ease: 'Sine.easeInOut'
        });
        break;
        
      case HazardType.PUDDLE:
        this.setScale(0.9);
        this.wobbleAnimation = this.scene.tweens.add({
          targets: this,
          alpha: { from: 0.7, to: 1 },
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