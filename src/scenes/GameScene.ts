import Phaser from 'phaser';
import { Player } from '../sprites/Player';
import { LaneManager } from '../utils/LaneManager';
import { EntitySpawner } from '../systems/EntitySpawner';
import { Stroller } from '../sprites/Stroller';
import { Hazard } from '../sprites/Hazard';
import { VIP } from '../sprites/VIP';
import { Assassin } from '../sprites/Assassin';
import { ScoreManager } from '../managers/ScoreManager';
import { LivesManager } from '../managers/LivesManager';
import { GameStateManager, GameState } from '../managers/GameStateManager';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private laneManager!: LaneManager;
  private entitySpawner!: EntitySpawner;
  private scoreManager!: ScoreManager;
  private livesManager!: LivesManager;
  private gameStateManager!: GameStateManager;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private projectiles!: Phaser.GameObjects.Group;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchTime: number = 0;
  private minSwipeDistance: number = 50;
  private currentStreak: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Background with tiled stairs
    this.add.rectangle(width / 2, height / 2, width, height, 0x2a2a2a);

    // Create managers
    this.scoreManager = new ScoreManager(this);
    this.livesManager = new LivesManager(this, 3);
    this.gameStateManager = new GameStateManager(this);
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
    
    // Set up event listeners
    this.setupEventListeners();

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
    
    // Start the game
    this.gameStateManager.changeState(GameState.PLAYING);
  }

  private createUI(): void {
    // Score display
    this.scoreManager.createDisplay(20, 20);
    
    // Lives display
    this.livesManager.createDisplay(this.cameras.main.width - 150, 30);

    // Pause button for mobile
    const pauseButton = this.add.image(this.cameras.main.width - 30, 80, 'pause-icon');
    pauseButton.setInteractive({ useHandCursor: true });
    pauseButton.on('pointerdown', () => {
      this.pauseGame();
    });
  }

  update(): void {
    // Only process input if playing
    if (!this.gameStateManager.isPlaying()) return;
    
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
  }

  private setupEventListeners(): void {
    // Lives manager events
    this.livesManager.getEvents().on('gameOver', () => {
      this.gameStateManager.changeState(GameState.GAME_OVER);
      
      // Stop all tweens and timers to prevent errors
      this.tweens.killAll();
      this.time.removeAllEvents();
      
      // Stop the current scene first, then start the game over scene
      this.scene.stop();
      this.scene.start('GameOverScene', { 
        score: this.scoreManager.getScore(),
        highScore: this.scoreManager.getHighScore()
      });
    });
    
    // Player invincibility events
    this.livesManager.getEvents().on('invincibilityStart', () => {
      this.player.setInvincible(true);
    });
    
    this.livesManager.getEvents().on('invincibilityEnd', () => {
      this.player.setInvincible(false);
    });
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
    
    this.scoreManager.addPoints(1);
    this.scoreManager.addStreak();
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
    if (!hazard.active || this.livesManager.isInvincible()) return;
    
    this.scoreManager.addPoints(-2);
    this.scoreManager.resetStreak();
    this.livesManager.loseLife();
    hazard.deactivate();
    
    // Screen shake
    this.cameras.main.shake(200, 0.01);
  }
  
  private handleVIPCollision(player: Player, vip: VIP): void {
    if (!vip.active || vip.isProtected()) return;
    
    vip.protect();
    this.scoreManager.addPoints(5);
    this.scoreManager.addStreak();
    
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
    if (!assassin.active || this.livesManager.isInvincible()) return;
    
    this.scoreManager.resetStreak();
    this.livesManager.loseLife();
    assassin.eliminate();
  }
  
  private handleProjectileAssassinCollision(projectile: Phaser.GameObjects.Image, assassin: Assassin): void {
    if (!assassin.active || !projectile.active) return;
    
    assassin.eliminate();
    projectile.destroy();
    this.scoreManager.addPoints(2);
    
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
    
    this.scoreManager.addPoints(-5);
    this.scoreManager.resetStreak();
    
    // Store current lives before losing them
    const livesBeforeLoss = this.livesManager.getLives();
    
    this.livesManager.loseLife();
    this.livesManager.loseLife();
    
    vip.deactivate();
    assassin.deactivate();
    
    // Only do dramatic effect if not causing game over
    if (livesBeforeLoss > 2) {
      this.cameras.main.shake(500, 0.02);
      this.cameras.main.flash(500, 255, 0, 0, false, 0.5);
    }
  }
  
  private pauseGame(): void {
    if (this.gameStateManager.canPause()) {
      this.gameStateManager.changeState(GameState.PAUSED);
      this.entitySpawner.pause();
      this.scene.pause();
      this.scene.launch('PauseScene');
    }
  }
  
  shutdown(): void {
    // Kill all active tweens and timers
    this.tweens.killAll();
    this.time.removeAllEvents();
    
    // Destroy managers
    if (this.entitySpawner) {
      this.entitySpawner.destroy();
    }
    if (this.laneManager) {
      this.laneManager.destroy();
    }
    if (this.scoreManager) {
      this.scoreManager.destroy();
    }
    if (this.livesManager) {
      this.livesManager.destroy();
    }
    if (this.gameStateManager) {
      this.gameStateManager.destroy();
    }
  }
  
  resume(): void {
    if (this.gameStateManager.canResume()) {
      this.gameStateManager.changeState(GameState.PLAYING);
      if (this.entitySpawner) {
        this.entitySpawner.resume();
      }
    }
  }
}