import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameOverScene } from '../GameOverScene';
import { mockPhaser } from '../../test/mocks/phaser.mock';
import { AccessibilityManager } from '../../managers/AccessibilityManager';
import { UISoundManager } from '../../managers/UISoundManager';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock navigator for share API
const mockNavigator = {
  share: vi.fn()
};
Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true
});

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
    XLARGE: 'xlarge',
    TITLE: 'title'
  }
}));

// Mock UISoundManager
vi.mock('../../managers/UISoundManager', () => ({
  UISoundManager: vi.fn().mockImplementation(() => ({
    setAccessibilityManager: vi.fn(),
    createAccessibleButton: vi.fn((scene, x, y, text, style, callback, ariaLabel) => {
      const button = scene.add.text(x, y, text, style);
      button.setOrigin(0.5);
      button.setInteractive();
      button.on('pointerup', callback);
      return button;
    }),
    playHover: vi.fn(),
    playSelect: vi.fn(),
    playClick: vi.fn(),
    playBack: vi.fn(),
    playSuccess: vi.fn(),
    addButtonSounds: vi.fn()
  }))
}));

// Mock AccessibilityManager
vi.mock('../../managers/AccessibilityManager', () => ({
  AccessibilityManager: vi.fn().mockImplementation(() => ({
    getSettings: vi.fn(() => ({
      highContrast: false,
      colorBlindMode: 'none',
      largeText: false,
      announceScore: false,
      screenReader: false,
      keyboardNavEnabled: false
    })),
    updateSetting: vi.fn(),
    registerFocusableElement: vi.fn(),
    handleKeyboardNavigation: vi.fn(),
    checkContrastRatio: vi.fn(() => true),
    announceAction: vi.fn(),
    setKeyboardFocus: vi.fn(),
    destroy: vi.fn()
  }))
}));

