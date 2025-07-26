import Phaser from 'phaser';
import { ResponsiveUtils, FontSize, getResponsive } from '../utils/ResponsiveUtils';
import { AccessibilityManager, ColorBlindMode } from '../managers/AccessibilityManager';
import { UISoundManager } from '../managers/UISoundManager';
import { AudioManager } from '../managers/AudioManager';

export class SettingsScene extends Phaser.Scene {
  private responsive!: ResponsiveUtils;
  private accessibilityManager!: AccessibilityManager;
  private uiSoundManager!: UISoundManager;
  private audioManager!: AudioManager;
  private container?: Phaser.GameObjects.Container;
  private focusableElements: Phaser.GameObjects.GameObject[] = [];
  
  constructor() {
    super({ key: 'SettingsScene' });
  }
  
  create(): void {
    const { width, height } = this.cameras.main;
    this.responsive = getResponsive(this);
    
    // Initialize managers
    this.accessibilityManager = new AccessibilityManager(this);
    this.uiSoundManager = new UISoundManager(this);
    this.uiSoundManager.setAccessibilityManager(this.accessibilityManager);
    this.audioManager = new AudioManager(this);
    
    const settings = this.accessibilityManager.getSettings();
    
    // Semi-transparent overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);
    
    // Main container
    this.container = this.add.container(width / 2, height / 2);
    
    // Title
    const titleStyle = this.responsive.getFontStyle(FontSize.TITLE, '#ffffff');
    const title = this.add.text(0, -this.responsive.scale(200), 'Settings', titleStyle)
      .setOrigin(0.5);
    this.container.add(title);
    
    // Settings options
    let yPos = -this.responsive.scale(100);
    const spacing = this.responsive.scale(60);
    
    // Color Blind Mode
    this.createColorBlindOption(yPos);
    yPos += spacing;
    
    // High Contrast Mode
    this.createHighContrastOption(yPos);
    yPos += spacing;
    
    // Audio Controls - Master Volume
    this.createMasterVolumeOption(yPos);
    yPos += spacing;
    
    // Music Volume
    this.createMusicVolumeOption(yPos);
    yPos += spacing;
    
    // Sound Effects Volume
    this.createSFXVolumeOption(yPos);
    yPos += spacing;
    
    // Keyboard Navigation
    this.createKeyboardNavOption(yPos);
    yPos += spacing;
    
    // Screen Reader Mode
    this.createScreenReaderOption(yPos);
    yPos += spacing * 2;
    
    // Close button
    const closeButton = this.uiSoundManager.createAccessibleButton(
      this,
      0,
      yPos,
      'Close',
      {
        ...this.responsive.getFontStyle(FontSize.NORMAL, '#ffffff'),
        backgroundColor: '#cc0000',
        padding: { x: 20, y: 10 }
      },
      () => {
        this.closeSettings();
      },
      'Close settings menu'
    );
    this.container.add(closeButton);
    this.accessibilityManager.registerFocusableElement(closeButton);
    
    // ESC to close
    this.input.keyboard?.on('keydown-ESC', () => {
      this.closeSettings();
    });
    
    // Set up resize handler
    this.scale.on('resize', this.handleResize, this);
  }
  
  private createColorBlindOption(y: number): void {
    const labelStyle = this.responsive.getFontStyle(FontSize.NORMAL, '#ffffff');
    const label = this.add.text(-this.responsive.scale(200), y, 'Color Blind Mode:', labelStyle)
      .setOrigin(0, 0.5);
    this.container!.add(label);
    
    const settings = this.accessibilityManager.getSettings();
    const modes = [
      { value: ColorBlindMode.NONE, label: 'None' },
      { value: ColorBlindMode.PROTANOPIA, label: 'Protanopia' },
      { value: ColorBlindMode.DEUTERANOPIA, label: 'Deuteranopia' },
      { value: ColorBlindMode.TRITANOPIA, label: 'Tritanopia' }
    ];
    
    let xPos = this.responsive.scale(50);
    modes.forEach(mode => {
      const isActive = settings.colorBlindMode === mode.value;
      const button = this.createToggleButton(
        xPos,
        y,
        mode.label,
        isActive,
        () => {
          this.accessibilityManager.updateSetting('colorBlindMode', mode.value);
          this.updateColorBlindButtons();
        }
      );
      this.container!.add(button);
      xPos += this.responsive.scale(120);
    });
  }
  
