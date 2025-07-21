import Phaser from 'phaser';
import { LaneManager } from '../utils/LaneManager';

export enum PlayerState {
  IDLE = 'idle',
  MOVING = 'moving',
  SHOOTING = 'shooting',
  HIT = 'hit'
}

export class Player extends Phaser.GameObjects.Sprite {
  private currentLane: number = 1;
  private laneManager?: LaneManager;
  private isMoving: boolean = false;
  private canShoot: boolean = true;
  private shootCooldown: number = 500;
  private invincible: boolean = false;
  private invincibilityDuration: number = 1000;
  private currentState: PlayerState = PlayerState.IDLE;
  private lives: number = 3;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-down');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setDepth(10);
    this.setScale(1);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(40, 60);
    body.setOffset(10, 10);
    
    this.setupAnimations();
    this.setState(PlayerState.IDLE);
  }
  
  public setLaneManager(laneManager: LaneManager): void {
    this.laneManager = laneManager;
    // Update current lane based on position
    this.currentLane = laneManager.getLaneForPosition(this.x);
  }
  
  private setupAnimations(): void {
    this.anims.create({
      key: 'player-idle',
      frames: [{ key: 'player-down' }],
      frameRate: 1,
      repeat: -1
    });
    
    this.anims.create({
      key: 'player-moving-left',
      frames: [{ key: 'player-left' }],
      frameRate: 1,
      repeat: 0
    });
    
    this.anims.create({
      key: 'player-moving-right',
      frames: [{ key: 'player-right' }],
      frameRate: 1,
      repeat: 0
    });
    
    this.anims.create({
      key: 'player-shooting',
      frames: [{ key: 'player-up' }],
      frameRate: 1,
      repeat: 0
    });
  }
  
  public moveLeft(): void {
    if (this.isMoving || !this.laneManager || this.currentLane === 0) return;
    
    this.isMoving = true;
    this.currentLane--;
    this.setState(PlayerState.MOVING);
    
    this.play('player-moving-left');
    
    const targetX = this.laneManager.getLanePosition(this.currentLane);
    this.laneManager.highlightLane(this.currentLane);
    
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.isMoving = false;
        this.setState(PlayerState.IDLE);
        this.play('player-idle');
      }
    });
  }
  
  public moveRight(): void {
    if (this.isMoving || !this.laneManager) return;
    
    const maxLane = this.laneManager.getLaneCount() - 1;
    if (this.currentLane >= maxLane) return;
    
    this.isMoving = true;
    this.currentLane++;
    this.setState(PlayerState.MOVING);
    
    this.play('player-moving-right');
    
    const targetX = this.laneManager.getLanePosition(this.currentLane);
    this.laneManager.highlightLane(this.currentLane);
    
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.isMoving = false;
        this.setState(PlayerState.IDLE);
        this.play('player-idle');
      }
    });
  }
  
  public shoot(): Phaser.GameObjects.Image | null {
    if (!this.canShoot) return null;
    
    this.canShoot = false;
    this.setState(PlayerState.SHOOTING);
    this.play('player-shooting');
    
    const projectile = this.scene.add.image(this.x, this.y - 40, 'projectile');
    this.scene.physics.add.existing(projectile);
    
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(-600);
    
    this.scene.time.delayedCall(100, () => {
      if (this.currentState === PlayerState.SHOOTING) {
        this.setState(PlayerState.IDLE);
        this.play('player-idle');
      }
    });
    
    this.scene.time.delayedCall(this.shootCooldown, () => {
      this.canShoot = true;
    });
    
    return projectile;
  }
  
  public hit(): void {
    if (this.invincible) return;
    
    this.setState(PlayerState.HIT);
    this.lives--;
    
    this.scene.time.delayedCall(500, () => {
      this.setState(PlayerState.IDLE);
    });
  }
  
  public reset(): void {
    if (this.laneManager) {
      this.currentLane = Math.floor(this.laneManager.getLaneCount() / 2);
      this.x = this.laneManager.getLanePosition(this.currentLane);
    }
    this.isMoving = false;
    this.canShoot = true;
    this.invincible = false;
    this.setState(PlayerState.IDLE);
    this.alpha = 1;
  }
  
  private setState(state: PlayerState): void {
    this.currentState = state;
  }
  
  public getState(): PlayerState {
    return this.currentState;
  }
  
  public getLives(): number {
    return this.lives;
  }
  
  public setLives(lives: number): void {
    this.lives = lives;
  }
  
  public getCurrentLane(): number {
    return this.currentLane;
  }
  
  public isInvincible(): boolean {
    return this.invincible;
  }
  
  public setInvincible(invincible: boolean): void {
    this.invincible = invincible;
    
    if (invincible) {
      this.scene.tweens.add({
        targets: this,
        alpha: { from: 1, to: 0.5 },
        duration: 200,
        repeat: -1,
        yoyo: true
      });
    } else {
      this.scene.tweens.killTweensOf(this);
      this.setAlpha(1);
    }
  }
  
  update(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    
    if (this.y < -50 || this.y > this.scene.cameras.main.height + 50) {
      body.setVelocity(0, 0);
      this.destroy();
    }
  }
}