import Phaser from 'phaser';
import { CollisionManager } from './CollisionManager';
import { LaneManager } from '../utils/LaneManager';

export class DebugVisualizer {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private collisionManager: CollisionManager;
  private laneManager: LaneManager;
  private enabled: boolean = false;
  
  // Debug text elements
  private performanceText?: Phaser.GameObjects.Text;
  private entityCountText?: Phaser.GameObjects.Text;
  private fpsText?: Phaser.GameObjects.Text;
  
  // Colors for debug visualization
  private readonly COLORS = {
    LANE_BOUNDARY: 0x00ff00,
    COLLISION_BOX: 0xff0000,
    PLAYER_BOX: 0x00ffff,
    INACTIVE_ENTITY: 0x666666,
    ACTIVE_ENTITY: 0xffff00,
    ZONE_BOUNDARY: 0x0000ff
  };
  
  constructor(
    scene: Phaser.Scene,
    collisionManager: CollisionManager,
    laneManager: LaneManager
  ) {
    this.scene = scene;
    this.collisionManager = collisionManager;
    this.laneManager = laneManager;
    
    // Create graphics object for drawing
    this.graphics = this.scene.add.graphics();
    this.graphics.setDepth(1000); // Draw on top of everything
    
    this.createDebugTexts();
  }
  
  private createDebugTexts(): void {
    const { width } = this.scene.cameras.main;
    
    // FPS counter
    this.fpsText = this.scene.add.text(width - 100, 20, 'FPS: 0', {
      fontSize: '16px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 5, y: 5 }
    });
    this.fpsText.setDepth(1001);
    this.fpsText.setVisible(false);
    
    // Performance stats
    this.performanceText = this.scene.add.text(width - 200, 60, '', {
      fontSize: '14px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 5, y: 5 }
    });
    this.performanceText.setDepth(1001);
    this.performanceText.setVisible(false);
    
    // Entity count
    this.entityCountText = this.scene.add.text(width - 200, 120, '', {
      fontSize: '14px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 5, y: 5 }
    });
    this.entityCountText.setDepth(1001);
    this.entityCountText.setVisible(false);
  }
  
  public toggle(): void {
    this.enabled = !this.enabled;
    
    if (!this.enabled) {
      this.graphics.clear();
      this.hideDebugTexts();
    } else {
      this.showDebugTexts();
    }
  }
  
  public isEnabled(): boolean {
    return this.enabled;
  }
  
  private showDebugTexts(): void {
    if (this.fpsText) this.fpsText.setVisible(true);
    if (this.performanceText) this.performanceText.setVisible(true);
    if (this.entityCountText) this.entityCountText.setVisible(true);
  }
  
  private hideDebugTexts(): void {
    if (this.fpsText) this.fpsText.setVisible(false);
    if (this.performanceText) this.performanceText.setVisible(false);
    if (this.entityCountText) this.entityCountText.setVisible(false);
  }
  
  public update(entities: {
    strollers: Phaser.GameObjects.GameObject[];
    hazards: Phaser.GameObjects.GameObject[];
    vips: Phaser.GameObjects.GameObject[];
    assassins: Phaser.GameObjects.GameObject[];
    player: any;
  }): void {
    if (!this.enabled) return;
    
    // Clear previous frame
    this.graphics.clear();
    
    // Draw lane boundaries
    this.drawLaneBoundaries();
    
    // Draw zone boundaries
    this.drawZoneBoundaries();
    
    // Draw entity collision boxes
    this.drawEntityBoxes(entities);
    
    // Update performance stats
    this.updatePerformanceStats(entities);
    
    // Update FPS
    this.updateFPS();
  }
  
  private drawLaneBoundaries(): void {
    const { height } = this.scene.cameras.main;
    this.graphics.lineStyle(2, this.COLORS.LANE_BOUNDARY, 0.3);
    
    // Draw vertical lines for each lane boundary
    for (let i = 0; i <= this.laneManager.getLaneCount(); i++) {
      const x = this.laneManager.getLaneBoundary(i);
      this.graphics.beginPath();
      this.graphics.moveTo(x, 0);
      this.graphics.lineTo(x, height);
      this.graphics.strokePath();
    }
  }
  
