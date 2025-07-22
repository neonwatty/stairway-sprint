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
import { CollisionManager } from '../managers/CollisionManager';
import { EffectsManager } from '../managers/EffectsManager';
import { DebugVisualizer } from '../managers/DebugVisualizer';
import { DifficultyManager } from '../managers/DifficultyManager';
import { DifficultyDisplay } from '../ui/DifficultyDisplay';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private laneManager!: LaneManager;
  private entitySpawner!: EntitySpawner;
  private scoreManager!: ScoreManager;
  private livesManager!: LivesManager;
  private gameStateManager!: GameStateManager;
  private collisionManager!: CollisionManager;
  private effectsManager!: EffectsManager;
  private debugVisualizer!: DebugVisualizer;
  private difficultyManager!: DifficultyManager;
  private difficultyDisplay!: DifficultyDisplay;
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
    this.effectsManager = new EffectsManager(this);
    this.difficultyManager = new DifficultyManager(this);

    // Create player using Player class
    const startLane = Math.floor(this.laneManager.getLaneCount() / 2);
    const startX = this.laneManager.getLanePosition(startLane);
    this.player = new Player(this, startX, height - 100);
    this.player.setLaneManager(this.laneManager);
    
    // Initialize collision manager after player is created
    this.collisionManager = new CollisionManager(this, this.player, this.scoreManager, this.livesManager);
    this.collisionManager.setEffectsManager(this.effectsManager);
    
    // Create projectiles group
    this.projectiles = this.add.group({
      runChildUpdate: true
    });
    
    // Create entity spawner
    this.entitySpawner = new EntitySpawner(this, this.laneManager);
    this.entitySpawner.setDifficultyManager(this.difficultyManager);
    
    // Set up collision detection with CollisionManager
    this.collisionManager.setupCollisions(
      this.entitySpawner.getStrollerGroup(),
      this.entitySpawner.getHazardGroup(),
      this.entitySpawner.getVIPGroup(),
      this.entitySpawner.getAssassinGroup(),
      this.projectiles
    );
    
    // Create debug visualizer
    this.debugVisualizer = new DebugVisualizer(this, this.collisionManager, this.laneManager);

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
    
    // Collision debug mode toggle (C key)
    this.input.keyboard!.on('keydown-C', () => {
      this.debugVisualizer.toggle();
      this.collisionManager.setDebugMode(this.debugVisualizer.isEnabled());
    });
    
    // Debug difficulty controls (1-4 keys)
    if (this.game.config.physics?.arcade?.debug) {
      this.input.keyboard!.on('keydown-ONE', () => {
        this.difficultyManager.forceDifficulty(0);
      });
      this.input.keyboard!.on('keydown-TWO', () => {
        this.difficultyManager.forceDifficulty(1);
      });
      this.input.keyboard!.on('keydown-THREE', () => {
        this.difficultyManager.forceDifficulty(2);
      });
      this.input.keyboard!.on('keydown-FOUR', () => {
        this.difficultyManager.forceDifficulty(3);
      });
    }
    
    // Start the game
    this.gameStateManager.changeState(GameState.PLAYING);
  }

  private createUI(): void {
    // Score display
    this.scoreManager.createDisplay(20, 20);
    
    // Lives display
    this.livesManager.createDisplay(this.cameras.main.width - 150, 30);
    
    // Difficulty display
    this.difficultyDisplay = new DifficultyDisplay(this, this.cameras.main.width / 2, 40);
    const initialConfig = this.difficultyManager.getDifficultyConfig();
    this.difficultyDisplay.updateDifficulty(this.difficultyManager.getCurrentDifficulty(), initialConfig);

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
    
    // Update spatial partitioning for collision optimization
    if (this.collisionManager) {
      const allEntities = [
        ...this.entitySpawner.getStrollerGroup().getChildren(),
        ...this.entitySpawner.getHazardGroup().getChildren(),
        ...this.entitySpawner.getVIPGroup().getChildren(),
        ...this.entitySpawner.getAssassinGroup().getChildren()
      ];
      this.collisionManager.updateSpatialPartitioning(allEntities);
      
      // Reset frame stats for next frame
      this.collisionManager.resetFrameStats();
    }
    
    // Update debug visualizer
    if (this.debugVisualizer) {
      this.debugVisualizer.update({
        strollers: this.entitySpawner.getStrollerGroup().getChildren(),
        hazards: this.entitySpawner.getHazardGroup().getChildren(),
        vips: this.entitySpawner.getVIPGroup().getChildren(),
        assassins: this.entitySpawner.getAssassinGroup().getChildren(),
        player: this.player
      });
    }
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
        highScore: this.scoreManager.getHighScore(),
        highestDifficulty: this.difficultyManager.getDifficultyStats().highestLevelReached
      });
    });
    
    // Player invincibility events
    this.livesManager.getEvents().on('invincibilityStart', () => {
      this.player.setInvincible(true);
    });
    
    this.livesManager.getEvents().on('invincibilityEnd', () => {
      this.player.setInvincible(false);
    });
    
    // Score manager events for streak bonus
    this.scoreManager.getEvents().on('perfectStreak', () => {
      if (this.effectsManager) {
        this.effectsManager.playStreakBonusEffect(
          this.player.x,
          this.player.y - 50
        );
      }
    });
    
    // Score change events for difficulty
    this.scoreManager.getEvents().on('scoreChange', (score: number) => {
      this.events.emit('scoreChanged', score);
    });
    
    // Lives events for difficulty
    this.livesManager.getEvents().on('lifeChanged', (lives: number) => {
      if (lives < this.livesManager.getMaxLives()) {
        this.events.emit('lifeLost');
      }
    });
    
    // Streak events for difficulty
    this.scoreManager.getEvents().on('streakChange', (streak: number) => {
      if (streak >= 10) {
        this.events.emit('streakAchieved');
      }
    });
    
    // Difficulty change events
    this.difficultyManager.on('difficultyChanged', (data: any) => {
      this.difficultyDisplay.updateDifficulty(data.level, data.config);
      
      // Show transition message
      const messages = {
        1: 'Speed Increasing!',
        2: 'Getting Intense!',
        3: 'NIGHTMARE MODE!'
      };
      
      if (messages[data.level]) {
        this.difficultyDisplay.showTransitionMessage(messages[data.level]);
      }
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
    if (this.collisionManager) {
      this.collisionManager.destroy();
    }
    if (this.effectsManager) {
      this.effectsManager.destroy();
    }
    if (this.debugVisualizer) {
      this.debugVisualizer.destroy();
    }
    if (this.difficultyManager) {
      this.difficultyManager.destroy();
    }
    if (this.difficultyDisplay) {
      this.difficultyDisplay.destroy();
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