import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResponsiveUtils, DeviceCategory, FontSize, getResponsive } from '../ResponsiveUtils';
import { mockPhaser } from '../../test/mocks/phaser.mock';

// Mock window properties
const mockWindow = (width: number, height: number, dpr: number = 1) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  });
  Object.defineProperty(window, 'devicePixelRatio', {
    writable: true,
    configurable: true,
    value: dpr
  });
};

describe('ResponsiveUtils', () => {
  let mockScene: any;
  let responsiveUtils: ResponsiveUtils;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockScene = new mockPhaser.Scene();
    mockScene.cameras = {
      main: {
        width: 640,
        height: 960
      }
    };

    // Reset window to default desktop size
    mockWindow(1920, 1080);
  });

  describe('device detection', () => {
    it('should detect phone for width < 768px', () => {
      mockWindow(375, 667);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      expect(responsiveUtils.getDeviceCategory()).toBe(DeviceCategory.PHONE);
    });

    it('should detect tablet for width 768-1024px', () => {
      mockWindow(768, 1024);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      expect(responsiveUtils.getDeviceCategory()).toBe(DeviceCategory.TABLET);
    });

    it('should detect desktop for width > 1024px', () => {
      mockWindow(1920, 1080);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      expect(responsiveUtils.getDeviceCategory()).toBe(DeviceCategory.DESKTOP);
    });
  });

  describe('orientation detection', () => {
    it('should detect portrait when height > width', () => {
      mockWindow(375, 667);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      expect(responsiveUtils.getOrientation()).toBe('portrait');
    });

    it('should detect landscape when width > height', () => {
      mockWindow(667, 375);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      expect(responsiveUtils.getOrientation()).toBe('landscape');
    });
  });

  describe('singleton behavior', () => {
    it('should return same instance for same scene', () => {
      const instance1 = ResponsiveUtils.getInstance(mockScene);
      const instance2 = ResponsiveUtils.getInstance(mockScene);
      expect(instance1).toBe(instance2);
    });

    it('should create new instance for different scene', () => {
      const instance1 = ResponsiveUtils.getInstance(mockScene);
      const newScene = new mockPhaser.Scene();
      newScene.cameras = { main: { width: 640, height: 960 } };
      const instance2 = ResponsiveUtils.getInstance(newScene);
      expect(instance1).not.toBe(instance2);
    });

    it('should work with helper function', () => {
      const instance = getResponsive(mockScene);
      expect(instance).toBe(ResponsiveUtils.getInstance(mockScene));
    });
  });

  describe('font sizing', () => {
    beforeEach(() => {
      mockWindow(1920, 1080); // Desktop
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
    });

    it('should calculate font size for SMALL', () => {
      const size = responsiveUtils.getFontSize(FontSize.SMALL);
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(responsiveUtils.getFontSize(FontSize.NORMAL));
    });

    it('should calculate font size for NORMAL', () => {
      const size = responsiveUtils.getFontSize(FontSize.NORMAL);
      expect(size).toBeGreaterThan(0);
    });

    it('should calculate font size for LARGE', () => {
      const size = responsiveUtils.getFontSize(FontSize.LARGE);
      expect(size).toBeGreaterThan(responsiveUtils.getFontSize(FontSize.NORMAL));
    });

    it('should calculate font size for TITLE', () => {
      const size = responsiveUtils.getFontSize(FontSize.TITLE);
      expect(size).toBeGreaterThan(responsiveUtils.getFontSize(FontSize.HEADING));
    });

    it('should clamp font size to min/max values', () => {
      // Test with very small scale
      mockWindow(320, 240);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      
      const size = responsiveUtils.getFontSize(FontSize.SMALL);
      expect(size).toBeGreaterThanOrEqual(16); // Desktop min font size
    });

    it('should return font style object', () => {
      const style = responsiveUtils.getFontStyle(FontSize.NORMAL, '#ff0000');
      expect(style).toMatchObject({
        fontSize: expect.stringMatching(/^\d+px$/),
        fontFamily: 'Arial',
        color: '#ff0000'
      });
    });
  });

  describe('scaling', () => {
    beforeEach(() => {
      mockWindow(1920, 1080);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
    });

    it('should scale values based on device', () => {
      const scaled = responsiveUtils.scale(100);
      expect(scaled).toBeGreaterThan(0);
      expect(Number.isInteger(scaled)).toBe(true);
    });

    it('should scale differently for different devices', () => {
      // Desktop
      const desktopScaled = responsiveUtils.scale(100);
      
      // Phone
      mockWindow(375, 667);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      const phoneScaled = responsiveUtils.scale(100);
      
      expect(desktopScaled).not.toBe(phoneScaled);
    });

    it('should get UI scale factor', () => {
      const scale = responsiveUtils.getUIScale();
      expect(scale).toBeGreaterThan(0);
    });
  });

  describe('spacing and padding', () => {
    it('should get responsive spacing', () => {
      mockWindow(1920, 1080);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      
      const spacing = responsiveUtils.getSpacing();
      expect(spacing).toBeGreaterThan(0);
      
      const doubleSpacing = responsiveUtils.getSpacing(2);
      expect(doubleSpacing).toBe(spacing * 2);
    });

    it('should get different padding for phone vs desktop', () => {
      // Desktop
      mockWindow(1920, 1080);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      const desktopPadding = responsiveUtils.getPadding();
      
      // Phone
      mockWindow(375, 667);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      const phonePadding = responsiveUtils.getPadding();
      
      expect(desktopPadding.x).toBeGreaterThan(phonePadding.x);
    });
  });

  describe('touch functionality', () => {
    it('should enforce minimum touch target size', () => {
      mockWindow(375, 667);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      
      const touchSize = responsiveUtils.getTouchTargetSize();
      expect(touchSize).toBeGreaterThanOrEqual(44); // Minimum accessibility requirement
    });

    it('should detect touch device', () => {
      // Mock touch device
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 5
      });
      
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      expect(responsiveUtils.isTouchDevice()).toBe(true);
      
      // Reset
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 0
      });
    });
  });

  describe('relative positioning', () => {
    beforeEach(() => {
      mockWindow(1920, 1080);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
    });

    it('should calculate relative width position', () => {
      const pos = responsiveUtils.getRelativePosition(50, 'width');
      expect(pos).toBe(320); // 50% of 640px
    });

    it('should calculate relative height position', () => {
      const pos = responsiveUtils.getRelativePosition(25, 'height');
      expect(pos).toBe(240); // 25% of 960px
    });
  });

  describe('safe area insets', () => {
    it('should return safe area for phone in portrait', () => {
      mockWindow(375, 667);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      
      const insets = responsiveUtils.getSafeAreaInsets();
      expect(insets.top).toBeGreaterThan(0);
      expect(insets.bottom).toBeGreaterThan(0);
      expect(insets.left).toBe(0);
      expect(insets.right).toBe(0);
    });

    it('should return safe area for phone in landscape', () => {
      mockWindow(667, 375);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      
      const insets = responsiveUtils.getSafeAreaInsets();
      expect(insets.left).toBeGreaterThan(0);
      expect(insets.right).toBeGreaterThan(0);
    });

    it('should return no safe area for desktop', () => {
      mockWindow(1920, 1080);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      
      const insets = responsiveUtils.getSafeAreaInsets();
      expect(insets.top).toBe(0);
      expect(insets.bottom).toBe(0);
      expect(insets.left).toBe(0);
      expect(insets.right).toBe(0);
    });
  });

  describe('button configuration', () => {
    beforeEach(() => {
      mockWindow(1920, 1080);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
    });

    it('should create button config with minimum sizes', () => {
      const config = responsiveUtils.getButtonConfig('Click Me');
      
      expect(config.minWidth).toBeGreaterThanOrEqual(88); // 44 * 2
      expect(config.minHeight).toBeGreaterThanOrEqual(44);
      expect(config.padding.x).toBeGreaterThan(0);
      expect(config.padding.y).toBeGreaterThan(0);
      expect(config.fontSize).toBeGreaterThan(0);
    });

    it('should use specified font size', () => {
      const config = responsiveUtils.getButtonConfig('Click Me', FontSize.LARGE);
      const normalConfig = responsiveUtils.getButtonConfig('Click Me', FontSize.NORMAL);
      
      expect(config.fontSize).toBeGreaterThan(normalConfig.fontSize);
    });
  });

  describe('DPI adjustment', () => {
    it('should adjust value for high DPI displays', () => {
      mockWindow(1920, 1080, 2); // 2x DPI
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      
      const adjusted = responsiveUtils.getDPIAdjustedValue(100);
      expect(adjusted).toBe(100); // Should remain 100 after adjustment
    });

    it('should handle fractional DPI', () => {
      mockWindow(1920, 1080, 1.5);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      
      const adjusted = responsiveUtils.getDPIAdjustedValue(100);
      expect(Number.isFinite(adjusted)).toBe(true);
    });
  });

  describe('update on resize', () => {
    it('should update device category on resize', () => {
      mockWindow(1920, 1080);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      expect(responsiveUtils.getDeviceCategory()).toBe(DeviceCategory.DESKTOP);
      
      // Resize to phone
      mockWindow(375, 667);
      responsiveUtils.update();
      expect(responsiveUtils.getDeviceCategory()).toBe(DeviceCategory.PHONE);
    });

    it('should update orientation on resize', () => {
      mockWindow(667, 375);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      expect(responsiveUtils.getOrientation()).toBe('landscape');
      
      // Rotate to portrait
      mockWindow(375, 667);
      responsiveUtils.update();
      expect(responsiveUtils.getOrientation()).toBe('portrait');
    });

    it('should recalculate scale factor on update', () => {
      mockWindow(1920, 1080);
      responsiveUtils = ResponsiveUtils.getInstance(mockScene);
      const initialScale = responsiveUtils.scale(100);
      
      // Change to different device
      mockWindow(375, 667);
      responsiveUtils.update();
      const newScale = responsiveUtils.scale(100);
      
      expect(newScale).not.toBe(initialScale);
    });
  });
});