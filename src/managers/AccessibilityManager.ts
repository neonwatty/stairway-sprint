import Phaser from 'phaser';

export enum ColorBlindMode {
  NONE = 'none',
  PROTANOPIA = 'protanopia',     // Red-blind
  DEUTERANOPIA = 'deuteranopia', // Green-blind
  TRITANOPIA = 'tritanopia'       // Blue-blind
}

export interface AccessibilitySettings {
  colorBlindMode: ColorBlindMode;
  highContrast: boolean;
  uiSoundVolume: number;
  keyboardNavEnabled: boolean;
  screenReaderMode: boolean;
}

export class AccessibilityManager {
  private scene: Phaser.Scene;
  private settings: AccessibilitySettings;
  private colorBlindFilter?: Phaser.GameObjects.Rectangle;
  private focusedElement: Phaser.GameObjects.GameObject | null = null;
  private focusableElements: Phaser.GameObjects.GameObject[] = [];
  private focusIndex: number = 0;
  private focusIndicator?: Phaser.GameObjects.Graphics;
  
  // Color blind filter matrices
  private readonly colorBlindMatrices = {
    [ColorBlindMode.PROTANOPIA]: [
      0.567, 0.433, 0.000,
      0.558, 0.442, 0.000,
      0.000, 0.242, 0.758
    ],
    [ColorBlindMode.DEUTERANOPIA]: [
      0.625, 0.375, 0.000,
      0.700, 0.300, 0.000,
      0.000, 0.300, 0.700
    ],
    [ColorBlindMode.TRITANOPIA]: [
      0.950, 0.050, 0.000,
      0.000, 0.433, 0.567,
      0.000, 0.475, 0.525
    ]
  };
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.settings = this.loadSettings();
    this.setupKeyboardListeners();
  }
  
  /**
   * Load accessibility settings from localStorage
   */
  private loadSettings(): AccessibilitySettings {
    const savedSettings = localStorage.getItem('stairwaySprintAccessibility');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    
    // Default settings
    return {
      colorBlindMode: ColorBlindMode.NONE,
      highContrast: false,
      uiSoundVolume: 1.0,
      keyboardNavEnabled: true,
      screenReaderMode: false
    };
  }
  
  /**
   * Save accessibility settings to localStorage
   */
  private saveSettings(): void {
    localStorage.setItem('stairwaySprintAccessibility', JSON.stringify(this.settings));
  }
  
  /**
   * Update a specific setting
   */
  public updateSetting<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ): void {
    this.settings[key] = value;
    this.saveSettings();
    
    // Apply changes immediately
    if (key === 'colorBlindMode') {
      this.applyColorBlindFilter();
    } else if (key === 'highContrast') {
      this.applyHighContrast();
    }
  }
  
  /**
   * Get current settings
   */
  public getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }
  
  /**
   * Apply color blind filter to the scene
   */
  private applyColorBlindFilter(): void {
    // Remove existing filter
    if (this.colorBlindFilter) {
      this.colorBlindFilter.destroy();
      this.colorBlindFilter = undefined;
    }
    
    if (this.settings.colorBlindMode === ColorBlindMode.NONE) {
      return;
    }
    
    // Create fullscreen overlay with color matrix
    const { width, height } = this.scene.cameras.main;
    this.colorBlindFilter = this.scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0xffffff,
      0
    );
    
    this.colorBlindFilter.setDepth(1000);
    this.colorBlindFilter.setScrollFactor(0);
    this.colorBlindFilter.setBlendMode(Phaser.BlendModes.COLOR);
    
    // Apply color matrix based on mode
    const matrix = this.colorBlindMatrices[this.settings.colorBlindMode];
    if (matrix && this.colorBlindFilter.postFX) {
      // Note: In Phaser 3, we'd need a custom shader for proper color blind simulation
      // For now, we'll use a tint as a placeholder
      const tintColors: Record<ColorBlindMode, number> = {
        [ColorBlindMode.NONE]: 0xffffff,
        [ColorBlindMode.PROTANOPIA]: 0xffcccc,
        [ColorBlindMode.DEUTERANOPIA]: 0xccffcc,
        [ColorBlindMode.TRITANOPIA]: 0xccccff
      };
      this.colorBlindFilter.setAlpha(0.3);
      this.colorBlindFilter.setFillStyle(tintColors[this.settings.colorBlindMode], 0.3);
    }
  }
  
  /**
   * Apply high contrast mode
   */
  private applyHighContrast(): void {
    if (this.settings.highContrast) {
      // For high contrast, we'll adjust the scene's background and ensure all text has good contrast
      // Note: Phaser 3 doesn't have built-in contrast effects, so we simulate with color adjustments
      const bg = this.scene.children.list.find(child => child.type === 'Rectangle');
      if (bg && 'setFillStyle' in bg) {
        (bg as Phaser.GameObjects.Rectangle).setFillStyle(0x000000);
      }
    } else {
      // Reset to normal colors
      const bg = this.scene.children.list.find(child => child.type === 'Rectangle');
      if (bg && 'setFillStyle' in bg) {
        (bg as Phaser.GameObjects.Rectangle).setFillStyle(0x1a1a1a);
      }
    }
  }
  
  /**
   * Register an element as focusable for keyboard navigation
   */
  public registerFocusableElement(element: Phaser.GameObjects.GameObject): void {
    if (!this.focusableElements.includes(element)) {
      this.focusableElements.push(element);
    }
  }
  
  /**
   * Unregister a focusable element
   */
  public unregisterFocusableElement(element: Phaser.GameObjects.GameObject): void {
    const index = this.focusableElements.indexOf(element);
    if (index > -1) {
      this.focusableElements.splice(index, 1);
      if (this.focusIndex >= this.focusableElements.length) {
        this.focusIndex = Math.max(0, this.focusableElements.length - 1);
      }
    }
  }
  
  /**
   * Clear all focusable elements
   */
  public clearFocusableElements(): void {
    this.focusableElements = [];
    this.focusIndex = 0;
    this.removeFocus();
  }
  
  /**
   * Set up keyboard navigation listeners
   */
  private setupKeyboardListeners(): void {
    if (!this.scene.input.keyboard) return;
    
    // Tab navigation
    this.scene.input.keyboard.on('keydown-TAB', (event: KeyboardEvent) => {
      if (!this.settings.keyboardNavEnabled) return;
      
      event.preventDefault();
      
      if (event.shiftKey) {
        this.focusPrevious();
      } else {
        this.focusNext();
      }
    });
    
    // Arrow key navigation
    this.scene.input.keyboard.on('keydown-UP', () => {
      if (this.settings.keyboardNavEnabled) {
        this.focusPrevious();
      }
    });
    
    this.scene.input.keyboard.on('keydown-DOWN', () => {
      if (this.settings.keyboardNavEnabled) {
        this.focusNext();
      }
    });
    
    // Enter/Space to activate
    this.scene.input.keyboard.on('keydown-ENTER', () => {
      if (this.settings.keyboardNavEnabled) {
        this.activateFocusedElement();
      }
    });
    
    this.scene.input.keyboard.on('keydown-SPACE', (event: KeyboardEvent) => {
      if (this.settings.keyboardNavEnabled && this.focusedElement) {
        event.preventDefault();
        this.activateFocusedElement();
      }
    });
  }
  
  /**
   * Focus the next element
   */
  private focusNext(): void {
    if (this.focusableElements.length === 0) return;
    
    this.focusIndex = (this.focusIndex + 1) % this.focusableElements.length;
    this.updateFocus();
  }
  
  /**
   * Focus the previous element
   */
  private focusPrevious(): void {
    if (this.focusableElements.length === 0) return;
    
    this.focusIndex = (this.focusIndex - 1 + this.focusableElements.length) % this.focusableElements.length;
    this.updateFocus();
  }
  
  /**
   * Update focus indicator
   */
  private updateFocus(): void {
    this.removeFocus();
    
    if (this.focusableElements.length === 0) return;
    
    this.focusedElement = this.focusableElements[this.focusIndex];
    
    // Create focus indicator
    if (!this.focusIndicator) {
      this.focusIndicator = this.scene.add.graphics();
      this.focusIndicator.setDepth(999);
    }
    
    // Draw focus outline
    const bounds = this.getFocusableBounds(this.focusedElement);
    if (bounds) {
      this.focusIndicator.clear();
      this.focusIndicator.lineStyle(3, 0xffff00, 1);
      this.focusIndicator.strokeRoundedRect(
        bounds.x - 5,
        bounds.y - 5,
        bounds.width + 10,
        bounds.height + 10,
        5
      );
      
      // Announce to screen reader
      this.announceToScreenReader(this.getFocusableLabel(this.focusedElement));
    }
  }
  
  /**
   * Remove focus indicator
   */
  private removeFocus(): void {
    if (this.focusIndicator) {
      this.focusIndicator.clear();
    }
    this.focusedElement = null;
  }
  
  /**
   * Get bounds of a focusable element
   */
  private getFocusableBounds(element: Phaser.GameObjects.GameObject): Phaser.Geom.Rectangle | null {
    if ('getBounds' in element && typeof element.getBounds === 'function') {
      return element.getBounds() as Phaser.Geom.Rectangle;
    }
    
    // For text objects
    if (element instanceof Phaser.GameObjects.Text) {
      return new Phaser.Geom.Rectangle(
        element.x - element.width * element.originX,
        element.y - element.height * element.originY,
        element.width,
        element.height
      );
    }
    
    // For images/sprites
    if ('x' in element && 'y' in element && 'width' in element && 'height' in element) {
      const obj = element as any;
      return new Phaser.Geom.Rectangle(
        obj.x - obj.width * (obj.originX || 0),
        obj.y - obj.height * (obj.originY || 0),
        obj.width,
        obj.height
      );
    }
    
    return null;
  }
  
  /**
   * Get label for a focusable element
   */
  private getFocusableLabel(element: Phaser.GameObjects.GameObject): string {
    // Check for custom accessibility label
    if ('accessibilityLabel' in element) {
      return (element as any).accessibilityLabel;
    }
    
    // For text objects, use their content
    if (element instanceof Phaser.GameObjects.Text) {
      return element.text;
    }
    
    // Default
    return 'Interactive element';
  }
  
  /**
   * Activate the currently focused element
   */
  private activateFocusedElement(): void {
    if (!this.focusedElement) return;
    
    // Play UI sound
    this.playUISound('click');
    
    // Trigger click event if available
    if ('emit' in this.focusedElement) {
      (this.focusedElement as any).emit('pointerdown');
      (this.focusedElement as any).emit('pointerup');
    }
  }
  
  /**
   * Play UI sound with accessibility volume
   */
  public playUISound(soundKey: string, baseVolume: number = 0.5): void {
    const volume = baseVolume * this.settings.uiSoundVolume;
    
    if (this.scene.sound.get(soundKey)) {
      this.scene.sound.play(soundKey, { volume });
    }
  }
  
  /**
   * Announce text to screen reader
   */
  private announceToScreenReader(text: string): void {
    if (!this.settings.screenReaderMode) return;
    
    // Create or update ARIA live region
    let liveRegion = document.getElementById('phaser-aria-live');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'phaser-aria-live';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }
    
    // Update content
    liveRegion.textContent = text;
  }
  
  /**
   * Check text contrast ratio (WCAG compliance)
   */
  public checkContrastRatio(foreground: number, background: number): boolean {
    // Convert hex colors to RGB
    const fg = Phaser.Display.Color.IntegerToColor(foreground);
    const bg = Phaser.Display.Color.IntegerToColor(background);
    
    // Calculate relative luminance
    const getLuminance = (color: Phaser.Display.Color) => {
      const sRGB = [color.red / 255, color.green / 255, color.blue / 255];
      const rgb = sRGB.map(val => {
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };
    
    const l1 = getLuminance(fg);
    const l2 = getLuminance(bg);
    
    // Calculate contrast ratio
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    
    // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
    return ratio >= 4.5;
  }
  
  /**
   * Clean up
   */
  public destroy(): void {
    this.clearFocusableElements();
    
    if (this.colorBlindFilter) {
      this.colorBlindFilter.destroy();
    }
    
    if (this.focusIndicator) {
      this.focusIndicator.destroy();
    }
    
    // Remove ARIA live region
    const liveRegion = document.getElementById('phaser-aria-live');
    if (liveRegion) {
      liveRegion.remove();
    }
  }
}