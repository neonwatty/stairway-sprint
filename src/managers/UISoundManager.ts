import Phaser from 'phaser';
import { AccessibilityManager } from './AccessibilityManager';

export enum UISound {
  BUTTON_HOVER = 'ui-hover',
  BUTTON_CLICK = 'ui-click',
  MENU_OPEN = 'ui-menu-open',
  MENU_CLOSE = 'ui-menu-close',
  SUCCESS = 'ui-success',
  ERROR = 'ui-error',
  FOCUS_CHANGE = 'ui-focus',
  TOGGLE = 'ui-toggle'
}

export class UISoundManager {
  private scene: Phaser.Scene;
  private accessibilityManager?: AccessibilityManager;
  private loadedSounds: Set<string> = new Set();
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  /**
   * Set the accessibility manager for volume control
   */
  public setAccessibilityManager(manager: AccessibilityManager): void {
    this.accessibilityManager = manager;
  }
  
  /**
   * Preload UI sounds
   */
  public preloadSounds(): void {
    // In a real implementation, these would be actual audio files
    // For now, we'll create placeholder sounds
    const sounds = Object.values(UISound);
    
    sounds.forEach(soundKey => {
      // Mark as loaded for now
      this.loadedSounds.add(soundKey);
    });
  }
  
  /**
   * Play a UI sound
   */
  public play(sound: UISound, baseVolume: number = 0.5): void {
    if (this.accessibilityManager) {
      this.accessibilityManager.playUISound(sound, baseVolume);
    } else {
      // Fallback to regular sound playing
      if (this.scene.sound.get(sound)) {
        this.scene.sound.play(sound, { volume: baseVolume });
      }
    }
  }
  
  /**
   * Play hover sound
   */
  public playHover(): void {
    this.play(UISound.BUTTON_HOVER, 0.3);
  }
  
  /**
   * Play click sound
   */
  public playClick(): void {
    this.play(UISound.BUTTON_CLICK, 0.5);
  }
  
  /**
   * Play success sound
   */
  public playSuccess(): void {
    this.play(UISound.SUCCESS, 0.6);
  }
  
  /**
   * Play error sound
   */
  public playError(): void {
    this.play(UISound.ERROR, 0.5);
  }
  
  /**
   * Play focus change sound
   */
  public playFocusChange(): void {
    this.play(UISound.FOCUS_CHANGE, 0.2);
  }
  
  /**
   * Play toggle sound
   */
  public playToggle(): void {
    this.play(UISound.TOGGLE, 0.4);
  }
  
  /**
   * Add sound effects to a button
   */
  public addButtonSounds(
    button: Phaser.GameObjects.GameObject,
    options: {
      hover?: boolean;
      click?: boolean;
      hoverVolume?: number;
      clickVolume?: number;
    } = { hover: true, click: true }
  ): void {
    if (!button.input) {
      console.warn('Button must be interactive to add sounds');
      return;
    }
    
    if (options.hover) {
      button.on('pointerover', () => {
        this.play(UISound.BUTTON_HOVER, options.hoverVolume || 0.3);
      });
    }
    
    if (options.click) {
      button.on('pointerdown', () => {
        this.play(UISound.BUTTON_CLICK, options.clickVolume || 0.5);
      });
    }
  }
  
  /**
   * Create a button with built-in sounds and accessibility
   */
  public createAccessibleButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    style: Phaser.Types.GameObjects.Text.TextStyle,
    callback: () => void,
    accessibilityLabel?: string
  ): Phaser.GameObjects.Text {
    const button = scene.add.text(x, y, text, style)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    
    // Add accessibility label
    (button as any).accessibilityLabel = accessibilityLabel || text;
    
    // Add sounds
    this.addButtonSounds(button);
    
    // Add click handler
    button.on('pointerup', callback);
    
    // Visual feedback
    button.on('pointerover', () => {
      button.setScale(1.05);
    });
    
    button.on('pointerout', () => {
      button.setScale(1);
    });
    
    button.on('pointerdown', () => {
      button.setScale(0.95);
    });
    
    return button;
  }
}