  private drawZoneBoundaries(): void {
    const { width, height } = this.scene.cameras.main;
    const zoneHeight = height / 3; // Assuming 3 vertical zones
    
    this.graphics.lineStyle(1, this.COLORS.ZONE_BOUNDARY, 0.2);
    
    // Draw horizontal lines for zone boundaries
    for (let i = 1; i < 3; i++) {
      const y = i * zoneHeight;
      this.graphics.beginPath();
      this.graphics.moveTo(0, y);
      this.graphics.lineTo(width, y);
      this.graphics.strokePath();
    }
  }
  
  private drawEntityBoxes(entities: {
    strollers: Phaser.GameObjects.GameObject[];
    hazards: Phaser.GameObjects.GameObject[];
    vips: Phaser.GameObjects.GameObject[];
    assassins: Phaser.GameObjects.GameObject[];
    player: any;
  }): void {
    // Draw player collision box
    if (entities.player && entities.player.active) {
      this.drawCollisionBox(entities.player, this.COLORS.PLAYER_BOX, 3);
    }
    
    // Draw entity collision boxes
    const allEntities = [
      ...entities.strollers,
      ...entities.hazards,
      ...entities.vips,
      ...entities.assassins
    ];
    
    allEntities.forEach(entity => {
      const sprite = entity as any;
      if (!sprite.active) return;
      
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      const color = body && body.enable 
        ? this.COLORS.ACTIVE_ENTITY 
        : this.COLORS.INACTIVE_ENTITY;
      
      this.drawCollisionBox(sprite, color, 1);
    });
  }
  
  private drawCollisionBox(entity: any, color: number, lineWidth: number): void {
    const body = entity.body as Phaser.Physics.Arcade.Body;
    if (!body) return;
    
    this.graphics.lineStyle(lineWidth, color, 0.8);
    this.graphics.strokeRect(
      body.x,
      body.y,
      body.width,
      body.height
    );
    
    // Draw center point
    this.graphics.fillStyle(color, 1);
    this.graphics.fillCircle(entity.x, entity.y, 2);
    
    // Draw lane indicator
    if (entity.getCurrentLane) {
      const lane = entity.getCurrentLane();
      this.graphics.fillStyle(color, 0.8);
      this.scene.add.text(entity.x - 10, entity.y - 20, `L${lane}`, {
        fontSize: '12px',
        color: '#ffffff'
      }).setDepth(1002);
    }
  }
  
  private updatePerformanceStats(entities: any): void {
    if (!this.performanceText) return;
    
    const stats = this.collisionManager.getCollisionStats();
    const totalEntities = 
      entities.strollers.length +
      entities.hazards.length +
      entities.vips.length +
      entities.assassins.length;
    
    const activeEntities = [
      ...entities.strollers,
      ...entities.hazards,
      ...entities.vips,
      ...entities.assassins
    ].filter((e: any) => {
      const body = e.body as Phaser.Physics.Arcade.Body;
      return e.active && body && body.enable;
    }).length;
    
    this.performanceText.setText([
      `Checks/Frame: ${stats.checksPerFrame}`,
      `Avg Checks: ${stats.averageChecksPerFrame.toFixed(1)}`,
      `Avoided: ${stats.totalChecksAvoided}`,
      `Improvement: ${stats.performanceImprovement}`
    ]);
    
    if (this.entityCountText) {
      this.entityCountText.setText([
        `Total Entities: ${totalEntities}`,
        `Active Physics: ${activeEntities}`,
        `Physics Disabled: ${totalEntities - activeEntities}`
      ]);
    }
  }
  
  private updateFPS(): void {
    if (!this.fpsText || !this.scene.game) return;
    
    const fps = this.scene.game.loop.actualFps;
    this.fpsText.setText(`FPS: ${Math.round(fps)}`);
    
    // Color code FPS
    if (fps >= 55) {
      this.fpsText.setColor('#00ff00'); // Green
    } else if (fps >= 45) {
      this.fpsText.setColor('#ffff00'); // Yellow
    } else {
      this.fpsText.setColor('#ff0000'); // Red
    }
  }
  
  public destroy(): void {
    this.graphics.destroy();
    if (this.fpsText) this.fpsText.destroy();
    if (this.performanceText) this.performanceText.destroy();
    if (this.entityCountText) this.entityCountText.destroy();
  }
}