import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameScene } from '../GameScene';
import { mockPhaser } from '../../test/mocks/phaser.mock';

// Mock ResponsiveUtils
const mockResponsiveInstance = {
  update: vi.fn(),
  getPadding: vi.fn(() => ({ x: 20, y: 20 })),
  getSpacing: vi.fn(() => 30),
  getSafeAreaInsets: vi.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
  getFontStyle: vi.fn(() => ({ 
    fontSize: '24px', 
    fontFamily: 'Arial',
    shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 2 }
  })),
  getFontSize: vi.fn(() => 24),
  scale: vi.fn((value) => value),
  getUIScale: vi.fn(() => 1),
  getTouchTargetSize: vi.fn(() => 44),
  getButtonConfig: vi.fn(() => ({
    minWidth: 200,
    minHeight: 60,
    padding: { left: 20, right: 20, top: 15, bottom: 15 }
  }))
};

vi.mock('../../utils/ResponsiveUtils', () => ({
  ResponsiveUtils: {
    getInstance: vi.fn(() => mockResponsiveInstance)
  },
  getResponsive: vi.fn(() => mockResponsiveInstance),
  FontSize: {
    SMALL: 'small',
    MEDIUM: 'medium',
    NORMAL: 'normal',
    LARGE: 'large',
    TITLE: 'title'
  }
}));

