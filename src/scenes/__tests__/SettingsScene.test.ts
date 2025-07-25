import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsScene } from '../SettingsScene';
import { mockPhaser } from '../../test/mocks/phaser.mock';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('SettingsScene', () => {
  let settingsScene: SettingsScene;
  let mockScene: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Create base mock scene
    mockScene = new mockPhaser.Scene();
    mockScene.cameras = {
      main: {
        width: 640,
        height: 960
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
      stop: vi.fn(),
      resume: vi.fn()
    };
    mockScene.children = {
      list: []
    };
    mockScene.add = {
      ...mockScene.add,
      container: vi.fn().mockReturnValue({
        add: vi.fn(),
        destroy: vi.fn(),
        removeAll: vi.fn(),
        setPosition: vi.fn().mockReturnThis()
      }),
      rectangle: vi.fn().mockReturnValue({
        setScrollFactor: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        setFillStyle: vi.fn().mockReturnThis(),
        destroy: vi.fn()
      })
    };
    
    // Create settings scene
    settingsScene = new SettingsScene();
    
    // Copy mocked properties to the scene
    Object.assign(settingsScene, mockScene);
  });

  describe('initialization', () => {
    it('should create with correct key', () => {
      expect(settingsScene.constructor.name).toBe('SettingsScene');
    });
  });

  describe('create', () => {
    beforeEach(() => {
      settingsScene.create();
    });

    it('should create semi-transparent overlay', () => {
      expect(mockScene.add.rectangle).toHaveBeenCalledWith(
        320, // center x
        480, // center y
        640, // width
        960, // height
        0x000000,
        0.9
      );
    });

    it('should create main container', () => {
      expect(mockScene.add.container).toHaveBeenCalledWith(320, 480);
    });

    it('should create title text', () => {
      expect(mockScene.add.text).toHaveBeenCalledWith(
        0,
        expect.any(Number),
        'Settings',
        expect.objectContaining({
          color: '#ffffff'
        })
      );
    });

    it('should create close button', () => {
      const closeButtonCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'Close'
      );
      expect(closeButtonCall).toBeDefined();
    });

    it('should set up ESC key handler', () => {
      expect(mockScene.input.keyboard.on).toHaveBeenCalledWith(
        'keydown-ESC',
        expect.any(Function)
      );
    });

    it('should set up resize handler', () => {
      expect(mockScene.scale.on).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        settingsScene
      );
    });
  });

  describe('settings options', () => {
    beforeEach(() => {
      settingsScene.create();
    });

    it('should create color blind mode option', () => {
      const colorBlindLabel = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'Color Blind Mode:'
      );
      expect(colorBlindLabel).toBeDefined();
    });

    it('should create high contrast option', () => {
      const highContrastLabel = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'High Contrast:'
      );
      expect(highContrastLabel).toBeDefined();
    });

    it('should create UI sound volume option', () => {
      const volumeLabel = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'UI Sound Volume:'
      );
      expect(volumeLabel).toBeDefined();
    });

    it('should create keyboard navigation option', () => {
      const keyboardLabel = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'Keyboard Navigation:'
      );
      expect(keyboardLabel).toBeDefined();
    });

    it('should create screen reader option', () => {
      const screenReaderLabel = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'Screen Reader Mode:'
      );
      expect(screenReaderLabel).toBeDefined();
    });
  });

  describe('color blind mode selection', () => {
    beforeEach(() => {
      settingsScene.create();
    });

    it('should create buttons for each color blind mode', () => {
      const modeButtons = mockScene.add.text.mock.calls.filter(
        (call: any[]) => ['None', 'Protanopia', 'Deuteranopia', 'Tritanopia'].includes(call[2])
      );
      expect(modeButtons).toHaveLength(4);
    });

    it('should update color blind mode when button clicked', () => {
      // Find the Protanopia button
      const protanopiaButtonCall = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2] === 'Protanopia'
      );
      const buttonMock = mockScene.add.text.mock.results[
        mockScene.add.text.mock.calls.indexOf(protanopiaButtonCall)
      ].value;
      
      // Trigger click
      const clickHandler = buttonMock.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerup'
      )?.[1];
      clickHandler?.();
      
      // Should save to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'stairwaySprintAccessibility',
        expect.stringContaining('protanopia')
      );
    });
  });

  describe('toggle options', () => {
    beforeEach(() => {
      settingsScene.create();
    });

    it('should toggle high contrast mode', () => {
      // Find toggle button for high contrast
      const toggleButtons = mockScene.add.text.mock.calls.filter(
        (call: any[]) => call[2] === 'OFF' || call[2] === 'ON'
      );
      
      expect(toggleButtons.length).toBeGreaterThan(0);
      
      const firstToggle = mockScene.add.text.mock.results[
        mockScene.add.text.mock.calls.indexOf(toggleButtons[0])
      ].value;
      
      // Trigger click
      const clickHandler = firstToggle.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerup'
      )?.[1];
      clickHandler?.();
      
      // Should update localStorage
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('volume slider', () => {
    beforeEach(() => {
      settingsScene.create();
    });

    it('should create volume slider components', () => {
      // Should create slider track
      expect(mockScene.add.rectangle).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        4,
        0x666666
      );
      
      // Should create volume text
      const volumeText = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2].includes('100%')
      );
      expect(volumeText).toBeDefined();
    });

    it('should update volume when slider dragged', () => {
      // Find the slider handle
      const sliderHandle = mockScene.add.image.mock.results.find(
        (result: any) => {
          const setInteractiveCalls = result.value.setInteractive.mock.calls;
          return setInteractiveCalls.some((call: any[]) => 
            call[0]?.draggable === true
          );
        }
      )?.value;
      
      if (sliderHandle) {
        // Trigger drag
        const dragHandler = sliderHandle.on.mock.calls.find(
          (call: any[]) => call[0] === 'drag'
        )?.[1];
        
        // Drag to 50% position
        dragHandler?.(null, 0, 0);
        
        // Should update volume
        expect(localStorageMock.setItem).toHaveBeenCalled();
      }
    });
  });

  describe('keyboard interactions', () => {
    beforeEach(() => {
      settingsScene.create();
    });

    it('should close on ESC key', () => {
      const escHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-ESC'
      )?.[1];
      
      escHandler?.();
      
      expect(mockScene.scene.stop).toHaveBeenCalledWith('SettingsScene');
    });

    it('should close when close button clicked', () => {
      const closeButton = mockScene.add.text.mock.results.find(
        (result: any) => mockScene.add.text.mock.calls.find(
          (call: any[], index: number) => 
            call[2] === 'Close' && mockScene.add.text.mock.results[index] === result
        )
      )?.value;
      
      const clickHandler = closeButton?.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerup'
      )?.[1];
      
      clickHandler?.();
      
      expect(mockScene.scene.stop).toHaveBeenCalledWith('SettingsScene');
      expect(mockScene.scene.resume).toHaveBeenCalledWith('MainMenuScene');
    });
  });

  describe('responsive behavior', () => {
    beforeEach(() => {
      settingsScene.create();
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
    beforeEach(() => {
      settingsScene.create();
    });

    it('should register focusable elements', () => {
      // Count interactive text elements (buttons)
      const interactiveElements = mockScene.add.text.mock.results.filter(
        (result: any) => result.value.setInteractive.mock.calls.length > 0
      );
      
      expect(interactiveElements.length).toBeGreaterThan(0);
    });

    it('should apply high contrast styles when enabled', () => {
      // Enable high contrast
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        highContrast: true,
        colorBlindMode: 'none',
        uiSoundVolume: 1,
        keyboardNavEnabled: true,
        screenReaderMode: false
      }));
      
      // Recreate scene
      settingsScene = new SettingsScene();
      Object.assign(settingsScene, mockScene);
      settingsScene.create();
      
      // Should use high contrast colors
      const textCalls = mockScene.add.text.mock.calls;
      const hasHighContrastText = textCalls.some(
        (call: any[]) => call[3]?.color === '#ffff00'
      );
      
      expect(hasHighContrastText).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should clean up on shutdown', () => {
      settingsScene.create();
      
      // Manually call shutdown
      if (settingsScene.shutdown) {
        settingsScene.shutdown();
      }
      
      expect(mockScene.scale.off).toHaveBeenCalledWith('resize', expect.any(Function), settingsScene);
    });
  });

  describe('settings persistence', () => {
    it('should load saved settings on create', () => {
      const savedSettings = {
        colorBlindMode: 'deuteranopia',
        highContrast: true,
        uiSoundVolume: 0.5,
        keyboardNavEnabled: false,
        screenReaderMode: true
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings));
      
      settingsScene.create();
      
      // Should display current settings
      // Volume should show 50%
      const volumeText = mockScene.add.text.mock.calls.find(
        (call: any[]) => call[2].includes('50%')
      );
      expect(volumeText).toBeDefined();
    });

    it('should save settings when changed', () => {
      settingsScene.create();
      
      // Change any setting
      const toggleButton = mockScene.add.text.mock.results.find(
        (result: any) => {
          const call = mockScene.add.text.mock.calls.find(
            (c: any[], index: number) => 
              (c[2] === 'OFF' || c[2] === 'ON') && 
              mockScene.add.text.mock.results[index] === result
          );
          return call !== undefined;
        }
      )?.value;
      
      const clickHandler = toggleButton?.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerup'
      )?.[1];
      
      clickHandler?.();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'stairwaySprintAccessibility',
        expect.any(String)
      );
    });
  });
});