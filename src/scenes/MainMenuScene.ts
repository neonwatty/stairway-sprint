import Phaser from 'phaser';
import { ResponsiveUtils, FontSize, getResponsive } from '../utils/ResponsiveUtils';
import { AccessibilityManager } from '../managers/AccessibilityManager';
import { UISoundManager } from '../managers/UISoundManager';
import { AudioManager } from '../managers/AudioManager';
import { UIAnimationManager } from '../managers/UIAnimationManager';

export class MainMenuScene extends Phaser.Scene {
  private responsive!: ResponsiveUtils;
  private accessibilityManager!: AccessibilityManager;
  private uiSoundManager!: UISoundManager;
  private audioManager!: AudioManager;
  private uiAnimationManager!: UIAnimationManager;
  private playButton?: Phaser.GameObjects.Text;
  private settingsButton?: Phaser.GameObjects.Text;
  private playButtonFocusRing?: Phaser.GameObjects.Graphics;
  private settingsButtonFocusRing?: Phaser.GameObjects.Graphics;
  
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.responsive = getResponsive(this);
    
    // Initialize managers
    this.accessibilityManager = new AccessibilityManager(this);
    this.uiSoundManager = new UISoundManager(this);
    this.uiSoundManager.setAccessibilityManager(this.accessibilityManager);
    this.audioManager = new AudioManager(this);
    this.uiAnimationManager = new UIAnimationManager(this);
    
    // Start menu music (different from game music if we had it)
    this.audioManager.playBackgroundMusic('bgm-main', true);

    // Apply accessibility settings
    const settings = this.accessibilityManager.getSettings();
    if (settings.highContrast) {
      this.accessibilityManager.updateSetting('highContrast', true);
    }
    if (settings.colorBlindMode !== 'none') {
      this.accessibilityManager.updateSetting('colorBlindMode', settings.colorBlindMode);
    }

    // Fade in from black
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Background - use better contrast for accessibility
    const bgColor = settings.highContrast ? 0x000000 : 0x1a1a1a;
    this.add.rectangle(width / 2, height / 2, width, height, bgColor);

    // Add some decorative elements using loaded assets
    const playerSprite = this.add.image(width / 2, height / 2 - this.responsive.scale(200), 'player-down');
    playerSprite.setScale(this.responsive.getUIScale() * 1.5);

