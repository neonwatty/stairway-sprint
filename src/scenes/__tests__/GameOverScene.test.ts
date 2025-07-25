import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameOverScene } from '../GameOverScene';
import { mockPhaser } from '../../test/mocks/phaser.mock';

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

describe('GameOverScene', () => {
  let gameOverScene: GameOverScene;
  let mockScene: any;

  beforeEach(() => {
    vi.clearAllMocks();
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
      add: vi.fn().mockReturnValue({})
    };
    
    // Create game over scene
    gameOverScene = new GameOverScene();
    
    // Copy mocked properties to the scene
    Object.assign(gameOverScene, mockScene);
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
      // Mock share API support
      mockNavigator.share = vi.fn();
      
      // Recreate scene with share support
      gameOverScene = new GameOverScene();
      Object.assign(gameOverScene, mockScene);
      gameOverScene.init({ score: 1500, highScore: 2000 });
      gameOverScene.create();
      
      const shareCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'SHARE'
      );
      expect(shareCall).toBeDefined();
    });

    it('should animate entrance', () => {
      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: expect.any(Object),
          alpha: 0.8,
          duration: 300
        })
      );
      
      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: expect.any(Object),
          alpha: 1,
          scale: 1,
          duration: 500,
          ease: 'Power2'
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
      const highScoreCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'High Score: 1500'
      );
      expect(highScoreCall).toBeDefined();
    });

    it('should play celebration sound', () => {
      expect(mockScene.sound.play).toHaveBeenCalledWith('sfx-powerup', { volume: 0.8 });
    });

    it('should animate high score badge', () => {
      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: expect.any(Object),
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 1000,
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

    it('should restart game when play again clicked', () => {
      // Find play again button
      const playAgainText = mockScene.add.text.mock.results.find(
        (result: any) => {
          const call = mockScene.add.text.mock.calls.find(
            (c: any[], index: number) => 
              c[2] === 'PLAY AGAIN' && mockScene.add.text.mock.results[index] === result
          );
          return call !== undefined;
        }
      )?.value;
      
      // Get the container that wraps the button
      const container = mockScene.add.container.mock.results.find(
        (result: any) => result.value.add.mock.calls.some(
          (call: any[]) => call[0] === playAgainText
        )
      )?.value;
      
      // Trigger click on container
      const clickHandler = container?.on?.mock.calls.find(
        (call: any[]) => call[0] === 'pointerup'
      )?.[1];
      
      clickHandler?.();
      
      expect(mockScene.scene.start).toHaveBeenCalledWith('GameScene');
    });

    it('should go to main menu when button clicked', () => {
      // Find main menu button
      const mainMenuText = mockScene.add.text.mock.results.find(
        (result: any) => {
          const call = mockScene.add.text.mock.calls.find(
            (c: any[], index: number) => 
              c[2] === 'MAIN MENU' && mockScene.add.text.mock.results[index] === result
          );
          return call !== undefined;
        }
      )?.value;
      
      // Get the container that wraps the button
      const container = mockScene.add.container.mock.results.find(
        (result: any) => result.value.add.mock.calls.some(
          (call: any[]) => call[0] === mainMenuText
        )
      )?.value;
      
      // Trigger click
      const clickHandler = container?.on?.mock.calls.find(
        (call: any[]) => call[0] === 'pointerup'
      )?.[1];
      
      clickHandler?.();
      
      expect(mockScene.scene.start).toHaveBeenCalledWith('MainMenuScene');
    });

    it('should share score when share button clicked', async () => {
      // Mock share API
      mockNavigator.share = vi.fn().mockResolvedValue(undefined);
      
      // Recreate scene with share support
      gameOverScene = new GameOverScene();
      Object.assign(gameOverScene, mockScene);
      gameOverScene.init({ score: 1500, highScore: 2000 });
      gameOverScene.create();
      
      // Find share button
      const shareText = mockScene.add.text.mock.results.find(
        (result: any) => {
          const call = mockScene.add.text.mock.calls.find(
            (c: any[], index: number) => 
              c[2] === 'SHARE' && mockScene.add.text.mock.results[index] === result
          );
          return call !== undefined;
        }
      )?.value;
      
      // Get the container
      const container = mockScene.add.container.mock.results.find(
        (result: any) => result.value.add.mock.calls.some(
          (call: any[]) => call[0] === shareText
        )
      )?.value;
      
      // Trigger click
      const clickHandler = container?.on?.mock.calls.find(
        (call: any[]) => call[0] === 'pointerup'
      )?.[1];
      
      await clickHandler?.();
      
      expect(mockNavigator.share).toHaveBeenCalledWith({
        title: 'Stairway Sprint',
        text: expect.stringContaining('1500 points')
      });
    });
  });

  describe('keyboard shortcuts', () => {
    beforeEach(() => {
      gameOverScene.init({ score: 1500, highScore: 2000 });
      gameOverScene.create();
    });

    it('should restart on SPACE key', () => {
      const spaceHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-SPACE'
      )?.[1];
      
      spaceHandler?.();
      
      expect(mockScene.scene.start).toHaveBeenCalledWith('GameScene');
    });

    it('should go to main menu on ESC key', () => {
      const escHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-ESC'
      )?.[1];
      
      escHandler?.();
      
      expect(mockScene.scene.start).toHaveBeenCalledWith('MainMenuScene');
    });
  });

  describe('responsive behavior', () => {
    beforeEach(() => {
      gameOverScene.init({ score: 1500, highScore: 2000 });
      gameOverScene.create();
    });

    it('should update layout on resize', () => {
      const resizeHandler = mockScene.scale.on.mock.calls.find(
        (call: any[]) => call[0] === 'resize'
      )?.[1];
      
      // Change dimensions
      mockScene.cameras.main.width = 800;
      mockScene.cameras.main.height = 600;
      
      // Trigger resize
      resizeHandler?.();
      
      // Container should be repositioned
      const container = mockScene.add.container.mock.results[0].value;
      expect(container.setPosition).toHaveBeenCalledWith(400, 300);
    });
  });

  describe('accessibility', () => {
    it('should apply high contrast styles when enabled', () => {
      // Enable high contrast
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'stairwaySprintAccessibility') {
          return JSON.stringify({
            highContrast: true,
            colorBlindMode: 'none',
            uiSoundVolume: 1,
            keyboardNavEnabled: true,
            screenReaderMode: false
          });
        }
        return null;
      });
      
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
      expect(mockScene.input.keyboard.off).toHaveBeenCalledWith('keydown-SPACE');
      expect(mockScene.input.keyboard.off).toHaveBeenCalledWith('keydown-ESC');
    });
  });

  describe('score animations', () => {
    beforeEach(() => {
      gameOverScene.init({ score: 1234, highScore: 2000 });
      gameOverScene.create();
    });

    it('should count up score animation', () => {
      expect(mockScene.tweens.addCounter).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 0,
          to: 1234,
          duration: 1500,
          ease: 'Power2',
          onUpdate: expect.any(Function)
        })
      );
    });
  });
});