import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import { Stroller } from '../sprites/Stroller';
import { Hazard } from '../sprites/Hazard';
import { VIP } from '../sprites/VIP';
import { Assassin } from '../sprites/Assassin';
import { LaneManager } from '../utils/LaneManager';
import { DifficultyManager } from '../managers/DifficultyManager';

export class EntitySpawner {
  private scene: GameScene;
  private laneManager: LaneManager;
  private difficultyManager?: DifficultyManager;
  private strollerTimer?: Phaser.Time.TimerEvent;
  private hazardTimer?: Phaser.Time.TimerEvent;
  private vipTimer?: Phaser.Time.TimerEvent;
  private difficultyLevel: number = 0;
  
  private strollerPool!: Phaser.GameObjects.Group;
  private hazardPool!: Phaser.GameObjects.Group;
  private vipPool!: Phaser.GameObjects.Group;
  private assassinPool!: Phaser.GameObjects.Group;
  
  private activeVIPs: VIP[] = [];
  
  constructor(scene: GameScene, laneManager: LaneManager) {
    this.scene = scene;
    this.laneManager = laneManager;
    
    this.createObjectPools();
    this.setupTimers();
  }
  
  private createObjectPools(): void {
    this.strollerPool = this.scene.physics.add.group({
      classType: Stroller,
      maxSize: 20,
      runChildUpdate: true
    });
    
    this.hazardPool = this.scene.physics.add.group({
      classType: Hazard,
      maxSize: 15,
      runChildUpdate: true
    });
    
    this.vipPool = this.scene.physics.add.group({
      classType: VIP,
      maxSize: 5,
      runChildUpdate: true
    });
    
    this.assassinPool = this.scene.physics.add.group({
      classType: Assassin,
      maxSize: 5,
      runChildUpdate: true
    });
  }
  
  private setupTimers(): void {
    this.startStrollerSpawning();
    this.startHazardSpawning();
    this.startVIPSpawning();
  }
  
  private startStrollerSpawning(): void {
    const spawnStroller = () => {
      const lane = Phaser.Math.Between(0, this.laneManager.getLaneCount() - 1);
      const baseSpeed = Phaser.Math.Between(100, 150);
      const speedMultiplier = this.difficultyManager?.getSpeedMultiplier() || 1;
      const speed = baseSpeed * speedMultiplier;
      
      const stroller = this.strollerPool.get() as Stroller;
      if (stroller) {
        stroller.setLaneManager(this.laneManager);
        stroller.spawn(lane, speed);
      }
      
      const baseDelay = Phaser.Math.Between(2000, 4000);
      const spawnRateMultiplier = this.difficultyManager?.getSpawnRateMultiplier() || 1;
      const delay = baseDelay / spawnRateMultiplier;
      this.strollerTimer = this.scene.time.delayedCall(delay, spawnStroller);
    };
    
    const initialDelay = Phaser.Math.Between(1000, 2000);
    this.strollerTimer = this.scene.time.delayedCall(initialDelay, spawnStroller);
  }
  
  private startHazardSpawning(): void {
    const spawnHazard = () => {
      const lane = Phaser.Math.Between(0, this.laneManager.getLaneCount() - 1);
      const baseSpeed = Phaser.Math.Between(80, 200);
      const speedMultiplier = this.difficultyManager?.getSpeedMultiplier() || 1;
      const speed = baseSpeed * speedMultiplier;
      
      const hazard = this.hazardPool.get() as Hazard;
      if (hazard) {
        hazard.setLaneManager(this.laneManager);
        // Use hazard variety to determine hazard type based on difficulty
        const hazardVariety = this.difficultyManager?.getHazardVariety() || 1;
        hazard.spawn(lane, speed);
      }
      
      const baseDelay = Phaser.Math.Between(3000, 6000);
      const spawnRateMultiplier = this.difficultyManager?.getSpawnRateMultiplier() || 1;
      const delay = baseDelay / spawnRateMultiplier;
      this.hazardTimer = this.scene.time.delayedCall(delay, spawnHazard);
    };
    
    const initialDelay = Phaser.Math.Between(2000, 3000);
    this.hazardTimer = this.scene.time.delayedCall(initialDelay, spawnHazard);
  }
  
