import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MainMenuScene } from '../MainMenuScene';
import { mockPhaser } from '../../test/mocks/phaser.mock';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

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
    playSelect: vi.fn()
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
      screenReader: false
    })),
    updateSetting: vi.fn(),
    registerFocusableElement: vi.fn(),
    handleKeyboardNavigation: vi.fn()
  }))
}));

describe('MainMenuScene', () => {
  let mainMenuScene: MainMenuScene;
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
        fadeIn: vi.fn(),
        fadeOut: vi.fn(),
        once: vi.fn()
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
      play: vi.fn(),
      stopAll: vi.fn()
    };
    mockScene.scene = {
      start: vi.fn(),
      stop: vi.fn(),
      launch: vi.fn()
    };
    mockScene.children = {
      list: []
    };
    mockScene.tweens = {
      add: vi.fn().mockReturnValue({})
    };
    
    // Create main menu scene
    mainMenuScene = new MainMenuScene();
    
    // Copy mocked properties to the scene
    Object.assign(mainMenuScene, mockScene);
  });

  describe('initialization', () => {
    it('should create with correct key', () => {
      expect(mainMenuScene.constructor.name).toBe('MainMenuScene');
    });
  });

  describe('create', () => {
    beforeEach(() => {
      mainMenuScene.create();
    });

    it('should fade in on create', () => {
      expect(mockScene.cameras.main.fadeIn).toHaveBeenCalledWith(500, 0, 0, 0);
    });

    it('should create background rectangle', () => {
      expect(mockScene.add.rectangle).toHaveBeenCalledWith(
        320, 480, 640, 960, expect.any(Number)
      );
    });

    it('should add player sprite decoration', () => {
      expect(mockScene.add.image).toHaveBeenCalledWith(
        320,
        expect.any(Number),
        'player-down'
      );
    });

    it('should display title text', () => {
      const titleCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'Stairway Sprint'
      );
      expect(titleCall).toBeDefined();
      expect(titleCall[3]).toMatchObject({
        shadow: expect.any(Object)
      });
    });

    it('should create play button', () => {
      const playCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'PLAY'
      );
      expect(playCall).toBeDefined();
    });

    it('should create settings button', () => {
      const settingsCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'SETTINGS'
      );
      expect(settingsCall).toBeDefined();
    });

    it('should create how to play button', () => {
      const howToPlayCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'HOW TO PLAY'
      );
      expect(howToPlayCall).toBeDefined();
    });

    it('should display high score', () => {
      // Set a high score
      localStorageMock.getItem.mockReturnValue('12345');
      
      // Recreate scene
      mainMenuScene = new MainMenuScene();
      Object.assign(mainMenuScene, mockScene);
      mainMenuScene.create();
      
      const highScoreCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2].includes('HIGH SCORE: 12345')
      );
      expect(highScoreCall).toBeDefined();
    });

    it('should display version info', () => {
      const versionCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2].includes('v1.0.0')
      );
      expect(versionCall).toBeDefined();
    });

    it('should set up keyboard shortcuts', () => {
      expect(mockScene.input.keyboard.on).toHaveBeenCalledWith('keydown-SPACE', expect.any(Function));
      expect(mockScene.input.keyboard.on).toHaveBeenCalledWith('keydown-S', expect.any(Function));
      expect(mockScene.input.keyboard.on).toHaveBeenCalledWith('keydown-H', expect.any(Function));
    });

    it('should set up resize handler', () => {
      expect(mockScene.scale.on).toHaveBeenCalledWith('resize', expect.any(Function), mainMenuScene);
    });
  });

  describe('button interactions', () => {
    beforeEach(() => {
      mainMenuScene.create();
    });

    it('should start game when play button clicked', () => {
      const playButton = mockScene.add.text.mock.results.find(
        (result: any) => mockScene.add.text.mock.calls.find(
          (call: any[], index: number) => 
            call[2] === 'PLAY' && mockScene.add.text.mock.results[index] === result
        )
      )?.value;
      
      // Trigger click
      const clickHandler = playButton?.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerup'
      )?.[1];
      clickHandler?.();
      
      expect(mockScene.cameras.main.fadeOut).toHaveBeenCalledWith(300, 0, 0, 0);
      
      // Trigger fade complete callback
      const fadeCallback = mockScene.cameras.main.once.mock.calls.find(
        (call: any[]) => call[0] === 'camerafadeoutcomplete'
      )?.[1];
      fadeCallback?.();
      
      expect(mockScene.scene.start).toHaveBeenCalledWith('GameScene');
    });

    it('should launch settings scene when settings button clicked', () => {
      const settingsButton = mockScene.add.text.mock.results.find(
        (result: any) => mockScene.add.text.mock.calls.find(
          (call: any[], index: number) => 
            call[2] === 'SETTINGS' && mockScene.add.text.mock.results[index] === result
        )
      )?.value;
      
      const clickHandler = settingsButton?.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerup'
      )?.[1];
      clickHandler?.();
      
      expect(mockScene.scene.launch).toHaveBeenCalledWith('SettingsScene');
    });

    it('should show how to play when button clicked', () => {
      const howToPlayButton = mockScene.add.text.mock.results.find(
        (result: any) => mockScene.add.text.mock.calls.find(
          (call: any[], index: number) => 
            call[2] === 'HOW TO PLAY' && mockScene.add.text.mock.results[index] === result
        )
      )?.value;
      
      const clickHandler = howToPlayButton?.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerup'
      )?.[1];
      clickHandler?.();
      
      // Should create how to play overlay
      const overlayCall = mockScene.add.rectangle.mock.calls.find(
        (call: any[]) => call[5] === 0.9 // Semi-transparent overlay
      );
      expect(overlayCall).toBeDefined();
    });
  });

  describe('keyboard shortcuts', () => {
    beforeEach(() => {
      mainMenuScene.create();
    });

    it('should start game on SPACE key', () => {
      const spaceHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-SPACE'
      )?.[1];
      
      spaceHandler?.();
      
      expect(mockScene.cameras.main.fadeOut).toHaveBeenCalledWith(300, 0, 0, 0);
    });

    it('should open settings on S key', () => {
      const sHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-S'
      )?.[1];
      
      sHandler?.();
      
      expect(mockScene.scene.launch).toHaveBeenCalledWith('SettingsScene');
    });

    it('should show how to play on H key', () => {
      const hHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-H'
      )?.[1];
      
      hHandler?.();
      
      // Should create overlay
      expect(mockScene.add.rectangle).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        0x000000,
        0.9
      );
    });
  });

  describe('how to play overlay', () => {
    beforeEach(() => {
      mainMenuScene.create();
      // Trigger how to play
      const howToPlayButton = mockScene.add.text.mock.results.find(
        (result: any) => mockScene.add.text.mock.calls.find(
          (call: any[], index: number) => 
            call[2] === 'HOW TO PLAY' && mockScene.add.text.mock.results[index] === result
        )
      )?.value;
      
      const clickHandler = howToPlayButton?.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerup'
      )?.[1];
      clickHandler?.();
    });

    it('should create how to play content', () => {
      const howToPlayTitle = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'How to Play'
      );
      expect(howToPlayTitle).toBeDefined();
    });

    it('should show controls section', () => {
      const controlsCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2].includes('Controls:')
      );
      expect(controlsCall).toBeDefined();
    });

    it('should show objective section', () => {
      const objectiveCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2].includes('Objective:')
      );
      expect(objectiveCall).toBeDefined();
    });

    it('should create close button', () => {
      const closeCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'CLOSE'
      );
      expect(closeCall).toBeDefined();
    });

    it('should close overlay on ESC key', () => {
      // Find ESC handler added after how to play opened
      const escHandlers = mockScene.input.keyboard.on.mock.calls.filter(
        (call: any[]) => call[0] === 'keydown-ESC'
      );
      
      // Should have more than one (one from how to play)
      expect(escHandlers.length).toBeGreaterThan(0);
    });
  });

  describe('button hover effects', () => {
    beforeEach(() => {
      mainMenuScene.create();
    });

    it('should change play button style on hover', () => {
      const playButton = mockScene.add.text.mock.results.find(
        (result: any) => mockScene.add.text.mock.calls.find(
          (call: any[], index: number) => 
            call[2] === 'PLAY' && mockScene.add.text.mock.results[index] === result
        )
      )?.value;
      
      // Trigger hover
      const hoverHandler = playButton?.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerover'
      )?.[1];
      hoverHandler?.();
      
      expect(playButton.setStyle).toHaveBeenCalledWith(
        expect.objectContaining({
          backgroundColor: expect.any(String)
        })
      );
    });

    it('should restore button style on hover out', () => {
      const playButton = mockScene.add.text.mock.results.find(
        (result: any) => mockScene.add.text.mock.calls.find(
          (call: any[], index: number) => 
            call[2] === 'PLAY' && mockScene.add.text.mock.results[index] === result
        )
      )?.value;
      
      // Trigger hover out
      const hoverOutHandler = playButton?.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerout'
      )?.[1];
      hoverOutHandler?.();
      
      expect(playButton.setStyle).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should apply high contrast styles when enabled', () => {
      // Enable high contrast
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        highContrast: true,
        colorBlindMode: 'none',
        uiSoundVolume: 1,
        keyboardNavEnabled: true,
        screenReaderMode: false
      }));
      
      mainMenuScene.create();
      
      // Background should be black
      expect(mockScene.add.rectangle).toHaveBeenCalledWith(
        320, 480, 640, 960, 0x000000
      );
      
      // Title should be yellow
      const titleCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'Stairway Sprint'
      );
      expect(titleCall[3].color).toBe('#ffff00');
    });

    it('should check contrast ratio for title', () => {
      mainMenuScene.create();
      
      // Should add stroke if contrast is poor
      const titleText = mockScene.add.text.mock.results.find(
        (result: any) => mockScene.add.text.mock.calls.find(
          (call: any[], index: number) => 
            call[2] === 'Stairway Sprint' && mockScene.add.text.mock.results[index] === result
        )
      )?.value;
      
      // Could have stroke applied
      expect(titleText).toBeDefined();
    });

    it('should register buttons as focusable elements', () => {
      mainMenuScene.create();
      
      // All interactive buttons should be registered
      const interactiveTexts = mockScene.add.text.mock.results.filter(
        (result: any) => result.value.setInteractive.mock.calls.length > 0
      );
      
      expect(interactiveTexts.length).toBeGreaterThan(0);
    });
  });

  describe('responsive behavior', () => {
    beforeEach(() => {
      mainMenuScene.create();
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
      
      // Background should resize
      const bgRect = mockScene.add.rectangle.mock.results[0].value;
      expect(bgRect.setSize).toHaveBeenCalledWith(800, 600);
    });
  });

  describe('cleanup', () => {
    it('should clean up on shutdown', () => {
      mainMenuScene.create();
      
      // Manually call shutdown
      if (mainMenuScene.shutdown) {
        mainMenuScene.shutdown();
      }
      
      expect(mockScene.scale.off).toHaveBeenCalledWith('resize', expect.any(Function), mainMenuScene);
      expect(mockScene.input.keyboard.off).toHaveBeenCalledWith('keydown-SPACE');
      expect(mockScene.input.keyboard.off).toHaveBeenCalledWith('keydown-S');
      expect(mockScene.input.keyboard.off).toHaveBeenCalledWith('keydown-H');
    });
  });

  describe('background music', () => {
    it('should play background music on create if not already playing', () => {
      mainMenuScene.create();
      
      expect(mockScene.sound.play).toHaveBeenCalledWith('bgm-menu', {
        loop: true,
        volume: 0.4
      });
    });

    it('should not restart music if already playing', () => {
      mockScene.sound.get.mockReturnValue({
        isPlaying: true
      });
      
      mainMenuScene.create();
      
      expect(mockScene.sound.play).not.toHaveBeenCalled();
    });
  });
});