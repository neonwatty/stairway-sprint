import Phaser from 'phaser';
import { Player } from '../sprites/Player';
import { LaneManager } from '../utils/LaneManager';
import { EntitySpawner } from '../systems/EntitySpawner';
import { Stroller } from '../sprites/Stroller';
import { Hazard } from '../sprites/Hazard';
import { VIP } from '../sprites/VIP';
import { Assassin } from '../sprites/Assassin';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private laneManager!: LaneManager;
  private entitySpawner!: EntitySpawner;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private projectiles: Phaser.GameObjects.Group;
  private hearts: Phaser.GameObjects.Image[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private score: number = 0;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchTime: number = 0;
  private minSwipeDistance: number = 50;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Background with tiled stairs
    this.add.rectangle(width / 2, height / 2, width, height, 0x2a2a2a);

    // Create lane manager
    this.laneManager = new LaneManager(this, 3);

    // Create player using Player class
    const startLane = Math.floor(this.laneManager.getLaneCount() / 2);
    const startX = this.laneManager.getLanePosition(startLane);
    this.player = new Player(this, startX, height - 100);
    this.player.setLaneManager(this.laneManager);
    
    // Create projectiles group
    this.projectiles = this.add.group({
      runChildUpdate: true
    });
    
    // Create entity spawner
    this.entitySpawner = new EntitySpawner(this, this.laneManager);
    
    // Set up collision detection
    this.setupCollisions();

    // Create UI
    this.createUI();

    // Set up keyboard controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // ESC key for pause
    this.input.keyboard!.on('keydown-ESC', () => {
      this.pauseGame();
    });

    // P key for pause
    this.input.keyboard!.on('keydown-P', () => {
      this.pauseGame();
    });
    
    // Set up touch controls
    this.setupTouchControls();
    
    // Debug mode toggle (D key)
    this.input.keyboard!.on('keydown-D', () => {
      this.laneManager.setDebugMode(!this.laneManager.showDebug);
    });
  }

  private createUI(): void {
    // Lives display
    for (let i = 0; i < 3; i++) {
      const heart = this.add.image(30 + i * 40, 30, 'heart-full');
      heart.setScale(1.2);
      this.hearts.push(heart);
    }

    // Score display
    this.scoreText = this.add.text(this.cameras.main.width - 20, 30, 'Score: 0', {
      font: '24px Arial',
      color: '#ffffff'
    }).setOrigin(1, 0.5);

    // Pause button for mobile
    const pauseButton = this.add.image(this.cameras.main.width - 30, 80, 'pause-icon');
    pauseButton.setInteractive({ useHandCursor: true });
    pauseButton.on('pointerdown', () => {
      this.pauseGame();
    });
  }

  update(): void {
    // Handle keyboard input
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.player.moveLeft();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.player.moveRight();
    }
    
    // Handle shooting
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      const projectile = this.player.shoot();
      if (projectile) {
        this.projectiles.add(projectile);
      }
    }
    
    // Update player
    this.player.update();
    
    // Clean up off-screen projectiles
    this.projectiles.children.entries.forEach((projectile) => {
      const proj = projectile as Phaser.GameObjects.Image;
      if (proj.y < -50) {
        this.projectiles.remove(proj, true, true);
      }
    });
    
    // Update lives display if changed
    if (this.player.getLives() !== this.hearts.filter(h => h.texture.key === 'heart-full').length) {
      this.updateLives();
    }
  }

  private updateLives(): void {
    const lives = this.player.getLives();
    for (let i = 0; i < this.hearts.length; i++) {
      if (i < lives) {
        this.hearts[i].setTexture('heart-full');
      } else {
        this.hearts[i].setTexture('heart-empty');
      }
    }
    
    // Game over check
    if (lives <= 0) {
      this.scene.start('GameOverScene', { score: this.score });
    }
  }
  
  private updateScore(points: number): void {
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);
  }
  
  private setupTouchControls(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.touchStartX = pointer.x;
      this.touchStartY = pointer.y;
      this.touchTime = this.time.now;
    });
    
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const swipeTime = this.time.now - this.touchTime;
      const swipeDistX = pointer.x - this.touchStartX;
      const swipeDistY = pointer.y - this.touchStartY;
      
      // Detect swipe vs tap
      if (swipeTime < 1000 && Math.abs(swipeDistX) > this.minSwipeDistance) {
        // Horizontal swipe detected
        if (swipeDistX > 0) {
          this.player.moveRight();
        } else {
          this.player.moveLeft();
        }
      } else if (Math.abs(swipeDistX) < 10 && Math.abs(swipeDistY) < 10) {
        // Tap detected - shoot
        const projectile = this.player.shoot();
        if (projectile) {
          this.projectiles.add(projectile);
        }
      }
    });
  }
  
  private setupCollisions(): void {
    // Player-stroller collision
    this.physics.add.overlap(
      this.player,
      this.entitySpawner.getStrollerGroup(),
      this.handleStrollerCollision,
      undefined,
      this
    );
    
    // Player-hazard collision
    this.physics.add.overlap(
      this.player,
      this.entitySpawner.getHazardGroup(),
      this.handleHazardCollision,
      undefined,
      this
    );
    
    // Player-VIP collision
    this.physics.add.overlap(
      this.player,
      this.entitySpawner.getVIPGroup(),
      this.handleVIPCollision,
      undefined,
      this
    );
    
    // Player-assassin collision
    this.physics.add.overlap(
      this.player,
      this.entitySpawner.getAssassinGroup(),
      this.handleAssassinCollision,
      undefined,
      this
    );
    
    // Projectile-assassin collision
    this.physics.add.overlap(
      this.projectiles,
      this.entitySpawner.getAssassinGroup(),
      this.handleProjectileAssassinCollision,
      undefined,
      this
    );
    
    // VIP-assassin collision
    this.physics.add.overlap(
      this.entitySpawner.getVIPGroup(),
      this.entitySpawner.getAssassinGroup(),
      this.handleVIPAssassinCollision,
      undefined,
      this
    );
  }
  
  private handleStrollerCollision(player: Player, stroller: Stroller): void {
    if (!stroller.active) return;
    
    this.updateScore(100);
    stroller.deactivate();
    
    // Visual feedback
    const emitter = this.add.particles(stroller.x, stroller.y, 'star', {
      speed: { min: 100, max: 200 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      quantity: 5
    });
    
    this.time.delayedCall(500, () => {
      emitter.destroy();
    });
  }
  
  private handleHazardCollision(player: Player, hazard: Hazard): void {
    if (!hazard.active || player.isInvincible()) return;
    
    this.player.hit();
    hazard.deactivate();
    
    // Screen shake
    this.cameras.main.shake(200, 0.01);
  }
  
  private handleVIPCollision(player: Player, vip: VIP): void {
    if (!vip.active || vip.isProtected()) return;
    
    vip.protect();
    this.updateScore(50);
    
    // Visual celebration
    const emitter = this.add.particles(vip.x, vip.y, 'star', {
      speed: { min: 200, max: 300 },
      scale: { start: 0.8, end: 0 },
      lifespan: 800,
      quantity: 10,
      tint: 0xffd700
    });
    
    this.time.delayedCall(800, () => {
      emitter.destroy();
    });
  }
  
  private handleAssassinCollision(player: Player, assassin: Assassin): void {
    if (!assassin.active || player.isInvincible()) return;
    
    this.player.hit();
    assassin.eliminate();
  }
  
  private handleProjectileAssassinCollision(projectile: Phaser.GameObjects.Image, assassin: Assassin): void {
    if (!assassin.active || !projectile.active) return;
    
    assassin.eliminate();
    projectile.destroy();
    this.updateScore(25);
    
    // Hit effect
    const flash = this.add.image(assassin.x, assassin.y, 'star');
    flash.setScale(2);
    flash.setTint(0xff0000);
    
    this.tweens.add({
      targets: flash,
      scale: 0,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy();
      }
    });
  }
  
  private handleVIPAssassinCollision(vip: VIP, assassin: Assassin): void {
    if (!vip.active || !assassin.active || vip.isProtected()) return;
    
    this.updateScore(-200);
    this.player.setLives(Math.max(0, this.player.getLives() - 2));
    
    vip.deactivate();
    assassin.deactivate();
    
    // Dramatic effect
    this.cameras.main.shake(500, 0.02);
    this.cameras.main.flash(500, 255, 0, 0, false, 0.5);
  }
  
  private pauseGame(): void {
    this.entitySpawner.pause();
    this.scene.pause();
    this.scene.launch('PauseScene');
  }
  
  shutdown(): void {
    if (this.entitySpawner) {
      this.entitySpawner.destroy();
    }
    if (this.laneManager) {
      this.laneManager.destroy();
    }
  }
  
  resume(): void {
    if (this.entitySpawner) {
      this.entitySpawner.resume();
    }
  }
}