  private startVIPSpawning(): void {
    const spawnVIPSequence = () => {
      const vipLane = Phaser.Math.Between(0, this.laneManager.getLaneCount() - 1);
      const baseVipSpeed = Phaser.Math.Between(60, 80);
      const speedMultiplier = this.difficultyManager?.getSpeedMultiplier() || 1;
      const vipSpeed = baseVipSpeed * speedMultiplier * 0.8; // VIPs move at 80% of normal speed
      
      const vip = this.vipPool.get() as VIP;
      if (vip) {
        vip.setLaneManager(this.laneManager);
        vip.spawn(vipLane, vipSpeed);
        this.activeVIPs.push(vip);
        
        // Assassin spawn delay affected by difficulty
        const baseAssassinDelay = Phaser.Math.Between(2000, 3000);
        const aggressiveness = this.difficultyManager?.getAssassinAggressiveness() || 1;
        const assassinDelay = baseAssassinDelay / aggressiveness;
        
        this.scene.time.delayedCall(assassinDelay, () => {
          if (vip.active && !vip.isProtected()) {
            this.spawnAssassin(vip);
          }
        });
      }
      
      const baseDelay = Phaser.Math.Between(60000, 90000);
      const spawnRateMultiplier = this.difficultyManager?.getSpawnRateMultiplier() || 1;
      const delay = baseDelay / spawnRateMultiplier;
      this.vipTimer = this.scene.time.delayedCall(delay, spawnVIPSequence);
    };
    
    const initialDelay = Phaser.Math.Between(10000, 15000);
    this.vipTimer = this.scene.time.delayedCall(initialDelay, spawnVIPSequence);
  }
  
  private spawnAssassin(targetVIP: VIP): void {
    const possibleLanes = [];
    for (let i = 0; i < this.laneManager.getLaneCount(); i++) {
      possibleLanes.push(i);
    }
    
    const assassinLane = Phaser.Math.RND.pick(possibleLanes);
    const baseAssassinSpeed = 150;
    const speedMultiplier = this.difficultyManager?.getSpeedMultiplier() || 1;
    const aggressiveness = this.difficultyManager?.getAssassinAggressiveness() || 1;
    const assassinSpeed = baseAssassinSpeed * speedMultiplier * aggressiveness;
    
    const assassin = this.assassinPool.get() as Assassin;
    if (assassin) {
      assassin.setLaneManager(this.laneManager);
      assassin.setTarget(targetVIP);
      assassin.spawn(assassinLane, assassinSpeed);
    }
  }
  
  public setDifficultyManager(difficultyManager: DifficultyManager): void {
    this.difficultyManager = difficultyManager;
  }
  
  public setDifficultyLevel(level: number): void {
    this.difficultyLevel = Math.max(0, Math.min(5, level));
  }
  
  public getDifficultyLevel(): number {
    return this.difficultyLevel;
  }
  
  public getStrollerGroup(): Phaser.GameObjects.Group {
    return this.strollerPool;
  }
  
  public getHazardGroup(): Phaser.GameObjects.Group {
    return this.hazardPool;
  }
  
  public getVIPGroup(): Phaser.GameObjects.Group {
    return this.vipPool;
  }
  
  public getAssassinGroup(): Phaser.GameObjects.Group {
    return this.assassinPool;
  }
  
  public pause(): void {
    if (this.strollerTimer) this.strollerTimer.paused = true;
    if (this.hazardTimer) this.hazardTimer.paused = true;
    if (this.vipTimer) this.vipTimer.paused = true;
  }
  
  public resume(): void {
    if (this.strollerTimer) this.strollerTimer.paused = false;
    if (this.hazardTimer) this.hazardTimer.paused = false;
    if (this.vipTimer) this.vipTimer.paused = false;
  }
  
  public destroy(): void {
    if (this.strollerTimer) this.strollerTimer.destroy();
    if (this.hazardTimer) this.hazardTimer.destroy();
    if (this.vipTimer) this.vipTimer.destroy();
    
    this.strollerPool.destroy(true);
    this.hazardPool.destroy(true);
    this.vipPool.destroy(true);
    this.assassinPool.destroy(true);
  }
}