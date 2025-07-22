import Phaser from 'phaser';

/**
 * Device categories for responsive design
 */
export enum DeviceCategory {
  PHONE = 'phone',
  TABLET = 'tablet',
  DESKTOP = 'desktop'
}

/**
 * Responsive scaling configuration for different device types
 */
interface ScaleConfig {
  baseFontSize: number;
  minFontSize: number;
  maxFontSize: number;
  uiScale: number;
  spacing: number;
  touchTargetSize: number;
}

/**
 * Default scale configurations for each device category
 */
const SCALE_CONFIGS: Record<DeviceCategory, ScaleConfig> = {
  [DeviceCategory.PHONE]: {
    baseFontSize: 14,
    minFontSize: 12,
    maxFontSize: 24,
    uiScale: 0.8,
    spacing: 15,
    touchTargetSize: 44
  },
  [DeviceCategory.TABLET]: {
    baseFontSize: 16,
    minFontSize: 14,
    maxFontSize: 32,
    uiScale: 1.0,
    spacing: 20,
    touchTargetSize: 44
  },
  [DeviceCategory.DESKTOP]: {
    baseFontSize: 18,
    minFontSize: 16,
    maxFontSize: 48,
    uiScale: 1.2,
    spacing: 25,
    touchTargetSize: 44
  }
};

/**
 * Font size presets for different text types
 */
export enum FontSize {
  SMALL = 'small',
  NORMAL = 'normal',
  LARGE = 'large',
  TITLE = 'title',
  HEADING = 'heading'
}

/**
 * Font size multipliers for different text types
 */
const FONT_SIZE_MULTIPLIERS: Record<FontSize, number> = {
  [FontSize.SMALL]: 0.75,
  [FontSize.NORMAL]: 1.0,
  [FontSize.LARGE]: 1.25,
  [FontSize.TITLE]: 2.5,
  [FontSize.HEADING]: 1.75
};

/**
 * Responsive utility class for handling UI scaling across different devices
 */
