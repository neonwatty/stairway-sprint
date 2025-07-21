import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import { Stroller } from '../sprites/Stroller';
import { Hazard } from '../sprites/Hazard';
import { VIP } from '../sprites/VIP';
import { Assassin } from '../sprites/Assassin';
import { LaneManager } from '../utils/LaneManager';

export class EntitySpawner {
  private scene: GameScene;
  private laneManager: LaneManager;
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
      const speed = Phaser.Math.Between(100, 150);
      
      const stroller = this.strollerPool.get() as Stroller;
      if (stroller) {
        stroller.setLaneManager(this.laneManager);
        stroller.spawn(lane, speed);
      }
      
      const delay = Phaser.Math.Between(2000, 4000) / (1 + this.difficultyLevel * 0.2);
      this.strollerTimer = this.scene.time.delayedCall(delay, spawnStroller);
    };
    
    const initialDelay = Phaser.Math.Between(1000, 2000);
    this.strollerTimer = this.scene.time.delayedCall(initialDelay, spawnStroller);
  }
  
  private startHazardSpawning(): void {
    const spawnHazard = () => {
      const lane = Phaser.Math.Between(0, this.laneManager.getLaneCount() - 1);
      const speed = Phaser.Math.Between(80, 200);
      
      const hazard = this.hazardPool.get() as Hazard;
      if (hazard) {
        hazard.setLaneManager(this.laneManager);
        hazard.spawn(lane, speed);
      }
      
      const delay = Phaser.Math.Between(3000, 6000) / (1 + this.difficultyLevel * 0.15);
      this.hazardTimer = this.scene.time.delayedCall(delay, spawnHazard);
    };
    
    const initialDelay = Phaser.Math.Between(2000, 3000);
    this.hazardTimer = this.scene.time.delayedCall(initialDelay, spawnHazard);
  }
  
  private startVIPSpawning(): void {
    const spawnVIPSequence = () => {
      const vipLane = Phaser.Math.Between(0, this.laneManager.getLaneCount() - 1);
      const vipSpeed = Phaser.Math.Between(60, 80);
      
      const vip = this.vipPool.get() as VIP;
      if (vip) {
        vip.setLaneManager(this.laneManager);
        vip.spawn(vipLane, vipSpeed);
        this.activeVIPs.push(vip);
        
        const assassinDelay = Phaser.Math.Between(2000, 3000);
        this.scene.time.delayedCall(assassinDelay, () => {
          if (vip.active && !vip.isProtected()) {
            this.spawnAssassin(vip);
          }
        });
      }
      
      const delay = Phaser.Math.Between(60000, 90000) / (1 + this.difficultyLevel * 0.1);
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
    const assassinSpeed = 150;
    
    const assassin = this.assassinPool.get() as Assassin;
    if (assassin) {
      assassin.setLaneManager(this.laneManager);
      assassin.setTarget(targetVIP);
      assassin.spawn(assassinLane, assassinSpeed);
    }
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