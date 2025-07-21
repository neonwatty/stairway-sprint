import Phaser from 'phaser';
import { LaneManager } from '../utils/LaneManager';

export abstract class BaseEntity extends Phaser.GameObjects.Sprite {
  protected currentLane: number;
  protected speed: number;
  protected laneManager?: LaneManager;
  
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.currentLane = 0;
    this.speed = 100;
    
    this.setActive(false);
    this.setVisible(false);
  }
  
  public setLaneManager(laneManager: LaneManager): void {
    this.laneManager = laneManager;
  }
  
  public spawn(lane: number, speed: number, x?: number, y?: number): void {
    this.currentLane = lane;
    this.speed = speed;
    
    if (this.laneManager) {
      const laneX = this.laneManager.getLanePosition(lane);
      this.setPosition(x || laneX, y || -50);
      this.laneManager.registerEntity(this, lane);
    }
    
    this.setActive(true);
    this.setVisible(true);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(this.speed);
    
    this.onSpawn();
  }
  
  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    
    if (this.laneManager) {
      this.laneManager.unregisterEntity(this, this.currentLane);
    }
    
    this.onDeactivate();
  }
  
  update(): void {
    if (!this.active) return;
    
    if (this.y > this.scene.cameras.main.height + 100) {
      this.deactivate();
    }
    
    this.onUpdate();
  }
  
  protected abstract onSpawn(): void;
  protected abstract onDeactivate(): void;
  protected abstract onUpdate(): void;
  
  public getCurrentLane(): number {
    return this.currentLane;
  }
  
  public getSpeed(): number {
    return this.speed;
  }
}