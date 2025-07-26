import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MainMenuScene } from '../MainMenuScene';
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
      // Store the callback so we can trigger it
      button._callback = callback;
      button.on('pointerup', callback);
      return button;
    }),
    playHover: vi.fn(),
    playSelect: vi.fn()
  }))
}));

// Mock UIAnimationManager
vi.mock('../../managers/UIAnimationManager', () => ({
  UIAnimationManager: vi.fn().mockImplementation(() => ({
    animateButtonHover: vi.fn(),
    animateButtonPress: vi.fn(),
    createFocusRing: vi.fn(() => ({
      destroy: vi.fn()
    })),
    createRippleEffect: vi.fn(),
    animateButtonStagger: vi.fn()
  }))
}));

// Mock AudioManager
vi.mock('../../managers/AudioManager', () => ({
  AudioManager: vi.fn().mockImplementation(() => ({
    playBackgroundMusic: vi.fn()
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
      add: vi.fn(() => ({
        play: vi.fn(),
        stop: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        setVolume: vi.fn(),
        destroy: vi.fn(),
        isPlaying: false
      })),
      get: vi.fn().mockReturnValue(true),
      play: vi.fn(),
      stopAll: vi.fn()
    };
    mockScene.cache = {
      audio: {
        exists: vi.fn(() => false),
        get: vi.fn(),
        add: vi.fn()
      }
    };
    mockScene.scene = {
      start: vi.fn(),
      stop: vi.fn(),
      launch: vi.fn(),
      pause: vi.fn()
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
    
    // Make sure responsive and managers are initialized
    mainMenuScene.responsive = mockResponsiveInstance;
    mainMenuScene.accessibilityManager = new (vi.mocked(AccessibilityManager))();
    mainMenuScene.uiSoundManager = new (vi.mocked(UISoundManager))();
    
    // Add playButton and settingsButton properties
    (mainMenuScene as any).playButton = undefined;
    (mainMenuScene as any).settingsButton = undefined;
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
        (call: any[]) => call[2] === 'Settings'
      );
      expect(settingsCall).toBeDefined();
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
      // The play button is created by UISoundManager.createAccessibleButton
      const createButtonCall = mainMenuScene.uiSoundManager.createAccessibleButton.mock.calls.find(
        (call: any[]) => call[3] === 'PLAY'
      );
      
      expect(createButtonCall).toBeDefined();
      
      // Get the callback passed to createAccessibleButton (5th parameter)
      const callback = createButtonCall[5];
      
      // Execute the callback
      callback();
      
      expect(mockScene.cameras.main.fadeOut).toHaveBeenCalledWith(300, 0, 0, 0);
      
      // Trigger fade complete callback
      const fadeCallback = mockScene.cameras.main.once.mock.calls.find(
        (call: any[]) => call[0] === 'camerafadeoutcomplete'
      )?.[1];
      fadeCallback?.();
      
      expect(mockScene.scene.start).toHaveBeenCalledWith('GameScene');
    });

    it('should launch settings scene when settings button clicked', () => {
      // The settings button is created by UISoundManager.createAccessibleButton
      const createButtonCall = mainMenuScene.uiSoundManager.createAccessibleButton.mock.calls.find(
        (call: any[]) => call[3] === 'Settings'
      );
      
      expect(createButtonCall).toBeDefined();
      
      // Get the callback passed to createAccessibleButton (5th parameter)
      const callback = createButtonCall[5];
      
      // Execute the callback
      callback();
      
      expect(mockScene.scene.launch).toHaveBeenCalledWith('SettingsScene');
      expect(mockScene.scene.pause).toHaveBeenCalled();
    });

  });



  describe('button hover effects', () => {
    beforeEach(() => {
      mainMenuScene.create();
    });

    it('should change play button style on hover', () => {
      // Get the play button that was created
      const playButton = mainMenuScene.playButton;
      expect(playButton).toBeDefined();
      
      // Trigger hover - the handler is set directly on the button in MainMenuScene
      const hoverHandler = playButton?.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerover'
      )?.[1];
      
      expect(hoverHandler).toBeDefined();
      hoverHandler?.();
      
      expect(playButton.setStyle).toHaveBeenCalledWith(
        expect.objectContaining({
          backgroundColor: expect.any(String)
        })
      );
    });

    it('should restore button style on hover out', () => {
      // Get the play button that was created
      const playButton = mainMenuScene.playButton;
      expect(playButton).toBeDefined();
      
      // Trigger hover out - the handler is set directly on the button in MainMenuScene
      const hoverOutHandler = playButton?.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerout'
      )?.[1];
      
      expect(hoverOutHandler).toBeDefined();
      hoverOutHandler?.();
      
      expect(playButton.setStyle).toHaveBeenCalled();
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
          keyboardNavEnabled: false
        })),
        updateSetting: vi.fn(),
        registerFocusableElement: vi.fn(),
        checkContrastRatio: vi.fn(() => true),
        destroy: vi.fn()
      };
      
      // Create a new scene with high contrast settings
      mainMenuScene = new MainMenuScene();
      Object.assign(mainMenuScene, mockScene);
      mainMenuScene.responsive = mockResponsiveInstance;
      mainMenuScene.uiSoundManager = new (vi.mocked(UISoundManager))();
      
      // Mock the AccessibilityManager constructor to return our mock
      vi.mocked(AccessibilityManager).mockImplementation(() => mockAccessibilityManager as any);
      
      mainMenuScene.create();
      
      // Background should be black
      expect(mockScene.add.rectangle).toHaveBeenCalledWith(
        320, 480, 640, 960, 0x000000
      );
      
      // Check if title was created with correct parameters  
      const titleCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'Stairway Sprint'
      );
      expect(titleCall).toBeDefined();
      // The color is set via getFontStyle which returns '#ffff00' when high contrast is enabled
      expect(mockResponsiveInstance.getFontStyle).toHaveBeenCalledWith(expect.any(String), '#ffff00');
    });

    it('should check contrast ratio for title', () => {
      mainMenuScene.create();
      
      // Verify contrast ratio was checked (if not high contrast)
      const settings = mainMenuScene.accessibilityManager.getSettings();
      if (!settings.highContrast) {
        expect(mainMenuScene.accessibilityManager.checkContrastRatio).toHaveBeenCalled();
      }
      
      // Should have created title text
      const titleCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'Stairway Sprint'
      );
      expect(titleCall).toBeDefined();
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
      // Ensure responsive is properly set
      mainMenuScene.responsive = mockResponsiveInstance;
      
      const resizeHandler = mockScene.scale.on.mock.calls.find(
        (call: any[]) => call[0] === 'resize'
      )?.[1];
      
      // Change dimensions
      mockScene.cameras.main.width = 800;
      mockScene.cameras.main.height = 600;
      
      // Trigger resize with proper context
      resizeHandler?.call(mainMenuScene);
      
      // Responsive utilities should be updated
      expect(mockResponsiveInstance.update).toHaveBeenCalled();
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
    });
  });

});