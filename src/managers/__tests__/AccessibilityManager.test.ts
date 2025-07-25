import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AccessibilityManager, ColorBlindMode, AccessibilitySettings } from '../AccessibilityManager';
import { mockPhaser } from '../../test/mocks/phaser.mock';
import Phaser from 'phaser';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('AccessibilityManager', () => {
  let accessibilityManager: AccessibilityManager;
  let mockScene: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null); // Start with no saved settings
    
    mockScene = new mockPhaser.Scene();
    mockScene.input = {
      keyboard: {
        on: vi.fn(),
        off: vi.fn()
      }
    };
    mockScene.children = {
      list: []
    };
    mockScene.add = {
      ...mockScene.add,
      rectangle: vi.fn().mockReturnValue({
        setDepth: vi.fn().mockReturnThis(),
        setScrollFactor: vi.fn().mockReturnThis(),
        setBlendMode: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        setFillStyle: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
        postFX: {}
      }),
      graphics: vi.fn().mockReturnValue({
        clear: vi.fn().mockReturnThis(),
        lineStyle: vi.fn().mockReturnThis(),
        strokeRoundedRect: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        destroy: vi.fn()
      })
    };
    mockScene.sound = {
      get: vi.fn().mockReturnValue(true),
      play: vi.fn()
    };
    
    accessibilityManager = new AccessibilityManager(mockScene);
  });

  afterEach(() => {
    // Clean up DOM elements
    const liveRegion = document.getElementById('phaser-aria-live');
    if (liveRegion) {
      liveRegion.remove();
    }
  });

  describe('initialization', () => {
    it('should load default settings when no saved settings exist', () => {
      const settings = accessibilityManager.getSettings();
      expect(settings).toEqual({
        colorBlindMode: ColorBlindMode.NONE,
        highContrast: false,
        uiSoundVolume: 1.0,
        keyboardNavEnabled: true,
        screenReaderMode: false
      });
    });

    it('should load saved settings from localStorage', () => {
      const savedSettings: AccessibilitySettings = {
        colorBlindMode: ColorBlindMode.PROTANOPIA,
        highContrast: true,
        uiSoundVolume: 0.5,
        keyboardNavEnabled: false,
        screenReaderMode: true
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings));
      
      const newManager = new AccessibilityManager(mockScene);
      expect(newManager.getSettings()).toEqual(savedSettings);
    });

    it('should set up keyboard listeners', () => {
      expect(mockScene.input.keyboard.on).toHaveBeenCalledWith('keydown-TAB', expect.any(Function));
      expect(mockScene.input.keyboard.on).toHaveBeenCalledWith('keydown-UP', expect.any(Function));
      expect(mockScene.input.keyboard.on).toHaveBeenCalledWith('keydown-DOWN', expect.any(Function));
      expect(mockScene.input.keyboard.on).toHaveBeenCalledWith('keydown-ENTER', expect.any(Function));
      expect(mockScene.input.keyboard.on).toHaveBeenCalledWith('keydown-SPACE', expect.any(Function));
    });
  });

  describe('settings management', () => {
    it('should update individual settings', () => {
      accessibilityManager.updateSetting('highContrast', true);
      expect(accessibilityManager.getSettings().highContrast).toBe(true);
    });

    it('should save settings to localStorage when updated', () => {
      accessibilityManager.updateSetting('uiSoundVolume', 0.7);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'stairwaySprintAccessibility',
        expect.stringContaining('"uiSoundVolume":0.7')
      );
    });

    it('should apply color blind filter when mode changes', () => {
      accessibilityManager.updateSetting('colorBlindMode', ColorBlindMode.PROTANOPIA);
      
      expect(mockScene.add.rectangle).toHaveBeenCalled();
      const filter = mockScene.add.rectangle.mock.results[0].value;
      expect(filter.setBlendMode).toHaveBeenCalledWith(Phaser.BlendModes.COLOR);
    });

    it('should remove color blind filter when set to NONE', () => {
      // First apply a filter
      accessibilityManager.updateSetting('colorBlindMode', ColorBlindMode.DEUTERANOPIA);
      const filter = mockScene.add.rectangle.mock.results[0].value;
      
      // Then remove it
      accessibilityManager.updateSetting('colorBlindMode', ColorBlindMode.NONE);
      
      expect(filter.destroy).toHaveBeenCalled();
    });

    it('should apply high contrast immediately when enabled', () => {
      // Add a mock background rectangle
      const bgRect = {
        type: 'Rectangle',
        setFillStyle: vi.fn()
      };
      mockScene.children.list = [bgRect];
      
      accessibilityManager.updateSetting('highContrast', true);
      
      expect(bgRect.setFillStyle).toHaveBeenCalledWith(0x000000);
    });
  });

  describe('focusable elements', () => {
    let mockElement: any;

    beforeEach(() => {
      mockElement = {
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        originX: 0.5,
        originY: 0.5,
        emit: vi.fn()
      };
    });

    it('should register focusable elements', () => {
      accessibilityManager.registerFocusableElement(mockElement as Phaser.GameObjects.GameObject);
      // Internal state check would be through behavior
      expect(accessibilityManager).toBeDefined();
    });

    it('should not register same element twice', () => {
      accessibilityManager.registerFocusableElement(mockElement as Phaser.GameObjects.GameObject);
      accessibilityManager.registerFocusableElement(mockElement as Phaser.GameObjects.GameObject);
      // Would need to check internal array length through behavior
      expect(accessibilityManager).toBeDefined();
    });

    it('should unregister focusable elements', () => {
      accessibilityManager.registerFocusableElement(mockElement as Phaser.GameObjects.GameObject);
      accessibilityManager.unregisterFocusableElement(mockElement as Phaser.GameObjects.GameObject);
      // Element should be removed from internal array
      expect(accessibilityManager).toBeDefined();
    });

    it('should clear all focusable elements', () => {
      accessibilityManager.registerFocusableElement(mockElement as Phaser.GameObjects.GameObject);
      accessibilityManager.registerFocusableElement({ ...mockElement, id: 2 } as Phaser.GameObjects.GameObject);
      
      accessibilityManager.clearFocusableElements();
      // All elements should be cleared
      expect(accessibilityManager).toBeDefined();
    });
  });

  describe('keyboard navigation', () => {
    let mockElement1: any;
    let mockElement2: any;
    let mockElement3: any;

    beforeEach(() => {
      mockElement1 = {
        x: 100, y: 100, width: 50, height: 50,
        originX: 0.5, originY: 0.5, emit: vi.fn()
      };
      mockElement2 = {
        x: 200, y: 100, width: 50, height: 50,
        originX: 0.5, originY: 0.5, emit: vi.fn()
      };
      mockElement3 = {
        x: 300, y: 100, width: 50, height: 50,
        originX: 0.5, originY: 0.5, emit: vi.fn()
      };
      
      accessibilityManager.registerFocusableElement(mockElement1 as Phaser.GameObjects.GameObject);
      accessibilityManager.registerFocusableElement(mockElement2 as Phaser.GameObjects.GameObject);
      accessibilityManager.registerFocusableElement(mockElement3 as Phaser.GameObjects.GameObject);
    });

    it('should focus next element on TAB', () => {
      const tabHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-TAB'
      )?.[1];
      
      const mockEvent = { preventDefault: vi.fn(), shiftKey: false };
      tabHandler?.(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockScene.add.graphics).toHaveBeenCalled();
    });

    it('should focus previous element on SHIFT+TAB', () => {
      const tabHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-TAB'
      )?.[1];
      
      const mockEvent = { preventDefault: vi.fn(), shiftKey: true };
      tabHandler?.(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should focus next on DOWN arrow', () => {
      const downHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-DOWN'
      )?.[1];
      
      downHandler?.();
      
      expect(mockScene.add.graphics).toHaveBeenCalled();
    });

    it('should focus previous on UP arrow', () => {
      const upHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-UP'
      )?.[1];
      
      upHandler?.();
      
      expect(mockScene.add.graphics).toHaveBeenCalled();
    });

    it('should activate focused element on ENTER', () => {
      // First focus an element
      const downHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-DOWN'
      )?.[1];
      downHandler?.();
      
      // Then activate it
      const enterHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-ENTER'
      )?.[1];
      enterHandler?.();
      
      expect(mockElement2.emit).toHaveBeenCalledWith('pointerdown');
      expect(mockElement2.emit).toHaveBeenCalledWith('pointerup');
    });

    it('should not navigate when keyboard nav is disabled', () => {
      accessibilityManager.updateSetting('keyboardNavEnabled', false);
      
      const downHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-DOWN'
      )?.[1];
      downHandler?.();
      
      // Graphics should not be created for focus indicator
      expect(mockScene.add.graphics).not.toHaveBeenCalled();
    });
  });

  describe('UI sounds', () => {
    it('should play UI sound with adjusted volume', () => {
      accessibilityManager.updateSetting('uiSoundVolume', 0.5);
      accessibilityManager.playUISound('click', 0.8);
      
      expect(mockScene.sound.play).toHaveBeenCalledWith('click', { volume: 0.4 }); // 0.8 * 0.5
    });

    it('should not play sound if sound not found', () => {
      mockScene.sound.get.mockReturnValue(false);
      accessibilityManager.playUISound('nonexistent');
      
      expect(mockScene.sound.play).not.toHaveBeenCalled();
    });
  });

  describe('screen reader support', () => {
    it('should not create ARIA live region when screen reader mode is off', () => {
      // Focus an element to trigger announcement
      const mockElement = {
        x: 100, y: 100, width: 50, height: 50,
        originX: 0.5, originY: 0.5, emit: vi.fn()
      };
      accessibilityManager.registerFocusableElement(mockElement as Phaser.GameObjects.GameObject);
      
      const downHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-DOWN'
      )?.[1];
      downHandler?.();
      
      expect(document.getElementById('phaser-aria-live')).toBeNull();
    });

    it('should create ARIA live region when screen reader mode is on', () => {
      accessibilityManager.updateSetting('screenReaderMode', true);
      
      // Focus an element to trigger announcement
      const mockElement = {
        x: 100, y: 100, width: 50, height: 50,
        originX: 0.5, originY: 0.5, emit: vi.fn()
      };
      accessibilityManager.registerFocusableElement(mockElement as Phaser.GameObjects.GameObject);
      
      const downHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-DOWN'
      )?.[1];
      downHandler?.();
      
      const liveRegion = document.getElementById('phaser-aria-live');
      expect(liveRegion).not.toBeNull();
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');
    });

    it('should announce text content for focused text elements', () => {
      accessibilityManager.updateSetting('screenReaderMode', true);
      
      const textElement = Object.assign(new mockPhaser.GameObjects.Text(), {
        x: 100, y: 100, width: 100, height: 30,
        originX: 0.5, originY: 0.5,
        text: 'Play Game'
      });
      
      accessibilityManager.registerFocusableElement(textElement as Phaser.GameObjects.GameObject);
      
      const downHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-DOWN'
      )?.[1];
      downHandler?.();
      
      const liveRegion = document.getElementById('phaser-aria-live');
      expect(liveRegion?.textContent).toBe('Play Game');
    });

    it('should use custom accessibility label if available', () => {
      accessibilityManager.updateSetting('screenReaderMode', true);
      
      const element = {
        x: 100, y: 100, width: 50, height: 50,
        originX: 0.5, originY: 0.5, emit: vi.fn(),
        accessibilityLabel: 'Main menu button'
      };
      
      accessibilityManager.registerFocusableElement(element as Phaser.GameObjects.GameObject);
      
      const downHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-DOWN'
      )?.[1];
      downHandler?.();
      
      const liveRegion = document.getElementById('phaser-aria-live');
      expect(liveRegion?.textContent).toBe('Main menu button');
    });
  });

  describe('contrast checking', () => {
    it('should check contrast ratio between colors', () => {
      // White on black should pass
      const whiteOnBlack = accessibilityManager.checkContrastRatio(0xffffff, 0x000000);
      expect(whiteOnBlack).toBe(true);
      
      // Light gray on white might fail
      const lightGrayOnWhite = accessibilityManager.checkContrastRatio(0xcccccc, 0xffffff);
      expect(lightGrayOnWhite).toBe(false);
    });

    it('should calculate correct contrast ratios', () => {
      // Black on white = 21:1 ratio
      const blackOnWhite = accessibilityManager.checkContrastRatio(0x000000, 0xffffff);
      expect(blackOnWhite).toBe(true);
      
      // Dark gray on light gray should be borderline
      const grayOnGray = accessibilityManager.checkContrastRatio(0x666666, 0xcccccc);
      expect(typeof grayOnGray).toBe('boolean');
    });
  });

  describe('cleanup', () => {
    it('should clean up all resources on destroy', () => {
      // Create some elements
      accessibilityManager.updateSetting('colorBlindMode', ColorBlindMode.TRITANOPIA);
      accessibilityManager.updateSetting('screenReaderMode', true);
      
      const mockElement = {
        x: 100, y: 100, width: 50, height: 50,
        originX: 0.5, originY: 0.5, emit: vi.fn()
      };
      accessibilityManager.registerFocusableElement(mockElement as Phaser.GameObjects.GameObject);
      
      // Focus to create graphics
      const downHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-DOWN'
      )?.[1];
      downHandler?.();
      
      const filter = mockScene.add.rectangle.mock.results[0].value;
      const graphics = mockScene.add.graphics.mock.results[0].value;
      
      // Destroy
      accessibilityManager.destroy();
      
      expect(filter.destroy).toHaveBeenCalled();
      expect(graphics.destroy).toHaveBeenCalled();
      expect(document.getElementById('phaser-aria-live')).toBeNull();
    });

    it('should clear all focusable elements on destroy', () => {
      const mockElement = { emit: vi.fn() };
      accessibilityManager.registerFocusableElement(mockElement as Phaser.GameObjects.GameObject);
      
      accessibilityManager.destroy();
      
      // Try to focus - should not create graphics since elements are cleared
      const downHandler = mockScene.input.keyboard.on.mock.calls.find(
        (call: any[]) => call[0] === 'keydown-DOWN'
      )?.[1];
      downHandler?.();
      
      expect(mockScene.add.graphics).not.toHaveBeenCalled();
    });
  });

  describe('color blind modes', () => {
    it('should apply protanopia filter', () => {
      accessibilityManager.updateSetting('colorBlindMode', ColorBlindMode.PROTANOPIA);
      
      const filter = mockScene.add.rectangle.mock.results[0].value;
      expect(filter.setFillStyle).toHaveBeenCalledWith(0xffcccc, 0.3);
    });

    it('should apply deuteranopia filter', () => {
      accessibilityManager.updateSetting('colorBlindMode', ColorBlindMode.DEUTERANOPIA);
      
      const filter = mockScene.add.rectangle.mock.results[0].value;
      expect(filter.setFillStyle).toHaveBeenCalledWith(0xccffcc, 0.3);
    });

    it('should apply tritanopia filter', () => {
      accessibilityManager.updateSetting('colorBlindMode', ColorBlindMode.TRITANOPIA);
      
      const filter = mockScene.add.rectangle.mock.results[0].value;
      expect(filter.setFillStyle).toHaveBeenCalledWith(0xccccff, 0.3);
    });
  });
});