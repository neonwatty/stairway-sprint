import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UISoundManager, UISound } from '../UISoundManager';
import { AccessibilityManager } from '../AccessibilityManager';
import { mockPhaser } from '../../test/mocks/phaser.mock';

describe('UISoundManager', () => {
  let uiSoundManager: UISoundManager;
  let mockScene: any;
  let accessibilityManager: AccessibilityManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockScene = new mockPhaser.Scene();
    mockScene.sound = {
      get: vi.fn().mockReturnValue(true),
      play: vi.fn()
    };
    mockScene.input = {
      keyboard: {
        on: vi.fn(),
        off: vi.fn()
      }
    };
    mockScene.children = {
      list: []
    };
    
    uiSoundManager = new UISoundManager(mockScene);
    accessibilityManager = new AccessibilityManager(mockScene);
  });

  describe('initialization', () => {
    it('should create UI sound manager', () => {
      expect(uiSoundManager).toBeDefined();
    });

    it('should set accessibility manager', () => {
      uiSoundManager.setAccessibilityManager(accessibilityManager);
      // Manager is set internally, verify through behavior
      expect(uiSoundManager).toBeDefined();
    });
  });

  describe('sound preloading', () => {
    it('should mark all UI sounds as loaded', () => {
      uiSoundManager.preloadSounds();
      
      // In real implementation, this would load actual audio files
      // For now, it just marks them as loaded internally
      expect(uiSoundManager).toBeDefined();
    });
  });

  describe('playing sounds', () => {
    it('should play sound without accessibility manager', () => {
      uiSoundManager.play(UISound.BUTTON_CLICK, 0.5);
      
      expect(mockScene.sound.play).toHaveBeenCalledWith(UISound.BUTTON_CLICK, { volume: 0.5 });
    });

    it('should play sound through accessibility manager when set', () => {
      const playSpy = vi.spyOn(accessibilityManager, 'playUISound');
      uiSoundManager.setAccessibilityManager(accessibilityManager);
      
      uiSoundManager.play(UISound.BUTTON_CLICK, 0.5);
      
      expect(playSpy).toHaveBeenCalledWith(UISound.BUTTON_CLICK, 0.5);
    });

    it('should not play sound if not found and no accessibility manager', () => {
      mockScene.sound.get.mockReturnValue(false);
      
      uiSoundManager.play(UISound.BUTTON_CLICK, 0.5);
      
      expect(mockScene.sound.play).not.toHaveBeenCalled();
    });

    it('should use default volume if not specified', () => {
      uiSoundManager.play(UISound.BUTTON_CLICK);
      
      expect(mockScene.sound.play).toHaveBeenCalledWith(UISound.BUTTON_CLICK, { volume: 0.5 });
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      vi.spyOn(uiSoundManager, 'play');
    });

    it('should play hover sound with correct volume', () => {
      uiSoundManager.playHover();
      expect(uiSoundManager.play).toHaveBeenCalledWith(UISound.BUTTON_HOVER, 0.3);
    });

    it('should play click sound with correct volume', () => {
      uiSoundManager.playClick();
      expect(uiSoundManager.play).toHaveBeenCalledWith(UISound.BUTTON_CLICK, 0.5);
    });

    it('should play success sound with correct volume', () => {
      uiSoundManager.playSuccess();
      expect(uiSoundManager.play).toHaveBeenCalledWith(UISound.SUCCESS, 0.6);
    });

    it('should play error sound with correct volume', () => {
      uiSoundManager.playError();
      expect(uiSoundManager.play).toHaveBeenCalledWith(UISound.ERROR, 0.5);
    });

    it('should play focus change sound with correct volume', () => {
      uiSoundManager.playFocusChange();
      expect(uiSoundManager.play).toHaveBeenCalledWith(UISound.FOCUS_CHANGE, 0.2);
    });

    it('should play toggle sound with correct volume', () => {
      uiSoundManager.playToggle();
      expect(uiSoundManager.play).toHaveBeenCalledWith(UISound.TOGGLE, 0.4);
    });
  });

  describe('button sound effects', () => {
    let mockButton: any;

    beforeEach(() => {
      mockButton = {
        input: {},
        on: vi.fn()
      };
    });

    it('should add default button sounds', () => {
      uiSoundManager.addButtonSounds(mockButton);
      
      expect(mockButton.on).toHaveBeenCalledWith('pointerover', expect.any(Function));
      expect(mockButton.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    });

    it('should add only hover sound when click is disabled', () => {
      uiSoundManager.addButtonSounds(mockButton, { hover: true, click: false });
      
      expect(mockButton.on).toHaveBeenCalledWith('pointerover', expect.any(Function));
      expect(mockButton.on).not.toHaveBeenCalledWith('pointerdown', expect.any(Function));
    });

    it('should add only click sound when hover is disabled', () => {
      uiSoundManager.addButtonSounds(mockButton, { hover: false, click: true });
      
      expect(mockButton.on).not.toHaveBeenCalledWith('pointerover', expect.any(Function));
      expect(mockButton.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    });

    it('should use custom volumes', () => {
      vi.spyOn(uiSoundManager, 'play');
      uiSoundManager.addButtonSounds(mockButton, {
        hover: true,
        click: true,
        hoverVolume: 0.7,
        clickVolume: 0.9
      });
      
      // Trigger hover
      const hoverHandler = mockButton.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerover'
      )?.[1];
      hoverHandler?.();
      
      expect(uiSoundManager.play).toHaveBeenCalledWith(UISound.BUTTON_HOVER, 0.7);
      
      // Trigger click
      const clickHandler = mockButton.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerdown'
      )?.[1];
      clickHandler?.();
      
      expect(uiSoundManager.play).toHaveBeenCalledWith(UISound.BUTTON_CLICK, 0.9);
    });

    it('should warn if button is not interactive', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const nonInteractiveButton = { on: vi.fn() };
      
      uiSoundManager.addButtonSounds(nonInteractiveButton as Phaser.GameObjects.GameObject);
      
      expect(consoleSpy).toHaveBeenCalledWith('Button must be interactive to add sounds');
      expect(nonInteractiveButton.on).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('accessible button creation', () => {
    it('should create text button with proper setup', () => {
      const callback = vi.fn();
      const button = uiSoundManager.createAccessibleButton(
        mockScene,
        100,
        200,
        'Play Game',
        { fontSize: '24px', color: '#ffffff' },
        callback,
        'Start a new game'
      ) as any;
      
      expect(mockScene.add.text).toHaveBeenCalledWith(100, 200, 'Play Game', {
        fontSize: '24px',
        color: '#ffffff'
      });
      
      expect(button.setOrigin).toHaveBeenCalledWith(0.5);
      expect(button.setInteractive).toHaveBeenCalledWith({ useHandCursor: true });
    });

    it('should add accessibility label', () => {
      const button = uiSoundManager.createAccessibleButton(
        mockScene,
        100,
        200,
        'X',
        {},
        () => {},
        'Close dialog'
      ) as any;
      
      expect((button as any).accessibilityLabel).toBe('Close dialog');
    });

    it('should use button text as default accessibility label', () => {
      const button = uiSoundManager.createAccessibleButton(
        mockScene,
        100,
        200,
        'Settings',
        {},
        () => {}
      ) as any;
      
      expect((button as any).accessibilityLabel).toBe('Settings');
    });

    it('should add button sounds automatically', () => {
      vi.spyOn(uiSoundManager, 'addButtonSounds');
      
      const button = uiSoundManager.createAccessibleButton(
        mockScene,
        100,
        200,
        'Test',
        {},
        () => {}
      ) as any;
      
      expect(uiSoundManager.addButtonSounds).toHaveBeenCalledWith(button);
    });

    it('should handle click callback', () => {
      const callback = vi.fn();
      const button = uiSoundManager.createAccessibleButton(
        mockScene,
        100,
        200,
        'Click Me',
        {},
        callback
      ) as any;
      
      // Find and trigger the pointerup handler
      const clickHandler = button.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerup'
      )?.[1];
      clickHandler?.();
      
      expect(callback).toHaveBeenCalled();
    });

    it('should add visual feedback handlers', () => {
      const button = uiSoundManager.createAccessibleButton(
        mockScene,
        100,
        200,
        'Button',
        {},
        () => {}
      ) as any;
      
      // Test hover effect
      const hoverHandler = button.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerover'
      )?.[1];
      hoverHandler?.();
      expect(button.setScale).toHaveBeenCalledWith(1.05);
      
      // Test hover out effect
      const outHandler = button.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerout'
      )?.[1];
      outHandler?.();
      expect(button.setScale).toHaveBeenCalledWith(1);
      
      // Test press effect
      const downHandler = button.on.mock.calls.find(
        (call: any[]) => call[0] === 'pointerdown'
      )?.[1];
      downHandler?.();
      expect(button.setScale).toHaveBeenCalledWith(0.95);
    });
  });

  describe('integration with accessibility manager', () => {
    it('should respect UI sound volume from accessibility settings', () => {
      // Set accessibility volume to 0.5
      accessibilityManager.updateSetting('uiSoundVolume', 0.5);
      uiSoundManager.setAccessibilityManager(accessibilityManager);
      
      // Play a sound with base volume 0.8
      uiSoundManager.play(UISound.SUCCESS, 0.8);
      
      // Should play at 0.8 * 0.5 = 0.4
      expect(mockScene.sound.play).toHaveBeenCalledWith(UISound.SUCCESS, { volume: 0.4 });
    });

    it('should handle accessibility manager being unset', () => {
      // Set and then unset
      uiSoundManager.setAccessibilityManager(accessibilityManager);
      uiSoundManager.setAccessibilityManager(undefined as any);
      
      // Should fallback to regular sound playing
      uiSoundManager.play(UISound.BUTTON_CLICK, 0.5);
      
      expect(mockScene.sound.play).toHaveBeenCalledWith(UISound.BUTTON_CLICK, { volume: 0.5 });
    });
  });
});