import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import type { Player } from '../sprites/Player';
import { Stroller } from '../sprites/Stroller';
import { Hazard } from '../sprites/Hazard';
import { VIP } from '../sprites/VIP';
import { Assassin } from '../sprites/Assassin';
import { ScoreManager } from './ScoreManager';
import { LivesManager } from './LivesManager';
import { EffectsManager } from './EffectsManager';

export class CollisionManager extends Phaser.Events.EventEmitter {
  private scene: GameScene;
  private player: Player;
  private scoreManager: ScoreManager;
  private livesManager: LivesManager;
  private effectsManager!: EffectsManager;
  private colliders: Phaser.Physics.Arcade.Collider[] = [];
  private enabled: boolean = true;
  
  // Performance tracking
  private collisionChecksPerFrame: number = 0;
  private debugMode: boolean = false;
  private totalChecksAvoided: number = 0;
  private performanceHistory: number[] = [];
  private maxHistorySize: number = 60; // Track last 60 frames
  
  // Spatial partitioning
  private laneCollisionGroups: Map<number, Set<Phaser.GameObjects.GameObject>> = new Map();
  private verticalZones: number = 3; // Divide screen into 3 vertical zones
  private zoneHeight: number = 0;
  
  constructor(
    scene: GameScene,
    player: Player,
    scoreManager: ScoreManager,
    livesManager: LivesManager
  ) {
    super();
    this.scene = scene;
    this.player = player;
    this.scoreManager = scoreManager;
    this.livesManager = livesManager;
    
    // Initialize spatial partitioning
    this.initializeSpatialPartitioning();
  }
  
  public setEffectsManager(effectsManager: EffectsManager): void {
    this.effectsManager = effectsManager;
  }
  
  private initializeSpatialPartitioning(): void {
    // Initialize lane groups (assuming 3 lanes)
    for (let i = 0; i < 3; i++) {
      this.laneCollisionGroups.set(i, new Set());
    }
    
    // Set up zone height based on screen
    const screenHeight = this.scene.cameras.main.height;
    this.zoneHeight = screenHeight / this.verticalZones;
  }
  
  public setupCollisions(
    strollerGroup: Phaser.GameObjects.Group,
    hazardGroup: Phaser.GameObjects.Group,
    vipGroup: Phaser.GameObjects.Group,
    assassinGroup: Phaser.GameObjects.Group,
    projectileGroup: Phaser.GameObjects.Group
  ): void {
    // Player-stroller collision
    const strollerCollider = this.scene.physics.add.overlap(
      this.player as any,
      strollerGroup,
      this.handleStrollerCollision,
      this.shouldCheckCollision,
      this
    );
    this.colliders.push(strollerCollider);
    
    // Player-hazard collision
    const hazardCollider = this.scene.physics.add.overlap(
      this.player as any,
      hazardGroup,
      this.handleHazardCollision,
      this.shouldCheckCollision,
      this
    );
    this.colliders.push(hazardCollider);
    
    // Player-VIP collision
    const vipCollider = this.scene.physics.add.overlap(
      this.player as any,
      vipGroup,
      this.handleVIPCollision,
      this.shouldCheckCollision,
      this
    );
    this.colliders.push(vipCollider);
    
    // Player-assassin collision
    const assassinCollider = this.scene.physics.add.overlap(
      this.player as any,
      assassinGroup,
      this.handleAssassinCollision,
      this.shouldCheckCollision,
      this
    );
    this.colliders.push(assassinCollider);
    
    // Projectile-assassin collision
    const projectileCollider = this.scene.physics.add.overlap(
      projectileGroup,
      assassinGroup,
      this.handleProjectileAssassinCollision,
      undefined,
      this
    );
    this.colliders.push(projectileCollider);
    
    // VIP-assassin collision
    const vipAssassinCollider = this.scene.physics.add.overlap(
      vipGroup,
      assassinGroup,
      this.handleVIPAssassinCollision,
      undefined,
      this
    );
    this.colliders.push(vipAssassinCollider);
  }
  
  private shouldCheckCollision(obj1: any, obj2: any): boolean {
    if (!this.enabled) return false;
    
    // Spatial partitioning: Check if objects are in same or adjacent lanes
    const player = obj1 as Player;
    const entity = obj2;
    
    // Get lane positions
    const playerLane = player.getCurrentLane ? player.getCurrentLane() : -1;
    const entityLane = entity.getCurrentLane ? entity.getCurrentLane() : -1;
    
    // If either object doesn't have lane info, allow collision check
    if (playerLane === -1 || entityLane === -1) {
      this.collisionChecksPerFrame++;
      return true;
    }
    
    // Only check collisions if objects are in same or adjacent lanes
    const laneDiff = Math.abs(playerLane - entityLane);
    
    if (laneDiff <= 1) {
      this.collisionChecksPerFrame++;
      return true;
    } else {
      this.totalChecksAvoided++;
      return false;
    }
  }
  
  private handleStrollerCollision(player: any, stroller: any): void {
    const strollerSprite = stroller as Stroller;
    if (!strollerSprite.active) return;
    
    this.scoreManager.addPoints(1);
    this.scoreManager.addStreak();
    strollerSprite.deactivate();
    
    // Use effects manager for visual feedback
    if (this.effectsManager) {
      this.effectsManager.playRescueEffect(strollerSprite.x, strollerSprite.y);
    }
    
    // Emit event for additional handling
    this.emit('strollerRescued', strollerSprite);
  }
  
