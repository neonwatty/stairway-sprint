import Phaser from 'phaser';
import { ResponsiveUtils, FontSize, getResponsive } from '../utils/ResponsiveUtils';
import { AccessibilityManager } from '../managers/AccessibilityManager';
import { UISoundManager } from '../managers/UISoundManager';

interface GameOverData {
  score: number;
  highScore: number;
}

interface UIButton extends Phaser.GameObjects.Container {
  buttonBg: Phaser.GameObjects.Rectangle;
  buttonText: Phaser.GameObjects.Text;
}

export class GameOverScene extends Phaser.Scene {
  private score: number = 0;
  private highScore: number = 0;
  private previousHighScore: number = 0;
  private isNewHighScore: boolean = false;
  private responsive!: ResponsiveUtils;
  private accessibilityManager!: AccessibilityManager;
  private uiSoundManager!: UISoundManager;
  
  // UI Elements
  private overlay?: Phaser.GameObjects.Rectangle;
  private container?: Phaser.GameObjects.Container;
  private scoreText?: Phaser.GameObjects.Text;
  private highScoreText?: Phaser.GameObjects.Text;
  private newHighScoreBadge?: Phaser.GameObjects.Container;
  private playAgainButton?: UIButton;
  private mainMenuButton?: UIButton;
  private shareButton?: UIButton;
  
  constructor() {
    super({ key: 'GameOverScene' });
  }
  
  init(data: GameOverData): void {
    this.score = data.score || 0;
    this.highScore = data.highScore || 0;
    
    // Load previous high score from localStorage to check if this is new
    const savedHighScore = localStorage.getItem('stairwaySprintHighScore');
    this.previousHighScore = savedHighScore ? parseInt(savedHighScore, 10) : 0;
    this.isNewHighScore = this.score > this.previousHighScore && this.score === this.highScore;
    
    // Update high score in localStorage if new
    if (this.isNewHighScore) {
      localStorage.setItem('stairwaySprintHighScore', this.highScore.toString());
    }
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.responsive = getResponsive(this);
    
    // Initialize managers
    this.accessibilityManager = new AccessibilityManager(this);
    this.uiSoundManager = new UISoundManager(this);
    this.uiSoundManager.setAccessibilityManager(this.accessibilityManager);
    
    const settings = this.accessibilityManager.getSettings();

    // Semi-transparent overlay
    const overlayAlpha = settings.highContrast ? 0.95 : 0.8;
    this.overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, overlayAlpha);
    this.overlay.setAlpha(0);

    // Main container for all UI elements
    this.container = this.add.container(width / 2, height / 2);
    this.container.setAlpha(0);
    this.container.setScale(0.9);

