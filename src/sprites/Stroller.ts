import Phaser from 'phaser';
import { BaseEntity } from './BaseEntity';

export class Stroller extends BaseEntity {
  private rollAnimation?: Phaser.Tweens.Tween;
  
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'stroller');
    
    this.setDepth(5);
    this.setScale(0.8);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(50, 50);
    body.setOffset(5, 5);
  }
  
  protected onSpawn(): void {
    this.rollAnimation = this.scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 2000,
      repeat: -1,
      ease: 'Linear'
    });
    
    this.setTint(Phaser.Math.Between(0xcccccc, 0xffffff));
  }
  
  protected onDeactivate(): void {
    if (this.rollAnimation) {
      this.rollAnimation.stop();
      this.rollAnimation = undefined;
    }
    this.setAngle(0);
    this.clearTint();
  }
  
  protected onUpdate(): void {
    // Additional update logic if needed
  }
}