  private handleHazardCollision(player: any, hazard: any): void {
    const hazardSprite = hazard as Hazard;
    if (!hazardSprite.active || this.livesManager.isInvincible()) return;
    
    this.scoreManager.addPoints(-2);
    this.scoreManager.resetStreak();
    this.livesManager.loseLife();
    hazardSprite.deactivate();
    
    // Screen shake is handled by LivesManager
    
    // Use effects manager for visual feedback
    if (this.effectsManager) {
      this.effectsManager.playImpactEffect(hazardSprite.x, hazardSprite.y);
    }
    
    // Emit event
    this.emit('hazardHit', hazardSprite);
  }
  
  private handleVIPCollision(player: any, vip: any): void {
    const vipSprite = vip as VIP;
    if (!vipSprite.active || vipSprite.isProtected()) return;
    
    vipSprite.protect();
    this.scoreManager.addPoints(5);
    this.scoreManager.addStreak();
    
    // Use effects manager for visual celebration
    if (this.effectsManager) {
      this.effectsManager.playProtectionEffect(vipSprite.x, vipSprite.y);
    }
    
    // Emit event
    this.emit('vipProtected', vipSprite);
  }
  
  private handleAssassinCollision(player: any, assassin: any): void {
    const assassinSprite = assassin as Assassin;
    if (!assassinSprite.active || this.livesManager.isInvincible()) return;
    
    this.scoreManager.resetStreak();
    this.livesManager.loseLife();
    assassinSprite.eliminate();
    
    // Emit event
    this.emit('assassinHit', assassinSprite);
  }
  
  private handleProjectileAssassinCollision(projectile: any, assassin: any): void {
    const projectileObj = projectile as Phaser.GameObjects.Image;
    const assassinSprite = assassin as Assassin;
    
    if (!assassinSprite.active || !projectileObj.active) return;
    
    assassinSprite.eliminate();
    projectileObj.destroy();
    this.scoreManager.addPoints(2);
    
    // Use effects manager for elimination effect
    if (this.effectsManager) {
      this.effectsManager.playEliminationEffect(assassinSprite.x, assassinSprite.y);
    }
    
    // Emit event
    this.emit('assassinEliminated', assassinSprite);
  }
  
  private handleVIPAssassinCollision(vip: any, assassin: any): void {
    const vipSprite = vip as VIP;
    const assassinSprite = assassin as Assassin;
    
    if (!vipSprite.active || !assassinSprite.active || vipSprite.isProtected()) return;
    
    this.scoreManager.addPoints(-5);
    this.scoreManager.resetStreak();
    
    // Store current lives before losing them
    const livesBeforeLoss = this.livesManager.getLives();
    
    this.livesManager.loseLife();
    this.livesManager.loseLife();
    
    vipSprite.deactivate();
    assassinSprite.deactivate();
    
    // Only do dramatic effect if not causing game over
    if (livesBeforeLoss > 2) {
      this.scene.cameras.main.shake(500, 0.02);
      this.scene.cameras.main.flash(500, 255, 0, 0);
    }
    
    // Emit event
    this.emit('vipAssassinated', { vip: vipSprite, assassin: assassinSprite });
  }
  
  public enable(): void {
    this.enabled = true;
  }
  
  public disable(): void {
    this.enabled = false;
  }
  
  public isEnabled(): boolean {
    return this.enabled;
  }
  
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
  
  public getCollisionStats(): { 
    checksPerFrame: number;
    spatialPartitioningEnabled: boolean;
    laneGroups: Map<number, Set<Phaser.GameObjects.GameObject>>;
    totalChecksAvoided: number;
    averageChecksPerFrame: number;
    performanceImprovement: string;
  } {
    const avgChecks = this.performanceHistory.length > 0
      ? this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length
      : 0;
    
    const baselineChecks = 100; // Estimated checks without optimization
    const improvement = baselineChecks > 0
      ? ((baselineChecks - avgChecks) / baselineChecks * 100).toFixed(1)
      : '0';
    
    return {
      checksPerFrame: this.collisionChecksPerFrame,
      spatialPartitioningEnabled: true,
      laneGroups: this.laneCollisionGroups,
      totalChecksAvoided: this.totalChecksAvoided,
      averageChecksPerFrame: avgChecks,
      performanceImprovement: `${improvement}%`
    };
  }
  
  public resetFrameStats(): void {
    // Record current frame's checks in history
    this.performanceHistory.push(this.collisionChecksPerFrame);
    
    // Keep only the last N frames
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift();
    }
    
    this.collisionChecksPerFrame = 0;
  }
  
  public updateSpatialPartitioning(entities: Phaser.GameObjects.GameObject[]): void {
    // Clear existing lane groups
    this.laneCollisionGroups.forEach(group => group.clear());
    
    // Reassign entities to lane groups
    entities.forEach(entity => {
      const lane = (entity as any).getCurrentLane ? (entity as any).getCurrentLane() : -1;
      if (lane >= 0 && lane < 3) {
        const laneGroup = this.laneCollisionGroups.get(lane);
        if (laneGroup) {
          laneGroup.add(entity);
        }
      }
    });
  }
  
  public getVerticalZone(y: number): number {
    if (this.zoneHeight === 0) return 0;
    return Math.floor(y / this.zoneHeight);
  }
  
  public isInPlayerZone(entity: any): boolean {
    const playerZone = this.getVerticalZone(this.player.y);
    const entityZone = this.getVerticalZone(entity.y);
    
    // Check if entity is in player's zone or adjacent zones
    return Math.abs(playerZone - entityZone) <= 1;
  }
  
  public destroy(): void {
    // Remove all colliders
    this.colliders.forEach(collider => {
      this.scene.physics.world.removeCollider(collider);
    });
    this.colliders = [];
    
    // Clear spatial partitioning
    this.laneCollisionGroups.clear();
    
    // Remove all listeners
    this.removeAllListeners();
  }
}