    // Game Over Title with better contrast
    const titleColor = settings.highContrast ? '#ff6666' : '#ff0000';
    const titleStyle = this.responsive.getFontStyle(FontSize.TITLE, titleColor);
    const gameOverText = this.add.text(0, -this.responsive.scale(240), 'GAME OVER', {
      ...titleStyle,
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true },
      stroke: settings.highContrast ? '#000000' : undefined,
      strokeThickness: settings.highContrast ? 3 : 0
    }).setOrigin(0.5);
    this.container.add(gameOverText);

    // Score Display (Large font as requested)
    const scoreStyle = this.responsive.getFontStyle(FontSize.HEADING, '#ffffff');
    this.scoreText = this.add.text(0, -this.responsive.scale(120), `${this.score}`, {
      ...scoreStyle,
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5);
    this.container.add(this.scoreText);

    // Score label
    const labelStyle = this.responsive.getFontStyle(FontSize.NORMAL, '#cccccc');
    const scoreLabelText = this.add.text(0, -this.responsive.scale(75), 'SCORE', labelStyle).setOrigin(0.5);
    this.container.add(scoreLabelText);

    // High Score Display
    if (this.isNewHighScore) {
      // New high score celebration
      this.newHighScoreBadge = this.createNewHighScoreBadge();
      this.newHighScoreBadge.setPosition(0, -this.responsive.scale(20));
      this.container.add(this.newHighScoreBadge);
      
      // Animate the badge
      this.animateNewHighScore();
    } else {
      // Show previous high score
      const highScoreStyle = this.responsive.getFontStyle(FontSize.NORMAL, '#aaaaaa');
      this.highScoreText = this.add.text(0, -this.responsive.scale(20), `High Score: ${this.highScore}`, {
        ...highScoreStyle,
        shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
      }).setOrigin(0.5);
      this.container.add(this.highScoreText);
    }

    // Buttons with responsive spacing
    const buttonSpacing = this.responsive.getSpacing(4);
    this.playAgainButton = this.createButton(0, buttonSpacing, 'PLAY AGAIN', () => {
      this.fadeOutAndStart('GameScene');
    });
    this.container.add(this.playAgainButton);

    this.mainMenuButton = this.createButton(0, buttonSpacing * 2, 'MAIN MENU', () => {
      this.fadeOutAndStart('MainMenuScene');
    });
    this.container.add(this.mainMenuButton);

    this.shareButton = this.createButton(0, buttonSpacing * 3, 'SHARE SCORE', () => {
      this.shareScore();
    });
    this.container.add(this.shareButton);

    // Entrance animations
    this.animateEntrance();

    // Add keyboard controls
    this.setupKeyboardControls();
    
    // Set up resize handler
    this.scale.on('resize', this.handleResize, this);
  }
  
  private handleResize(): void {
    // Update responsive utilities
    this.responsive.update();
    // In a full implementation, we would reposition/resize elements
  }

  private createButton(x: number, y: number, text: string, callback: () => void): UIButton {
    const container = this.add.container(x, y) as UIButton;
    const buttonConfig = this.responsive.getButtonConfig(text, FontSize.NORMAL);
    const settings = this.accessibilityManager.getSettings();
    
    // Button colors based on accessibility settings
    const bgColor = settings.highContrast ? 0x0066cc : 0x333333;
    const hoverColor = settings.highContrast ? 0x0088ff : 0x555555;
    const strokeColor = settings.highContrast ? 0xffffff : 0x555555;
    
    // Button background with responsive sizing
    const buttonBg = this.add.rectangle(0, 0, buttonConfig.minWidth, buttonConfig.minHeight, bgColor);
    buttonBg.setStrokeStyle(2, strokeColor);
    container.buttonBg = buttonBg;
    container.add(buttonBg);
    
    // Button text with responsive font
    const buttonStyle = this.responsive.getFontStyle(FontSize.NORMAL, '#ffffff');
    const buttonText = this.add.text(0, 0, text, buttonStyle).setOrigin(0.5);
    container.buttonText = buttonText;
    container.add(buttonText);
    
    // Add accessibility label
    (container as any).accessibilityLabel = text;
    
    // Make interactive
    buttonBg.setInteractive({ useHandCursor: true });
    
    // Register for keyboard navigation
    this.accessibilityManager.registerFocusableElement(buttonBg);
    
    // Hover effects with sound
    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(hoverColor);
      buttonText.setScale(1.05);
      this.uiSoundManager.playHover();
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: 'Power2'
      });
    });
    
    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(bgColor);
      buttonText.setScale(1);
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Power2'
      });
    });
    
    buttonBg.on('pointerdown', () => {
      this.uiSoundManager.playClick();
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        ease: 'Power2',
        yoyo: true,
        onComplete: callback
      });
    });
    
    return container;
  }

  private createNewHighScoreBadge(): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);
    const scale = this.responsive.scale(1);
    
    // Badge background
    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(0xffd700, 1);
    badgeBg.fillRoundedRect(-120 * scale, -25 * scale, 240 * scale, 50 * scale, 10 * scale);
    container.add(badgeBg);
    
    // Badge text
    const badgeStyle = this.responsive.getFontStyle(FontSize.NORMAL, '#000000');
    const badgeText = this.add.text(0, 0, 'NEW HIGH SCORE!', {
      ...badgeStyle,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(badgeText);
    
    // Stars for decoration
    const starSize = this.responsive.scale(15);
    const star1 = this.add.star(-100 * scale, 0, 5, starSize * 0.5, starSize, 0xffffff);
    const star2 = this.add.star(100 * scale, 0, 5, starSize * 0.5, starSize, 0xffffff);
    container.add([star1, star2]);
    
    return container;
  }

  private animateEntrance(): void {
    // Fade in overlay
    this.tweens.add({
      targets: this.overlay,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });
    
    // Scale and fade in container
    this.tweens.add({
      targets: this.container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      delay: 200,
      ease: 'Back.easeOut'
    });
  }

  private animateNewHighScore(): void {
    if (!this.newHighScoreBadge) return;
    
    // Play success sound for new high score
    this.uiSoundManager.playSuccess();
    
    // Pulse animation
    this.tweens.add({
      targets: this.newHighScoreBadge,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    // Rotate stars
    const stars = this.newHighScoreBadge.list.filter(
      (child: any) => child.type === 'Star'
    );
    
    stars.forEach((star: any, index: number) => {
      this.tweens.add({
        targets: star,
        rotation: Math.PI * 2,
        duration: 2000,
        ease: 'Linear',
        repeat: -1,
        delay: index * 500
      });
    });
    
    // Particle effect for celebration
    if (this.newHighScoreBadge) {
      const emitter = this.add.particles(0, -20, 'star', {
        speed: { min: 100, max: 200 },
        scale: { start: 0.5, end: 0 },
        lifespan: 1000,
        quantity: 2,
        frequency: 500,
        tint: 0xffd700,
        emitting: true
      });
      
      // Stop emitting after 3 seconds
      this.time.delayedCall(3000, () => {
        emitter.stop();
        this.time.delayedCall(1000, () => emitter.destroy());
      });
    }
  }

  private fadeOutAndStart(sceneKey: string): void {
    // Fade out all elements
    this.tweens.add({
      targets: [this.overlay, this.container],
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.scene.start(sceneKey);
      }
    });
  }

  private shareScore(): void {
    // For now, log to console as requested
    console.log(`=== SHARE SCORE ===`);
    console.log(`Score: ${this.score}`);
    console.log(`High Score: ${this.highScore}`);
    console.log(`New High Score: ${this.isNewHighScore ? 'Yes!' : 'No'}`);
    console.log(`==================`);
    
    // Visual feedback
    if (this.shareButton) {
      const originalText = this.shareButton.buttonText.text;
      this.shareButton.buttonText.setText('SHARED!');
      this.shareButton.buttonText.setColor('#00ff00');
      
      this.time.delayedCall(1500, () => {
        if (this.shareButton) {
          this.shareButton.buttonText.setText(originalText);
          this.shareButton.buttonText.setColor('#ffffff');
        }
      });
    }
    
    // In a real implementation, this could:
    // - Copy score to clipboard
    // - Open social media share dialog
    // - Generate a share link
    // - Take a screenshot and share
  }
  
  shutdown(): void {
    this.scale.off('resize', this.handleResize, this);
    this.accessibilityManager.destroy();
  }

  private setupKeyboardControls(): void {
    // Instructions text
    const instructionColor = this.accessibilityManager.getSettings().highContrast ? '#ffff00' : '#aaaaaa';
    const instructionStyle = this.responsive.getFontStyle(FontSize.SMALL, instructionColor);
    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - this.responsive.scale(30),
      'Tab to navigate • Enter to select • Space to play again',
      instructionStyle
    ).setOrigin(0.5);
    
    // Play Again - Enter or Space
    this.input.keyboard?.on('keydown-ENTER', () => {
      if (this.playAgainButton && this.focusedElement === this.playAgainButton.buttonBg) {
        this.fadeOutAndStart('GameScene');
      }
    });
    
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.playAgainButton) {
        this.fadeOutAndStart('GameScene');
      }
    });
    
    // Main Menu - ESC
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.mainMenuButton) {
        this.fadeOutAndStart('MainMenuScene');
      }
    });
    
    // Focus the play again button by default
    this.time.delayedCall(600, () => {
      if (this.playAgainButton && this.accessibilityManager.getSettings().keyboardNavEnabled) {
        this.playAgainButton.buttonBg.emit('pointerover');
      }
    });
  }

  private playButtonSound(): void {
    // This is now handled by UISoundManager
    this.uiSoundManager.playClick();
  }
  
  private get focusedElement(): Phaser.GameObjects.GameObject | null {
    // Get the currently focused element from accessibility manager
    // This is a simplified version - in a real implementation we'd track this properly
    return null;
  }
}