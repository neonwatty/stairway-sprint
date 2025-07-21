import Phaser from 'phaser';

export interface Lane {
  index: number;
  centerX: number;
  width: number;
  leftBound: number;
  rightBound: number;
}

export class LaneManager {
  private lanes: Lane[] = [];
  private laneCount: number;
  private laneWidth: number;
  private scene: Phaser.Scene;
  private debugGraphics?: Phaser.GameObjects.Graphics;
  public showDebug: boolean = false;
  private laneIndicators: Phaser.GameObjects.Graphics[] = [];
  private currentLaneIndex: number = 1;
  private entitiesPerLane: Map<number, Set<Phaser.GameObjects.GameObject>> = new Map();

  constructor(scene: Phaser.Scene, count: number = 3) {
    this.scene = scene;
    this.laneCount = count;
    const gameWidth = scene.game.config.width as number;
    this.laneWidth = gameWidth / count;

    // Initialize lanes
    for (let i = 0; i < count; i++) {
      const centerX = i * this.laneWidth + this.laneWidth / 2;
      this.lanes.push({
        index: i,
        centerX: centerX,
        width: this.laneWidth,
        leftBound: i * this.laneWidth,
        rightBound: (i + 1) * this.laneWidth
      });
      // Initialize entity tracking for this lane
      this.entitiesPerLane.set(i, new Set());
    }

    this.createLaneVisuals();
  }

  private createLaneVisuals(): void {
    const gameHeight = this.scene.game.config.height as number;
    
    // Create lane dividers
    for (let i = 1; i < this.laneCount; i++) {
      const x = i * this.laneWidth;
      const line = this.scene.add.line(0, 0, x, 0, x, gameHeight, 0x444444, 0.5);
      line.setOrigin(0);
      line.setDepth(1);
    }

    // Create lane indicators (hidden by default)
    for (let i = 0; i < this.laneCount; i++) {
      const indicator = this.scene.add.graphics();
      indicator.setDepth(2);
      indicator.setAlpha(0);
      this.laneIndicators.push(indicator);
    }

    // Debug graphics
    if (this.showDebug) {
      this.createDebugVisuals();
    }
  }

  private createDebugVisuals(): void {
    if (this.debugGraphics) {
      this.debugGraphics.destroy();
    }

    this.debugGraphics = this.scene.add.graphics();
    this.debugGraphics.setDepth(100);

    const gameHeight = this.scene.game.config.height as number;

    // Draw lane boundaries
    this.lanes.forEach(lane => {
      this.debugGraphics!.lineStyle(2, 0xff0000, 0.5);
      this.debugGraphics!.strokeRect(
        lane.leftBound,
        0,
        lane.width,
        gameHeight
      );

      // Draw center line
      this.debugGraphics!.lineStyle(1, 0x00ff00, 0.5);
      this.debugGraphics!.beginPath();
      this.debugGraphics!.moveTo(lane.centerX, 0);
      this.debugGraphics!.lineTo(lane.centerX, gameHeight);
      this.debugGraphics!.strokePath();

      // Lane index text
      this.scene.add.text(lane.centerX, 20, `Lane ${lane.index}`, {
        font: '16px Arial',
        color: '#00ff00'
      }).setOrigin(0.5).setDepth(101);
    });
  }

  public getLanePosition(index: number): number {
    if (index < 0 || index >= this.laneCount) {
      console.warn(`Invalid lane index: ${index}`);
      return this.lanes[Math.floor(this.laneCount / 2)].centerX;
    }
    return this.lanes[index].centerX;
  }

  public getLaneForPosition(x: number): number {
    for (let i = 0; i < this.lanes.length; i++) {
      if (x >= this.lanes[i].leftBound && x < this.lanes[i].rightBound) {
        return i;
      }
    }
    // Return closest lane if position is out of bounds
    if (x < 0) return 0;
    return this.laneCount - 1;
  }

  public getLane(index: number): Lane | null {
    if (index < 0 || index >= this.laneCount) {
      return null;
    }
    return this.lanes[index];
  }

