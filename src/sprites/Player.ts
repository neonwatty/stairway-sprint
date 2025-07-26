import Phaser from 'phaser';
import { LaneManager } from '../utils/LaneManager';
import { AnimationManager } from '../managers/AnimationManager';

export enum PlayerState {
  IDLE = 'idle',
  MOVING = 'moving',
  SHOOTING = 'shooting',
  HIT = 'hit'
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  private currentLane: number = 1;
  private laneManager?: LaneManager;
  private animationManager?: AnimationManager;
  private isMoving: boolean = false;
  private canShoot: boolean = true;
  private shootCooldown: number = 500;
  private invincible: boolean = false;
  private invincibilityDuration: number = 1000;
  private currentState: PlayerState = PlayerState.IDLE;
  private lives: number = 3;
  private currentAnimationId?: string;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-down');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setDepth(10);
    this.setScale(1);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(40, 60);
    body.setOffset(10, 10);
    
    this.setPlayerState(PlayerState.IDLE);
  }
  
  public setLaneManager(laneManager: LaneManager): void {
    this.laneManager = laneManager;
    // Update current lane based on position
    this.currentLane = laneManager.getLaneForPosition(this.x);
  }
  
  public setAnimationManager(animationManager: AnimationManager): void {
    this.animationManager = animationManager;
    this.startIdleAnimation();
  }
  
  private startIdleAnimation(): void {
    if (this.animationManager) {
      this.stopCurrentAnimation();
      this.animationManager.playAnimation(this, 'player-idle');
      // Add subtle floating animation for idle state
      this.currentAnimationId = this.animationManager.createFloatAnimation(this, 3, 3000);
    }
  }
  
  private stopCurrentAnimation(): void {
    if (this.currentAnimationId && this.animationManager) {
      this.animationManager.stopAnimation(this.currentAnimationId);
      this.currentAnimationId = undefined;
    }
  }
  
  public moveLeft(): void {
    if (this.isMoving || !this.laneManager || this.currentLane === 0) return;
    
    this.isMoving = true;
    this.currentLane--;
    this.setPlayerState(PlayerState.MOVING);
    
    // Enhanced animation with visual feedback
    if (this.animationManager) {
      this.stopCurrentAnimation();
      this.animationManager.playAnimation(this, 'player-moving-left');
      
      // Add bounce effect for movement
      this.animationManager.createBounceAnimation(this, 0.1, 150);
    }
    
    const targetX = this.laneManager.getLanePosition(this.currentLane);
    this.laneManager.highlightLane(this.currentLane);
    
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.isMoving = false;
        this.setPlayerState(PlayerState.IDLE);
        this.startIdleAnimation();
      }
    });
  }
  
  public moveRight(): void {
    if (this.isMoving || !this.laneManager) return;
    
    const maxLane = this.laneManager.getLaneCount() - 1;
    if (this.currentLane >= maxLane) return;
    
    this.isMoving = true;
    this.currentLane++;
    this.setPlayerState(PlayerState.MOVING);
    
    // Enhanced animation with visual feedback
    if (this.animationManager) {
      this.stopCurrentAnimation();
      this.animationManager.playAnimation(this, 'player-moving-right');
      
      // Add bounce effect for movement
      this.animationManager.createBounceAnimation(this, 0.1, 150);
    }
    
    const targetX = this.laneManager.getLanePosition(this.currentLane);
    this.laneManager.highlightLane(this.currentLane);
    
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.isMoving = false;
        this.setPlayerState(PlayerState.IDLE);
        this.startIdleAnimation();
      }
    });
  }
  
  public shoot(): Phaser.GameObjects.Image | null {
    if (!this.canShoot) return null;
    
    this.canShoot = false;
    this.setPlayerState(PlayerState.SHOOTING);
    
    // Enhanced shooting animation
    if (this.animationManager) {
      this.stopCurrentAnimation();
      this.animationManager.playAnimation(this, 'player-shooting');
      
      // Add recoil effect
      this.animationManager.createShakeAnimation(this, 2, 100);
      
      // Add brief scale effect
      this.animationManager.createBounceAnimation(this, 0.15, 120);
    }
    
    const projectile = this.scene.add.image(this.x, this.y - 40, 'projectile');
    this.scene.physics.add.existing(projectile);
    
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(-600);
    
    this.scene.time.delayedCall(150, () => {
      if (this.currentState === PlayerState.SHOOTING) {
        this.setPlayerState(PlayerState.IDLE);
        this.startIdleAnimation();
      }
    });
    
    this.scene.time.delayedCall(this.shootCooldown, () => {
      this.canShoot = true;
    });
    
    return projectile;
  }
  
  public hit(): void {
    if (this.invincible) return;
    
    this.setPlayerState(PlayerState.HIT);
    this.lives--;
    
    // Enhanced hit animation
    if (this.animationManager) {
      this.stopCurrentAnimation();
      this.animationManager.playAnimation(this, 'player-hit');
      
      // Add dramatic hit effects
      this.animationManager.createShakeAnimation(this, 8, 400);
      
      // Flash effect
      this.animationManager.createTweenAnimation(
        this,
        { alpha: { from: 1, to: 0.3 } },
        200,
        'Power2',
        0,
        () => {
          if (this.animationManager) {
            this.animationManager.createTweenAnimation(this, { alpha: 1 }, 200);
          }
        }
      );
    }
    
    this.scene.time.delayedCall(600, () => {
      this.setPlayerState(PlayerState.IDLE);
      this.startIdleAnimation();
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
    this.setPlayerState(PlayerState.IDLE);
    this.alpha = 1;
  }
  
  private setPlayerState(state: PlayerState): void {
    this.currentState = state;
  }
  
  public getState(): PlayerState {
    return this.currentState;
  }
  
  public getLives(): number {
    return this.lives;
  }
  
  public getCurrentLane(): number {
    return this.currentLane;
  }
  
  public setLives(lives: number): void {
    this.lives = lives;
  }
  
  public isInvincible(): boolean {
    return this.invincible;
  }
  
  public setInvincible(invincible: boolean): void {
    this.invincible = invincible;
    
    if (invincible) {
      // Enhanced invincibility animation
      if (this.animationManager) {
        this.stopCurrentAnimation();
        
        // Pulsing alpha effect for invincibility
        this.currentAnimationId = this.animationManager.createTweenAnimation(
          this,
          { alpha: { from: 1, to: 0.4 } },
          250,
          'Sine.easeInOut'
        );
        
        // Add subtle scale pulsing
        this.animationManager.createPulseAnimation(this, 1.05, 400);
      } else {
        // Fallback for old system
        this.scene.tweens.add({
          targets: this,
          alpha: { from: 1, to: 0.5 },
          duration: 200,
          repeat: -1,
          yoyo: true
        });
      }
    } else {
      if (this.animationManager) {
        this.animationManager.stopAllAnimationsForTarget(this);
        this.setAlpha(1);
        this.setScale(1);
        this.startIdleAnimation();
      } else {
        this.scene.tweens.killTweensOf(this);
        this.setAlpha(1);
      }
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