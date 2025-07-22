import Phaser from 'phaser';
import { ResponsiveUtils, FontSize, getResponsive } from '../utils/ResponsiveUtils';
import { AccessibilityManager } from '../managers/AccessibilityManager';
import { UISoundManager } from '../managers/UISoundManager';

export class PauseScene extends Phaser.Scene {
  private responsive!: ResponsiveUtils;
  private accessibilityManager!: AccessibilityManager;
  private uiSoundManager!: UISoundManager;
  private resumeButton?: Phaser.GameObjects.Text;
  private settingsButton?: Phaser.GameObjects.Text;
  private quitButton?: Phaser.GameObjects.Text;
  
  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.responsive = getResponsive(this);
    
    // Initialize managers
    this.accessibilityManager = new AccessibilityManager(this);
    this.uiSoundManager = new UISoundManager(this);
    this.uiSoundManager.setAccessibilityManager(this.accessibilityManager);
    
    const settings = this.accessibilityManager.getSettings();

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    // Title with better contrast
    const titleColor = settings.highContrast ? '#ffff00' : '#ffffff';
    const titleStyle = this.responsive.getFontStyle(FontSize.TITLE, titleColor);
    const titleText = this.add.text(width / 2, height / 2 - this.responsive.scale(100), 'PAUSED', {
      ...titleStyle,
      stroke: '#000000',
      strokeThickness: settings.highContrast ? 3 : 2
    }).setOrigin(0.5);

    // Button colors based on accessibility settings
    const buttonBgColor = settings.highContrast ? '#0066cc' : '#333333';
    const buttonHoverColor = settings.highContrast ? '#0088ff' : '#555555';

    // Resume button with responsive sizing and accessibility
    const resumeConfig = this.responsive.getButtonConfig('Resume', FontSize.LARGE);
    this.resumeButton = this.uiSoundManager.createAccessibleButton(
      this,
      width / 2,
      height / 2,
      'Resume',
      {
        ...this.responsive.getFontStyle(FontSize.LARGE, '#ffffff'),
        backgroundColor: buttonBgColor,
        padding: resumeConfig.padding,
      },
      () => {
        const gameScene = this.scene.get('GameScene') as any;
        if (gameScene && gameScene.resume) {
          gameScene.resume();
        }
        this.scene.resume('GameScene');
        this.scene.stop();
      },
      'Resume game'
    );
    
    // Set hit area for resume button
    this.resumeButton.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -resumeConfig.minWidth / 2,
        -resumeConfig.minHeight / 2,
        resumeConfig.minWidth,
        resumeConfig.minHeight
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains
    });
    
    // Custom hover effects
    this.resumeButton.on('pointerover', () => {
      this.resumeButton?.setStyle({ backgroundColor: buttonHoverColor });
    });
    this.resumeButton.on('pointerout', () => {
      this.resumeButton?.setStyle({ backgroundColor: buttonBgColor });
    });
    
    // Register for keyboard navigation
    this.accessibilityManager.registerFocusableElement(this.resumeButton);

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
        this.scene.launch('SettingsScene');
        this.scene.pause();
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
    
    // Custom hover effects
    this.settingsButton.on('pointerover', () => {
      this.settingsButton?.setStyle({ backgroundColor: buttonHoverColor });
    });
    this.settingsButton.on('pointerout', () => {
      this.settingsButton?.setStyle({ backgroundColor: buttonBgColor });
    });
    
    // Register for keyboard navigation
    this.accessibilityManager.registerFocusableElement(this.settingsButton);

    // Quit button with responsive sizing and accessibility
    const quitConfig = this.responsive.getButtonConfig('Quit to Menu', FontSize.NORMAL);
    this.quitButton = this.uiSoundManager.createAccessibleButton(
      this,
      width / 2,
      height / 2 + this.responsive.scale(160),
      'Quit to Menu',
      {
        ...this.responsive.getFontStyle(FontSize.NORMAL, '#ffffff'),
        backgroundColor: buttonBgColor,
        padding: quitConfig.padding,
      },
      () => {
        this.scene.stop('GameScene');
        this.scene.stop();
        this.scene.start('MainMenuScene');
      },
      'Quit to main menu'
    );
    
    // Set hit area for quit button
    this.quitButton.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -quitConfig.minWidth / 2,
        -quitConfig.minHeight / 2,
        quitConfig.minWidth,
        quitConfig.minHeight
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains
    });
    
    // Custom hover effects
    this.quitButton.on('pointerover', () => {
      this.quitButton?.setStyle({ backgroundColor: buttonHoverColor });
    });
    this.quitButton.on('pointerout', () => {
      this.quitButton?.setStyle({ backgroundColor: buttonBgColor });
    });
    
    // Register for keyboard navigation
    this.accessibilityManager.registerFocusableElement(this.quitButton);
    
    // Instructions text
    const instructionColor = settings.highContrast ? '#ffff00' : '#aaaaaa';
    const instructionStyle = this.responsive.getFontStyle(FontSize.SMALL, instructionColor);
    this.add.text(
      width / 2,
      height - this.responsive.scale(50),
      'Tab to navigate • Enter to select • ESC to resume',
      instructionStyle
    ).setOrigin(0.5);
    
    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-ESC', () => {
      this.resumeButton?.emit('pointerup');
    });
    
    this.input.keyboard?.on('keydown-R', () => {
      this.resumeButton?.emit('pointerup');
    });
      
    // Set up resize handler
    this.scale.on('resize', this.handleResize, this);
    
    // Focus the resume button by default
    this.time.delayedCall(100, () => {
      if (this.resumeButton && this.accessibilityManager.getSettings().keyboardNavEnabled) {
        this.resumeButton.emit('pointerover');
      }
    });
  }
  
  private handleResize(): void {
    // Update responsive utilities
    this.responsive.update();
    // In a full implementation, we would reposition/resize elements
  }
  
  shutdown(): void {
    this.scale.off('resize', this.handleResize, this);
    this.accessibilityManager.destroy();
  }
}