export class ResponsiveUtils {
  private static instance: ResponsiveUtils;
  private scene: Phaser.Scene;
  private deviceCategory: DeviceCategory;
  private scaleConfig: ScaleConfig;
  private scaleFactor: number;
  private orientation: 'portrait' | 'landscape';
  
  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.deviceCategory = this.detectDeviceCategory();
    this.scaleConfig = SCALE_CONFIGS[this.deviceCategory];
    this.scaleFactor = this.calculateScaleFactor();
    this.orientation = this.detectOrientation();
  }
  
  /**
   * Get or create singleton instance
   */
  public static getInstance(scene: Phaser.Scene): ResponsiveUtils {
    if (!ResponsiveUtils.instance || ResponsiveUtils.instance.scene !== scene) {
      ResponsiveUtils.instance = new ResponsiveUtils(scene);
    }
    return ResponsiveUtils.instance;
  }
  
  /**
   * Detect device category based on screen width
   */
  private detectDeviceCategory(): DeviceCategory {
    const width = window.innerWidth;
    
    if (width < 768) {
      return DeviceCategory.PHONE;
    } else if (width >= 768 && width <= 1024) {
      return DeviceCategory.TABLET;
    } else {
      return DeviceCategory.DESKTOP;
    }
  }
  
  /**
   * Detect current orientation
   */
  private detectOrientation(): 'portrait' | 'landscape' {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }
  
  /**
   * Calculate scale factor based on canvas and window dimensions
   */
  private calculateScaleFactor(): number {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calculate scale to fit within window while maintaining aspect ratio
    const scaleX = windowWidth / gameWidth;
    const scaleY = windowHeight / gameHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // Apply device-specific scale modifier
    return scale * this.scaleConfig.uiScale;
  }
  
  /**
   * Update responsive values when window resizes
   */
  public update(): void {
    const newCategory = this.detectDeviceCategory();
    const newOrientation = this.detectOrientation();
    
    if (newCategory !== this.deviceCategory || newOrientation !== this.orientation) {
      this.deviceCategory = newCategory;
      this.orientation = newOrientation;
      this.scaleConfig = SCALE_CONFIGS[this.deviceCategory];
      this.scaleFactor = this.calculateScaleFactor();
    }
  }
  
  /**
   * Get current device category
   */
  public getDeviceCategory(): DeviceCategory {
    return this.deviceCategory;
  }
  
  /**
   * Get current orientation
   */
  public getOrientation(): 'portrait' | 'landscape' {
    return this.orientation;
  }
  
  /**
   * Get responsive font size
   */
  public getFontSize(type: FontSize = FontSize.NORMAL): number {
    const baseSize = this.scaleConfig.baseFontSize;
    const multiplier = FONT_SIZE_MULTIPLIERS[type];
    const calculatedSize = baseSize * multiplier * this.scaleFactor;
    
    // Clamp between min and max
    return Math.round(
      Math.max(
        this.scaleConfig.minFontSize,
        Math.min(this.scaleConfig.maxFontSize, calculatedSize)
      )
    );
  }
  
  /**
   * Get font style object for Phaser text
   */
  public getFontStyle(type: FontSize = FontSize.NORMAL, color: string = '#ffffff'): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontSize: `${this.getFontSize(type)}px`,
      fontFamily: 'Arial',
      color: color
    };
  }
  
  /**
   * Scale a value based on current scale factor
   */
  public scale(value: number): number {
    return Math.round(value * this.scaleFactor);
  }
  
  /**
   * Get responsive spacing value
   */
  public getSpacing(multiplier: number = 1): number {
    return Math.round(this.scaleConfig.spacing * multiplier * this.scaleFactor);
  }
  
  /**
   * Get minimum touch target size
   */
  public getTouchTargetSize(): number {
    // Touch target should never be smaller than 44px
    return Math.max(44, this.scale(this.scaleConfig.touchTargetSize));
  }
  
  /**
   * Calculate responsive position as percentage of screen
   */
  public getRelativePosition(percentage: number, dimension: 'width' | 'height'): number {
    const size = dimension === 'width' 
      ? this.scene.cameras.main.width 
      : this.scene.cameras.main.height;
    return Math.round(size * (percentage / 100));
  }
  
  /**
   * Get responsive padding based on device
   */
  public getPadding(): { x: number; y: number } {
    const basePadding = this.deviceCategory === DeviceCategory.PHONE ? 10 : 20;
    return {
      x: this.scale(basePadding),
      y: this.scale(basePadding)
    };
  }
  
  /**
   * Check if device is touch-enabled
   */
  public isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
  
  /**
   * Get safe area insets for mobile devices (notches, etc.)
   */
  public getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
    // In a real implementation, this would check for actual safe area insets
    // For now, we'll use conservative estimates
    const isPhone = this.deviceCategory === DeviceCategory.PHONE;
    const isPortrait = this.orientation === 'portrait';
    
    return {
      top: isPhone && isPortrait ? 44 : 0,
      bottom: isPhone ? 34 : 0,
      left: isPhone && !isPortrait ? 44 : 0,
      right: isPhone && !isPortrait ? 44 : 0
    };
  }
  
  /**
   * Create responsive button configuration
   */
  public getButtonConfig(text: string, fontSize: FontSize = FontSize.NORMAL): {
    minWidth: number;
    minHeight: number;
    padding: { x: number; y: number };
    fontSize: number;
  } {
    const touchSize = this.getTouchTargetSize();
    const padding = this.getPadding();
    
    return {
      minWidth: Math.max(touchSize * 2, this.scale(150)),
      minHeight: touchSize,
      padding: {
        x: padding.x * 1.5,
        y: padding.y
      },
      fontSize: this.getFontSize(fontSize)
    };
  }
  
  /**
   * Get UI element scale for images/sprites
   */
  public getUIScale(): number {
    return this.scaleConfig.uiScale * this.scaleFactor;
  }
  
  /**
   * Adjust value for high DPI displays
   */
  public getDPIAdjustedValue(value: number): number {
    const dpr = window.devicePixelRatio || 1;
    return Math.round(value * dpr) / dpr;
  }
}

/**
 * Helper function to quickly get responsive utils instance
 */
export function getResponsive(scene: Phaser.Scene): ResponsiveUtils {
  return ResponsiveUtils.getInstance(scene);
}