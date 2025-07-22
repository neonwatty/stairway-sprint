import Phaser from 'phaser';
import { LaneManager } from '../utils/LaneManager';

export abstract class BaseEntity extends Phaser.GameObjects.Sprite {
  protected currentLane: number;
  protected speed: number;
  protected laneManager?: LaneManager;
  private wasOnScreen: boolean = false;
  private screenBuffer: number = 100; // Buffer zone for edge cases
  
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
    body.enable = true; // Ensure physics is enabled when spawning
    
    this.wasOnScreen = false;
    this.onSpawn();
  }
  
  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.enable = false; // Disable physics when deactivated
    
    if (this.laneManager) {
      this.laneManager.unregisterEntity(this, this.currentLane);
    }
    
    this.wasOnScreen = false;
    this.onDeactivate();
  }
  
  update(): void {
    if (!this.active) return;
    
    // Check if entity is off-screen (with buffer)
    const camera = this.scene.cameras.main;
    const isOnScreen = this.isWithinScreen(camera);
    
    // Optimize physics for off-screen entities
    if (isOnScreen !== this.wasOnScreen) {
      this.togglePhysics(isOnScreen);
      this.wasOnScreen = isOnScreen;
    }
    
    // Deactivate if too far below screen
    if (this.y > camera.height + 100) {
      this.deactivate();
    }
    
    this.onUpdate();
  }
  
  private isWithinScreen(camera: Phaser.Cameras.Scene2D.Camera): boolean {
    const leftBound = camera.scrollX - this.screenBuffer;
    const rightBound = camera.scrollX + camera.width + this.screenBuffer;
    const topBound = camera.scrollY - this.screenBuffer;
    const bottomBound = camera.scrollY + camera.height + this.screenBuffer;
    
    return (
      this.x >= leftBound &&
      this.x <= rightBound &&
      this.y >= topBound &&
      this.y <= bottomBound
    );
  }
  
  private togglePhysics(enable: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = enable;
      
      // If enabling physics, restore velocity
      if (enable && this.speed > 0) {
        body.setVelocityY(this.speed);
      }
    }
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