  public highlightLane(index: number): void {
    if (index < 0 || index >= this.laneCount) return;

    // Hide all indicators
    this.laneIndicators.forEach(indicator => {
      indicator.clear();
      indicator.setAlpha(0);
    });

    // Show current lane indicator
    const lane = this.lanes[index];
    const gameHeight = this.scene.game.config.height as number;
    const indicator = this.laneIndicators[index];

    indicator.clear();
    indicator.fillStyle(0x00ff00, 0.1);
    indicator.fillRect(lane.leftBound, 0, lane.width, gameHeight);
    indicator.setAlpha(1);

    // Fade out the highlight
    this.scene.tweens.add({
      targets: indicator,
      alpha: 0,
      duration: 500,
      ease: 'Power2'
    });

    this.currentLaneIndex = index;
  }

  public setDebugMode(enabled: boolean): void {
    this.showDebug = enabled;
    if (enabled) {
      this.createDebugVisuals();
    } else if (this.debugGraphics) {
      this.debugGraphics.destroy();
      this.debugGraphics = undefined;
    }
  }

  public getLaneCount(): number {
    return this.laneCount;
  }

  public getCurrentLaneIndex(): number {
    return this.currentLaneIndex;
  }

  public isValidLaneIndex(index: number): boolean {
    return index >= 0 && index < this.laneCount;
  }

  public placeEntityInLane(entity: Phaser.GameObjects.GameObject, laneIndex: number): void {
    const laneX = this.getLanePosition(laneIndex);
    if (laneX !== null && 'x' in entity) {
      (entity as any).x = laneX;
    }
  }

  public registerEntity(entity: Phaser.GameObjects.GameObject, laneIndex: number): void {
    if (!this.isValidLaneIndex(laneIndex)) return;
    
    const entities = this.entitiesPerLane.get(laneIndex);
    if (entities) {
      entities.add(entity);
    }
  }

  public unregisterEntity(entity: Phaser.GameObjects.GameObject, laneIndex: number): void {
    if (!this.isValidLaneIndex(laneIndex)) return;
    
    const entities = this.entitiesPerLane.get(laneIndex);
    if (entities) {
      entities.delete(entity);
    }
  }

  public moveEntityToLane(entity: Phaser.GameObjects.GameObject, fromLane: number, toLane: number): void {
    this.unregisterEntity(entity, fromLane);
    this.registerEntity(entity, toLane);
    this.placeEntityInLane(entity, toLane);
  }

  public getEntitiesInLane(laneIndex: number): Phaser.GameObjects.GameObject[] {
    if (!this.isValidLaneIndex(laneIndex)) return [];
    
    const entities = this.entitiesPerLane.get(laneIndex);
    return entities ? Array.from(entities) : [];
  }

  public getEntitiesInAdjacentLanes(laneIndex: number): Phaser.GameObjects.GameObject[] {
    const entities: Phaser.GameObjects.GameObject[] = [];
    
    // Get entities from current lane
    entities.push(...this.getEntitiesInLane(laneIndex));
    
    // Get entities from left lane
    if (laneIndex > 0) {
      entities.push(...this.getEntitiesInLane(laneIndex - 1));
    }
    
    // Get entities from right lane
    if (laneIndex < this.laneCount - 1) {
      entities.push(...this.getEntitiesInLane(laneIndex + 1));
    }
    
    return entities;
  }

  public updateResponsiveLayout(): void {
    const gameWidth = this.scene.game.config.width as number;
    this.laneWidth = gameWidth / this.laneCount;
    
    // Update lane positions
    for (let i = 0; i < this.laneCount; i++) {
      const centerX = i * this.laneWidth + this.laneWidth / 2;
      this.lanes[i] = {
        index: i,
        centerX: centerX,
        width: this.laneWidth,
        leftBound: i * this.laneWidth,
        rightBound: (i + 1) * this.laneWidth
      };
    }
    
    // Recreate visuals
    this.createLaneVisuals();
  }

  public destroy(): void {
    this.laneIndicators.forEach(indicator => indicator.destroy());
    if (this.debugGraphics) {
      this.debugGraphics.destroy();
    }
    this.entitiesPerLane.clear();
  }
}