  private createHighContrastOption(y: number): void {
    const labelStyle = this.responsive.getFontStyle(FontSize.NORMAL, '#ffffff');
    const label = this.add.text(-this.responsive.scale(200), y, 'High Contrast:', labelStyle)
      .setOrigin(0, 0.5);
    this.container!.add(label);
    
    const settings = this.accessibilityManager.getSettings();
    const toggle = this.createToggleButton(
      this.responsive.scale(50),
      y,
      settings.highContrast ? 'ON' : 'OFF',
      settings.highContrast,
      () => {
        const newValue = !this.accessibilityManager.getSettings().highContrast;
        this.accessibilityManager.updateSetting('highContrast', newValue);
        toggle.buttonText.setText(newValue ? 'ON' : 'OFF');
        this.updateToggleButtonStyle(toggle, newValue);
      }
    );
    this.container!.add(toggle);
  }
  
  private createMasterVolumeOption(y: number): void {
    const labelStyle = this.responsive.getFontStyle(FontSize.NORMAL, '#ffffff');
    const label = this.add.text(-this.responsive.scale(200), y, 'Master Volume:', labelStyle)
      .setOrigin(0, 0.5);
    this.container!.add(label);
    
    const settings = this.audioManager.getSettings();
    const volumeText = this.add.text(
      this.responsive.scale(50),
      y,
      `${Math.round(settings.masterVolume * 100)}%`,
      labelStyle
    ).setOrigin(0, 0.5);
    this.container!.add(volumeText);
    
    // Volume buttons
    const decreaseButton = this.createSmallButton(
      this.responsive.scale(150),
      y,
      '-',
      () => {
        const currentVolume = this.audioManager.getSettings().masterVolume;
        const newVolume = Math.max(0, currentVolume - 0.1);
        this.audioManager.setMasterVolume(newVolume);
        volumeText.setText(`${Math.round(newVolume * 100)}%`);
        this.uiSoundManager.playClick();
      }
    );
    this.container!.add(decreaseButton);
    
    const increaseButton = this.createSmallButton(
      this.responsive.scale(200),
      y,
      '+',
      () => {
        const currentVolume = this.audioManager.getSettings().masterVolume;
        const newVolume = Math.min(1, currentVolume + 0.1);
        this.audioManager.setMasterVolume(newVolume);
        volumeText.setText(`${Math.round(newVolume * 100)}%`);
        this.uiSoundManager.playClick();
      }
    );
    this.container!.add(increaseButton);
  }
  