describe('GameScene', () => {
  let gameScene: GameScene;
  let mockScene: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create base mock scene
    mockScene = new mockPhaser.Scene();
    
    // Enhance mock scene with game-specific properties
    mockScene.cameras = {
      main: {
        width: 640,
        height: 960,
        scrollY: 0,
        setScroll: vi.fn(),
        shake: vi.fn(),
        flash: vi.fn(),
        fadeIn: vi.fn(),
        resetFX: vi.fn(),
        setBounds: vi.fn()
      }
    };
    
    mockScene.scale = {
      on: vi.fn(),
      off: vi.fn()
    };
    
    mockScene.input = {
      keyboard: {
        on: vi.fn(),
        off: vi.fn(),
        removeAllListeners: vi.fn(),
        createCursorKeys: vi.fn(() => ({
          left: { isDown: false, on: vi.fn(), off: vi.fn() },
          right: { isDown: false, on: vi.fn(), off: vi.fn() }
        })),
        addKey: vi.fn(() => ({
          on: vi.fn(),
          off: vi.fn(),
          removeAllListeners: vi.fn()
        }))
      },
      on: vi.fn(),
      off: vi.fn(),
      enabled: true
    };
    
    mockScene.sound = {
      get: vi.fn().mockReturnValue(true),
      play: vi.fn(),
      stopAll: vi.fn(),
      pauseAll: vi.fn(),
      resumeAll: vi.fn()
    };
    
    mockScene.game = {
      config: {
        width: 640,
        height: 960
      },
      renderer: {
        pipelines: {
          addPostPipeline: vi.fn(),
          removePostPipeline: vi.fn(),
          get: vi.fn()
        }
      }
    };
    
    mockScene.add = {
      ...mockScene.add,
      sprite: vi.fn(() => ({
        setDepth: vi.fn().mockReturnThis(),
        setScale: vi.fn().mockReturnThis(),
        setTexture: vi.fn().mockReturnThis(),
        setPosition: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        off: vi.fn().mockReturnThis(),
        destroy: vi.fn()
      })),
      container: vi.fn(() => ({
        add: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setScrollFactor: vi.fn().mockReturnThis(),
        destroy: vi.fn()
      }))
    };
    
    mockScene.physics = {
      world: {
        setBounds: vi.fn(),
        enable: vi.fn()
      },
      add: {
        existing: vi.fn(),
        group: vi.fn(() => ({
          add: vi.fn(),
          remove: vi.fn(),
          children: { entries: [] },
          destroy: vi.fn()
        })),
        overlap: vi.fn(),
        collider: vi.fn()
      },
      pause: vi.fn(),
      resume: vi.fn()
    };
    
    // Create game scene
    gameScene = new GameScene();
    
    // Copy mocked properties to the scene
    Object.assign(gameScene, mockScene);
  });

  describe('initialization', () => {
    it('should initialize GameScene', () => {
      expect(gameScene).toBeDefined();
      expect(gameScene.scene).toBeDefined();
    });

    it('should set up camera bounds on create', () => {
      gameScene.create();
      
      expect(mockScene.cameras.main.setBounds).toHaveBeenCalledWith(0, 0, 640, Infinity);
    });

    it('should initialize physics world', () => {
      gameScene.create();
      
      expect(mockScene.physics.world.setBounds).toHaveBeenCalledWith(0, 0, 640, Infinity);
    });
  });

  describe('player setup', () => {
    it('should create player sprite', () => {
      gameScene.create();
      
      expect(mockScene.add.sprite).toHaveBeenCalledWith(320, 900, 'player');
    });

    it('should enable physics on player', () => {
      gameScene.create();
      
      expect(mockScene.physics.add.existing).toHaveBeenCalled();
    });

    it('should set player initial lane', () => {
      gameScene.create();
      
      const player = (gameScene as any).player;
      expect(player?.setPosition).toHaveBeenCalledWith(320, 900);
    });
  });

  describe('entity groups', () => {
    it('should create entity groups', () => {
      gameScene.create();
      
      expect(mockScene.physics.add.group).toHaveBeenCalledTimes(4); // strollers, hazards, vips, assassins
    });

    it('should set up collision detection', () => {
      gameScene.create();
      
      expect(mockScene.physics.add.overlap).toHaveBeenCalled();
      expect(mockScene.physics.add.collider).toHaveBeenCalled();
    });
  });

  describe('game state management', () => {
    it('should start in playing state', () => {
      gameScene.create();
      
      expect((gameScene as any).gameState).toBe('playing');
    });

    it('should handle pause state', () => {
      gameScene.create();
      (gameScene as any).pauseGame();
      
      expect(mockScene.physics.pause).toHaveBeenCalled();
      expect((gameScene as any).gameState).toBe('paused');
    });

    it('should handle resume state', () => {
      gameScene.create();
      (gameScene as any).pauseGame();
      (gameScene as any).resumeGame();
      
      expect(mockScene.physics.resume).toHaveBeenCalled();
      expect((gameScene as any).gameState).toBe('playing');
    });
  });

  describe('input handling', () => {
    it('should set up keyboard controls', () => {
      gameScene.create();
      
      expect(mockScene.input.keyboard.createCursorKeys).toHaveBeenCalled();
      expect(mockScene.input.keyboard.addKey).toHaveBeenCalled();
    });

    it('should handle left movement', () => {
      gameScene.create();
      const player = (gameScene as any).player;
      
      (gameScene as any).handleInput('left');
      
      // Player should move to left lane (160)
      expect(player?.setPosition).toHaveBeenCalledWith(160, expect.any(Number));
    });

    it('should handle right movement', () => {
      gameScene.create();
      const player = (gameScene as any).player;
      
      (gameScene as any).handleInput('right');
      
      // Player should move to right lane (480)
      expect(player?.setPosition).toHaveBeenCalledWith(480, expect.any(Number));
    });

    it('should not move beyond lane boundaries', () => {
      gameScene.create();
      const player = (gameScene as any).player;
      
      // Move to left lane, then try to move left again
      (gameScene as any).currentLane = 0;
      (gameScene as any).handleInput('left');
      
      // Should stay in left lane
      expect((gameScene as any).currentLane).toBe(0);
    });
  });

  describe('game loop', () => {
    it('should update camera scroll', () => {
      gameScene.create();
      gameScene.update(0, 16);
      
      expect(mockScene.cameras.main.setScroll).toHaveBeenCalled();
    });

    it('should spawn entities', () => {
      gameScene.create();
      
      // Mock the spawner
      (gameScene as any).entitySpawner = {
        update: vi.fn()
      };
      
      gameScene.update(0, 16);
      
      expect((gameScene as any).entitySpawner.update).toHaveBeenCalled();
    });

    it('should update managers', () => {
      gameScene.create();
      
      // Mock the managers
      (gameScene as any).difficultyManager = { update: vi.fn() };
      (gameScene as any).scoreManager = { update: vi.fn() };
      (gameScene as any).livesManager = { update: vi.fn() };
      
      gameScene.update(0, 16);
      
      expect((gameScene as any).difficultyManager.update).toHaveBeenCalled();
    });
  });

  describe('collision handling', () => {
    it('should handle player-stroller collision', () => {
      gameScene.create();
      
      const mockStroller = {
        destroy: vi.fn(),
        x: 320,
        y: 500
      };
      
      (gameScene as any).handlePlayerStrollerCollision((gameScene as any).player, mockStroller);
      
      expect(mockStroller.destroy).toHaveBeenCalled();
    });

    it('should handle player-hazard collision', () => {
      gameScene.create();
      
      const mockHazard = {
        destroy: vi.fn(),
        x: 320,
        y: 500
      };
      
      (gameScene as any).handlePlayerHazardCollision((gameScene as any).player, mockHazard);
      
      expect(mockHazard.destroy).toHaveBeenCalled();
    });

    it('should handle game over on final life', () => {
      gameScene.create();
      
      // Mock lives manager to return true (game over)
      (gameScene as any).livesManager = {
        loseLife: vi.fn().mockReturnValue(true)
      };
      
      const mockHazard = { destroy: vi.fn() };
      (gameScene as any).handlePlayerHazardCollision((gameScene as any).player, mockHazard);
      
      expect(mockScene.scene.start).toHaveBeenCalledWith('GameOverScene', expect.any(Object));
    });
  });

  describe('cleanup', () => {
    it('should clean up on shutdown', () => {
      gameScene.create();
      gameScene.shutdown();
      
      expect(mockScene.input.keyboard.removeAllListeners).toHaveBeenCalled();
      expect(mockScene.scale.off).toHaveBeenCalled();
    });

    it('should destroy managers on shutdown', () => {
      gameScene.create();
      
      // Mock managers with destroy methods
      (gameScene as any).scoreManager = { destroy: vi.fn() };
      (gameScene as any).livesManager = { destroy: vi.fn() };
      (gameScene as any).difficultyManager = { destroy: vi.fn() };
      
      gameScene.shutdown();
      
      expect((gameScene as any).scoreManager.destroy).toHaveBeenCalled();
      expect((gameScene as any).livesManager.destroy).toHaveBeenCalled();
      expect((gameScene as any).difficultyManager.destroy).toHaveBeenCalled();
    });
  });

  describe('responsive design', () => {
    it('should handle resize events', () => {
      gameScene.create();
      
      // Trigger resize event
      const resizeHandler = mockScene.scale.on.mock.calls.find(
        (call: any[]) => call[0] === 'resize'
      )?.[1];
      
      expect(resizeHandler).toBeDefined();
      
      if (resizeHandler) {
        resizeHandler(800, 600);
        expect(mockResponsiveInstance.update).toHaveBeenCalledWith(800, 600);
      }
    });

    it('should update UI positions on resize', () => {
      gameScene.create();
      
      // Mock UI manager
      (gameScene as any).uiManager = {
        updateLayout: vi.fn()
      };
      
      const resizeHandler = mockScene.scale.on.mock.calls.find(
        (call: any[]) => call[0] === 'resize'
      )?.[1];
      
      if (resizeHandler) {
        resizeHandler(800, 600);
        expect((gameScene as any).uiManager.updateLayout).toHaveBeenCalled();
      }
    });
  });
});