describe('GameOverScene', () => {
  let gameOverScene: GameOverScene;
  let mockScene: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Create base mock scene
    mockScene = new mockPhaser.Scene();
    mockScene.cameras = {
      main: {
        width: 640,
        height: 960,
        fadeIn: vi.fn()
      }
    };
    mockScene.scale = {
      on: vi.fn(),
      off: vi.fn()
    };
    mockScene.input = {
      keyboard: {
        on: vi.fn(),
        off: vi.fn()
      }
    };
    mockScene.sound = {
      get: vi.fn().mockReturnValue(true),
      play: vi.fn()
    };
    mockScene.scene = {
      start: vi.fn(),
      stop: vi.fn(),
      get: vi.fn()
    };
    mockScene.children = {
      list: []
    };
    mockScene.tweens = {
      add: vi.fn().mockReturnValue({}),
      killTweensOf: vi.fn()
    };
    mockScene.add = {
      ...mockScene.add,
      container: vi.fn(() => {
        const mockContainer = {
          list: [],
          add: vi.fn().mockImplementation((items) => {
            if (Array.isArray(items)) {
              mockContainer.list.push(...items);
            } else {
              mockContainer.list.push(items);
            }
            return mockContainer;
          }),
          destroy: vi.fn(),
          setAlpha: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          off: vi.fn().mockReturnThis(),
        };
        return mockContainer;
      }),
      rectangle: vi.fn((x, y, width, height, color) => {
        const mockRectangle = {
          x,
          y,
          width,
          height,
          color,
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setBlendMode: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockImplementation(function() {
            this.interactive = true;
            return this;
          }),
          setStrokeStyle: vi.fn().mockReturnThis(),
          fillStyle: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          off: vi.fn().mockReturnThis(),
          emit: vi.fn().mockReturnThis(),
          removeAllListeners: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          interactive: false,
        };
        return mockRectangle;
      }),
      star: vi.fn((x, y, points, innerRadius, outerRadius, fillColor) => {
        const mockStar = {
          x,
          y,
          points,
          innerRadius,
          outerRadius,
          fillColor,
          type: 'Star',
          setDepth: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setTint: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        return mockStar;
      })
    };
    mockScene.tweens = {
      add: vi.fn().mockImplementation((config) => {
        // Execute onComplete callback immediately if present
        if (config.onComplete) {
          setTimeout(() => config.onComplete(), 0);
        }
        return {};
      })
    };
    
    // Create game over scene
    gameOverScene = new GameOverScene();
    
    // Copy mocked properties to the scene
    Object.assign(gameOverScene, mockScene);
    
    // Make sure responsive and managers are initialized
    gameOverScene.responsive = mockResponsiveInstance;
    gameOverScene.accessibilityManager = new (vi.mocked(AccessibilityManager))();
    gameOverScene.uiSoundManager = new (vi.mocked(UISoundManager))();
  });

  describe('initialization', () => {
    it('should initialize with game over data', () => {
      gameOverScene.init({ score: 1500, highScore: 2000 });
      expect(gameOverScene).toBeDefined();
    });

    it('should detect new high score', () => {
      localStorageMock.getItem.mockReturnValue('1000');
      gameOverScene.init({ score: 1500, highScore: 1500 });
      // Internal state check would be through behavior
      expect(localStorageMock.setItem).toHaveBeenCalledWith('stairwaySprintHighScore', '1500');
    });

    it('should not save high score if not new', () => {
      localStorageMock.getItem.mockReturnValue('2000');
      gameOverScene.init({ score: 1500, highScore: 2000 });
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    beforeEach(() => {
      gameOverScene.init({ score: 1500, highScore: 2000 });
      gameOverScene.create();
    });

    it('should create semi-transparent overlay', () => {
      expect(mockScene.add.rectangle).toHaveBeenCalledWith(
        320, 480, 640, 960, 0x000000, expect.any(Number)
      );
    });

    it('should create main container', () => {
      expect(mockScene.add.container).toHaveBeenCalledWith(320, 480);
    });

    it('should display game over title', () => {
      const gameOverCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'GAME OVER'
      );
      expect(gameOverCall).toBeDefined();
      expect(gameOverCall[3]).toMatchObject({
        shadow: expect.any(Object)
      });
    });

    it('should display score', () => {
      const scoreCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === '1500'
      );
      expect(scoreCall).toBeDefined();
    });

    it('should display score label', () => {
      const labelCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'SCORE'
      );
      expect(labelCall).toBeDefined();
    });

    it('should create play again button', () => {
      const playAgainCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'PLAY AGAIN'
      );
      expect(playAgainCall).toBeDefined();
    });

    it('should create main menu button', () => {
      const mainMenuCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'MAIN MENU'
      );
      expect(mainMenuCall).toBeDefined();
    });

    it('should create share button if supported', () => {
      // The share button is always created in the current implementation
      const shareCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'SHARE SCORE'
      );
      expect(shareCall).toBeDefined();
    });

    it('should animate entrance', () => {
      // First call is for overlay fade in
      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: expect.any(Object),
          alpha: 1,
          duration: 300,
          ease: 'Power2'
        })
      );
      
      // Second call is for container scale and fade in
      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: expect.any(Object),
          alpha: 1,
          scaleX: 1,
          scaleY: 1,
          duration: 500,
          delay: 200,
          ease: 'Back.easeOut'
        })
      );
    });
  });

  describe('new high score', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('1000');
      gameOverScene.init({ score: 1500, highScore: 1500 });
      gameOverScene.create();
    });

    it('should display new high score badge', () => {
      const badgeCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'NEW HIGH SCORE!'
      );
      expect(badgeCall).toBeDefined();
    });

    it('should display high score value', () => {
      // When it's a new high score, it displays a badge instead of text
      const badgeCall = mockScene.add.graphics.mock.calls.length;
      expect(badgeCall).toBeGreaterThan(0);
    });

    it('should play celebration sound', () => {
      // The actual implementation calls playSuccess() on UISoundManager
      expect(gameOverScene.uiSoundManager.playSuccess).toHaveBeenCalled();
    });

    it('should animate high score badge', () => {
      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: expect.any(Object),
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        })
      );
    });
  });

  describe('button interactions', () => {
    beforeEach(() => {
      gameOverScene.init({ score: 1500, highScore: 2000 });
      gameOverScene.create();
    });

    it('should restart game when play again clicked', async () => {
      // Find all rectangles that have pointerdown handlers
      const rectanglesWithHandlers = mockScene.add.rectangle.mock.results
        .map((result: any) => result.value)
        .filter((rect: any) => rect?.on?.mock.calls.some((call: any[]) => call[0] === 'pointerdown'));
      
      // The play again button should be the first interactive rectangle after the overlay
      const playAgainRect = rectanglesWithHandlers[0];
      
      // Trigger pointerdown on rectangle
      const clickHandler = playAgainRect?.on?.mock.calls.find(
        (call: any[]) => call[0] === 'pointerdown'
      )?.[1];
      
      expect(clickHandler).toBeDefined();
      clickHandler?.();
      
      // Wait for the tween to complete
      await vi.waitFor(() => {
        expect(mockScene.scene.start).toHaveBeenCalledWith('GameScene');
      });
    });

    it('should go to main menu when button clicked', async () => {
      // Find all rectangles that have pointerdown handlers
      const rectanglesWithHandlers = mockScene.add.rectangle.mock.results
        .map((result: any) => result.value)
        .filter((rect: any) => rect?.on?.mock.calls.some((call: any[]) => call[0] === 'pointerdown'));
      
      // The main menu button should be the second interactive rectangle
      const mainMenuRect = rectanglesWithHandlers[1];
      
      // Trigger pointerdown on rectangle
      const clickHandler = mainMenuRect?.on?.mock.calls.find(
        (call: any[]) => call[0] === 'pointerdown'
      )?.[1];
      
      expect(clickHandler).toBeDefined();
      clickHandler?.();
      
      // Wait for the tween to complete
      await vi.waitFor(() => {
        expect(mockScene.scene.start).toHaveBeenCalledWith('MainMenuScene');
      });
    });

    it('should share score when share button clicked', async () => {
      // The actual implementation logs to console
      const consoleSpy = vi.spyOn(console, 'log');
      
      // Find all rectangles that have pointerdown handlers
      const rectanglesWithHandlers = mockScene.add.rectangle.mock.results
        .map((result: any) => result.value)
        .filter((rect: any) => rect?.on?.mock.calls.some((call: any[]) => call[0] === 'pointerdown'));
      
      // The share button should be the third interactive rectangle
      const shareRect = rectanglesWithHandlers[2];
      
      // Trigger pointerdown on rectangle
      const clickHandler = shareRect?.on?.mock.calls.find(
        (call: any[]) => call[0] === 'pointerdown'
      )?.[1];
      
      expect(clickHandler).toBeDefined();
      clickHandler?.();
      
      // Wait for the tween to complete
      await vi.waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('=== SHARE SCORE ===');
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Score: 1500');
      expect(consoleSpy).toHaveBeenCalledWith('High Score: 2000');
      
      consoleSpy.mockRestore();
    });
  });

  describe('keyboard shortcuts', () => {
    beforeEach(() => {
      gameOverScene.init({ score: 1500, highScore: 2000 });
      gameOverScene.create();
    });

    it('should restart on SPACE key', async () => {
      const spaceHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-SPACE'
      )?.[1];
      
      spaceHandler?.();
      
      // Wait for fadeOutAndStart animation to complete
      await vi.waitFor(() => {
        expect(mockScene.scene.start).toHaveBeenCalledWith('GameScene');
      });
    });

    it('should go to main menu on ESC key', async () => {
      const escHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-ESC'
      )?.[1];
      
      escHandler?.();
      
      // Wait for fadeOutAndStart animation to complete
      await vi.waitFor(() => {
        expect(mockScene.scene.start).toHaveBeenCalledWith('MainMenuScene');
      });
    });
  });

  describe('responsive behavior', () => {
    beforeEach(() => {
      gameOverScene.init({ score: 1500, highScore: 2000 });
      gameOverScene.create();
    });

    it('should update layout on resize', () => {
      // Ensure responsive is properly set
      gameOverScene.responsive = mockResponsiveInstance;
      
      const resizeHandler = mockScene.scale.on.mock.calls.find(
        (call: any[]) => call[0] === 'resize'
      )?.[1];
      
      // Change dimensions
      mockScene.cameras.main.width = 800;
      mockScene.cameras.main.height = 600;
      
      // Trigger resize with proper context
      resizeHandler?.call(gameOverScene);
      
      // Responsive utilities should be updated
      expect(mockResponsiveInstance.update).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should apply high contrast styles when enabled', () => {
      // Enable high contrast
      const mockAccessibilityManager = {
        getSettings: vi.fn(() => ({
          highContrast: true,
          colorBlindMode: 'none',
          largeText: false,
          announceScore: false,
          screenReader: false,
          keyboardNavEnabled: false,
          uiSoundVolume: 1
        })),
        registerFocusableElement: vi.fn(),
        destroy: vi.fn()
      };
      
      // Create a new scene with high contrast settings
      gameOverScene = new GameOverScene();
      Object.assign(gameOverScene, mockScene);
      gameOverScene.responsive = mockResponsiveInstance;
      gameOverScene.uiSoundManager = new (vi.mocked(UISoundManager))();
      
      // Mock the AccessibilityManager constructor to return our mock
      vi.mocked(AccessibilityManager).mockImplementation(() => mockAccessibilityManager as any);
      
      gameOverScene.init({ score: 1500, highScore: 2000 });
      gameOverScene.create();
      
      // Check overlay opacity
      expect(mockScene.add.rectangle).toHaveBeenCalledWith(
        320, 480, 640, 960, 0x000000, 0.95
      );
      
      // Check title has stroke
      const titleCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'GAME OVER'
      );
      expect(titleCall[3].stroke).toBe('#000000');
      expect(titleCall[3].strokeThickness).toBe(3);
    });
  });

  describe('cleanup', () => {
    it('should clean up on shutdown', () => {
      gameOverScene.init({ score: 1500, highScore: 2000 });
      gameOverScene.create();
      
      // Manually call shutdown
      if (gameOverScene.shutdown) {
        gameOverScene.shutdown();
      }
      
      expect(mockScene.scale.off).toHaveBeenCalledWith('resize', expect.any(Function), gameOverScene);
    });
  });


  afterEach(() => {
    vi.useRealTimers();
  });
});