  private createMusicVolumeOption(y: number): void {
    const labelStyle = this.responsive.getFontStyle(FontSize.NORMAL, '#ffffff');
    const label = this.add.text(-this.responsive.scale(200), y, 'Music Volume:', labelStyle)
      .setOrigin(0, 0.5);
    this.container!.add(label);
    
    const settings = this.audioManager.getSettings();
    const volumeText = this.add.text(
      this.responsive.scale(50),
      y,
      `${Math.round(settings.musicVolume * 100)}%`,
      labelStyle
    ).setOrigin(0, 0.5);
    this.container!.add(volumeText);
    
    // Volume buttons
    const decreaseButton = this.createSmallButton(
      this.responsive.scale(150),
      y,
      '-',
      () => {
        const currentVolume = this.audioManager.getSettings().musicVolume;
        const newVolume = Math.max(0, currentVolume - 0.1);
        this.audioManager.setMusicVolume(newVolume);
        volumeText.setText(`${Math.round(newVolume * 100)}%`);
        this.uiSoundManager.playClick();
      }
    );
    this.container!.add(decreaseButton);
    
    const increaseButton = this.createSmallButton(
      this.responsive.scale(200),
      y,
      '+',
      () => {
        const currentVolume = this.audioManager.getSettings().musicVolume;
        const newVolume = Math.min(1, currentVolume + 0.1);
        this.audioManager.setMusicVolume(newVolume);
        volumeText.setText(`${Math.round(newVolume * 100)}%`);
        this.uiSoundManager.playClick();
      }
    );
    this.container!.add(increaseButton);
    
    // Mute toggle
    const muteButton = this.createToggleButton(
      this.responsive.scale(280),
      y,
      settings.musicMuted ? 'MUTED' : 'ON',
      !settings.musicMuted,
      () => {
        this.audioManager.toggleMusicMute();
        const isMuted = this.audioManager.getSettings().musicMuted;
        muteButton.buttonText.setText(isMuted ? 'MUTED' : 'ON');
        this.updateToggleButtonStyle(muteButton, !isMuted);
      }
    );
    this.container!.add(muteButton);
  }
  
  private createSFXVolumeOption(y: number): void {
    const labelStyle = this.responsive.getFontStyle(FontSize.NORMAL, '#ffffff');
    const label = this.add.text(-this.responsive.scale(200), y, 'Sound Effects:', labelStyle)
      .setOrigin(0, 0.5);
    this.container!.add(label);
    
    const settings = this.audioManager.getSettings();
    const volumeText = this.add.text(
      this.responsive.scale(50),
      y,
      `${Math.round(settings.sfxVolume * 100)}%`,
      labelStyle
    ).setOrigin(0, 0.5);
    this.container!.add(volumeText);
    
    // Volume buttons
    const decreaseButton = this.createSmallButton(
      this.responsive.scale(150),
      y,
      '-',
      () => {
        const currentVolume = this.audioManager.getSettings().sfxVolume;
        const newVolume = Math.max(0, currentVolume - 0.1);
        this.audioManager.setSFXVolume(newVolume);
        volumeText.setText(`${Math.round(newVolume * 100)}%`);
        this.uiSoundManager.playClick();
      }
    );
    this.container!.add(decreaseButton);
    
    const increaseButton = this.createSmallButton(
      this.responsive.scale(200),
      y,
      '+',
      () => {
        const currentVolume = this.audioManager.getSettings().sfxVolume;
        const newVolume = Math.min(1, currentVolume + 0.1);
        this.audioManager.setSFXVolume(newVolume);
        volumeText.setText(`${Math.round(newVolume * 100)}%`);
        this.uiSoundManager.playClick();
      }
    );
    this.container!.add(increaseButton);
    
    // Mute toggle
    const muteButton = this.createToggleButton(
      this.responsive.scale(280),
      y,
      settings.sfxMuted ? 'MUTED' : 'ON',
      !settings.sfxMuted,
      () => {
        this.audioManager.toggleSFXMute();
        const isMuted = this.audioManager.getSettings().sfxMuted;
        muteButton.buttonText.setText(isMuted ? 'MUTED' : 'ON');
        this.updateToggleButtonStyle(muteButton, !isMuted);
      }
    );
    this.container!.add(muteButton);
  }
  
  private createKeyboardNavOption(y: number): void {
    const labelStyle = this.responsive.getFontStyle(FontSize.NORMAL, '#ffffff');
    const label = this.add.text(-this.responsive.scale(200), y, 'Keyboard Navigation:', labelStyle)
      .setOrigin(0, 0.5);
    this.container!.add(label);
    
    const settings = this.accessibilityManager.getSettings();
    const toggle = this.createToggleButton(
      this.responsive.scale(50),
      y,
      settings.keyboardNavEnabled ? 'ON' : 'OFF',
      settings.keyboardNavEnabled,
      () => {
        const newValue = !this.accessibilityManager.getSettings().keyboardNavEnabled;
        this.accessibilityManager.updateSetting('keyboardNavEnabled', newValue);
        toggle.buttonText.setText(newValue ? 'ON' : 'OFF');
        this.updateToggleButtonStyle(toggle, newValue);
      }
    );
    this.container!.add(toggle);
  }
  