    // Title text with better contrast
    const titleColor = settings.highContrast ? '#ffff00' : '#ffffff';
    const titleStyle = this.responsive.getFontStyle(FontSize.TITLE, titleColor);
    const titleText = this.add.text(width / 2, height / 2 - this.responsive.scale(100), 'Stairway Sprint', {
      ...titleStyle,
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5);
    
    // Ensure title has good contrast
    if (!settings.highContrast) {
      const hasGoodContrast = this.accessibilityManager.checkContrastRatio(0xffffff, 0x1a1a1a);
      if (!hasGoodContrast) {
        titleText.setStroke('#000000', 2);
      }
    }

    // Play button with responsive sizing and accessibility
    const buttonConfig = this.responsive.getButtonConfig('PLAY', FontSize.LARGE);
    const buttonBgColor = settings.highContrast ? '#0066cc' : '#333333';
    const buttonHoverColor = settings.highContrast ? '#0088ff' : '#555555';
    
    this.playButton = this.uiSoundManager.createAccessibleButton(
      this,
      width / 2,
      height / 2,
      'PLAY',
      {
        ...this.responsive.getFontStyle(FontSize.LARGE, '#ffffff'),
        backgroundColor: buttonBgColor,
        padding: buttonConfig.padding,
      },
      () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene');
        });
      },
      'Play game'
    );
    
    // Set hit area for play button
    this.playButton.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -buttonConfig.minWidth / 2,
        -buttonConfig.minHeight / 2,
        buttonConfig.minWidth,
        buttonConfig.minHeight
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains
    });
    
    // Enhanced hover effects for play button
    this.playButton.on('pointerover', () => {
      this.playButton?.setStyle({ backgroundColor: buttonHoverColor });
      this.uiAnimationManager.animateButtonHover(this.playButton!, 1.05);
      if (this.accessibilityManager.getSettings().keyboardNavEnabled) {
        this.playButtonFocusRing = this.uiAnimationManager.createFocusRing(this.playButton!);
      }
    });
    this.playButton.on('pointerout', () => {
      this.playButton?.setStyle({ backgroundColor: buttonBgColor });
      this.playButton?.setScale(1);
      if (this.playButtonFocusRing) {
        this.playButtonFocusRing.destroy();
        this.playButtonFocusRing = undefined;
      }
    });
    this.playButton.on('pointerdown', () => {
      this.uiAnimationManager.animateButtonPress(this.playButton!);
      const bounds = this.playButton!.getBounds();
      this.uiAnimationManager.createRippleEffect(bounds.centerX, bounds.centerY, 0xffffff, 80);
    });
    
    // Register for keyboard navigation
    this.accessibilityManager.registerFocusableElement(this.playButton);

    // Settings button
    const settingsConfig = this.responsive.getButtonConfig('Settings', FontSize.NORMAL);
    this.settingsButton = this.uiSoundManager.createAccessibleButton(
      this,
      width / 2,
      height / 2 + this.responsive.scale(80),
      'Settings',
      {
        ...this.responsive.getFontStyle(FontSize.NORMAL, '#ffffff'),
        backgroundColor: buttonBgColor,
        padding: settingsConfig.padding,
      },
      () => {
        this.openSettingsMenu();
      },
      'Open settings menu'
    );
    
    // Set hit area for settings button
    this.settingsButton.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -settingsConfig.minWidth / 2,
        -settingsConfig.minHeight / 2,
        settingsConfig.minWidth,
        settingsConfig.minHeight
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains
    });
    
    // Enhanced hover effects for settings button
    this.settingsButton.on('pointerover', () => {
      this.settingsButton?.setStyle({ backgroundColor: buttonHoverColor });
      this.uiAnimationManager.animateButtonHover(this.settingsButton!, 1.05);
      if (this.accessibilityManager.getSettings().keyboardNavEnabled) {
        this.settingsButtonFocusRing = this.uiAnimationManager.createFocusRing(this.settingsButton!);
      }
    });
    this.settingsButton.on('pointerout', () => {
      this.settingsButton?.setStyle({ backgroundColor: buttonBgColor });
      this.settingsButton?.setScale(1);
      if (this.settingsButtonFocusRing) {
        this.settingsButtonFocusRing.destroy();
        this.settingsButtonFocusRing = undefined;
      }
    });
    this.settingsButton.on('pointerdown', () => {
      this.uiAnimationManager.animateButtonPress(this.settingsButton!);
      const bounds = this.settingsButton!.getBounds();
      this.uiAnimationManager.createRippleEffect(bounds.centerX, bounds.centerY, 0xffffff, 80);
    });
    
    // Register for keyboard navigation
    this.accessibilityManager.registerFocusableElement(this.settingsButton);

    // Instructions text with better contrast
    const instructionColor = settings.highContrast ? '#ffff00' : '#aaaaaa';
    const instructionStyle = this.responsive.getFontStyle(FontSize.SMALL, instructionColor);
    const instructionText = this.add.text(
      width / 2, 
      height - this.responsive.scale(50), 
      'Press PLAY to start • Tab to navigate • Enter to select', 
      instructionStyle
    ).setOrigin(0.5);

    // Add some animated elements
    this.tweens.add({
      targets: playerSprite,
      y: height / 2 - this.responsive.scale(190),
      duration: 2000,
      ease: 'Sine.easeInOut',
      repeat: -1,
      yoyo: true
    });

    // Animate buttons entrance
    const buttons = [this.playButton!, this.settingsButton!];
    this.uiAnimationManager.animateButtonStagger(buttons, 100);
    
    // Set up resize handler
    this.scale.on('resize', this.handleResize, this);
    
    // Focus the play button by default
    this.time.delayedCall(300, () => {
      if (this.playButton && this.accessibilityManager.getSettings().keyboardNavEnabled) {
        this.playButton.emit('pointerover');
      }
    });
  }

  private handleResize(): void {
    // In a real implementation, we would recreate or reposition elements
    // For now, we'll just update the responsive utilities
    this.responsive.update();
  }
  
  private openSettingsMenu(): void {
    // For now, we'll launch a simple settings overlay
    // In a full implementation, this would be a separate scene
    this.scene.launch('SettingsScene');
    this.scene.pause();
  }

  shutdown(): void {
    this.scale.off('resize', this.handleResize, this);
    this.accessibilityManager.destroy();
  }
}