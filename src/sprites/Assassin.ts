import Phaser from 'phaser';
import { BaseEntity } from './BaseEntity';
import { VIP } from './VIP';

export class Assassin extends BaseEntity {
  private target?: VIP;
  private baseSpeed: number = 150;
  private aggressiveMovement: boolean = true;
  
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'assassin');
    
    this.setDepth(7);
    this.setScale(0.85);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(40, 50);
    body.setOffset(5, 5);
  }
  
  public setTarget(vip: VIP): void {
    this.target = vip;
  }
  
  protected onSpawn(): void {
    this.aggressiveMovement = true;
    
    this.scene.tweens.add({
      targets: this,
      tint: { from: 0xff0000, to: 0xcc0000 },
      duration: 500,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
    
    this.scene.tweens.add({
      targets: this,
      angle: { from: -5, to: 5 },
      duration: 200,
      repeat: -1,
      yoyo: true,
      ease: 'Linear'
    });
  }
  
  protected onDeactivate(): void {
    this.target = undefined;
    this.aggressiveMovement = true;
    this.setAngle(0);
    this.clearTint();
  }
  
  protected onUpdate(): void {
    if (!this.aggressiveMovement) return;
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    
    if (this.target && this.target.active && !this.target.isProtected()) {
      const targetLane = this.target.getCurrentLane();
      const currentLane = this.currentLane;
      
      if (targetLane !== currentLane && this.laneManager) {
        const laneTime = this.scene.time.now;
        const switchInterval = 1000;
        
        if (!this.getData('lastLaneSwitch') || laneTime - this.getData('lastLaneSwitch') > switchInterval) {
          if (targetLane < currentLane) {
            this.moveLane(-1);
          } else if (targetLane > currentLane) {
            this.moveLane(1);
          }
          this.setData('lastLaneSwitch', laneTime);
        }
      }
      
      const distanceToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
      if (distanceToTarget < 200) {
        body.setVelocityY(this.baseSpeed * 1.5);
      } else {
        body.setVelocityY(this.baseSpeed * 1.2);
      }
    } else {
      body.setVelocityY(this.baseSpeed * 1.2);
    }
  }
  
  private moveLane(direction: number): void {
    if (!this.laneManager) return;
    
    const newLane = this.currentLane + direction;
    if (newLane >= 0 && newLane < this.laneManager.getLaneCount()) {
      this.laneManager.unregisterEntity(this, this.currentLane);
      this.currentLane = newLane;
      this.laneManager.registerEntity(this, this.currentLane);
      
      const targetX = this.laneManager.getLanePosition(this.currentLane);
      this.scene.tweens.add({
        targets: this,
        x: targetX,
        duration: 300,
        ease: 'Power2'
      });
    }
  }
  
  public eliminate(): void {
    this.aggressiveMovement = false;
    this.setTint(0x666666);
    
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      angle: 720,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.deactivate();
      }
    });
  }
}