  private createScreenReaderOption(y: number): void {
    const labelStyle = this.responsive.getFontStyle(FontSize.NORMAL, '#ffffff');
    const label = this.add.text(-this.responsive.scale(200), y, 'Screen Reader:', labelStyle)
      .setOrigin(0, 0.5);
    this.container!.add(label);
    
    const settings = this.accessibilityManager.getSettings();
    const toggle = this.createToggleButton(
      this.responsive.scale(50),
      y,
      settings.screenReaderMode ? 'ON' : 'OFF',
      settings.screenReaderMode,
      () => {
        const newValue = !this.accessibilityManager.getSettings().screenReaderMode;
        this.accessibilityManager.updateSetting('screenReaderMode', newValue);
        toggle.buttonText.setText(newValue ? 'ON' : 'OFF');
        this.updateToggleButtonStyle(toggle, newValue);
      }
    );
    this.container!.add(toggle);
  }
  
  private createToggleButton(
    x: number,
    y: number,
    text: string,
    isActive: boolean,
    callback: () => void
  ): any {
    const bgColor = isActive ? '#0066cc' : '#333333';
    const button = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, this.responsive.scale(80), this.responsive.scale(30), 
      Phaser.Display.Color.HexStringToColor(bgColor).color);
    button.add(bg);
    
    const buttonText = this.add.text(0, 0, text, {
      ...this.responsive.getFontStyle(FontSize.SMALL, '#ffffff')
    }).setOrigin(0.5);
    button.add(buttonText);
    
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      this.uiSoundManager.playToggle();
      callback();
    });
    
    bg.on('pointerover', () => {
      bg.setScale(1.1);
      this.uiSoundManager.playHover();
    });
    
    bg.on('pointerout', () => {
      bg.setScale(1);
    });
    
    // Store references for updates
    (button as any).bg = bg;
    (button as any).buttonText = buttonText;
    
    this.accessibilityManager.registerFocusableElement(bg);
    
    return button;
  }
  
  private createSmallButton(
    x: number,
    y: number,
    text: string,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const button = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, this.responsive.scale(30), this.responsive.scale(30), 0x555555);
    button.add(bg);
    
    const buttonText = this.add.text(0, 0, text, {
      ...this.responsive.getFontStyle(FontSize.NORMAL, '#ffffff')
    }).setOrigin(0.5);
    button.add(buttonText);
    
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', callback);
    
    bg.on('pointerover', () => {
      bg.setFillStyle(0x777777);
      this.uiSoundManager.playHover();
    });
    
    bg.on('pointerout', () => {
      bg.setFillStyle(0x555555);
    });
    
    this.accessibilityManager.registerFocusableElement(bg);
    
    return button;
  }
  
  private updateToggleButtonStyle(button: any, isActive: boolean): void {
    const color = isActive ? 0x0066cc : 0x333333;
    button.bg.setFillStyle(color);
  }
  
  private updateColorBlindButtons(): void {
    // This would update all color blind mode buttons
    // For now, we'll recreate the scene
    this.scene.restart();
  }
  
  private closeSettings(): void {
    const previousScene = this.scene.get('MainMenuScene');
    if (previousScene) {
      this.scene.resume('MainMenuScene');
    }
    this.scene.stop();
  }
  
  private handleResize(): void {
    this.responsive.update();
    // In a full implementation, we would reposition elements
  }
  
  shutdown(): void {
    this.scale.off('resize', this.handleResize, this);
    this.accessibilityManager.destroy();
  }
}