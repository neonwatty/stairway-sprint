import Phaser from 'phaser';
import { DifficultyLevel, DifficultyConfig } from '../managers/DifficultyManager';
import { ResponsiveUtils, FontSize, getResponsive } from '../utils/ResponsiveUtils';

export class DifficultyDisplay {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private difficultyText!: Phaser.GameObjects.Text;
  private difficultyStars: Phaser.GameObjects.Image[] = [];
  private backgroundPanel!: Phaser.GameObjects.Rectangle;
  private x: number;
  private y: number;
  private responsive: ResponsiveUtils;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.responsive = getResponsive(scene);
    
    this.createDisplay();
  }
  
  private createDisplay(): void {
    // Create container for all difficulty UI elements
    this.container = this.scene.add.container(this.x, this.y);
    
    // Background panel with responsive sizing
    const panelWidth = this.responsive.scale(200);
    const panelHeight = this.responsive.scale(60);
    this.backgroundPanel = this.scene.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.7);
    this.backgroundPanel.setStrokeStyle(2, 0xffffff, 0.5);
    this.container.add(this.backgroundPanel);
    
    // Difficulty label
    const labelStyle = this.responsive.getFontStyle(FontSize.SMALL, '#888888');
    const labelX = -panelWidth / 2 + this.responsive.scale(10);
    const label = this.scene.add.text(labelX, -this.responsive.scale(20), 'DIFFICULTY', labelStyle);
    this.container.add(label);
    
    // Difficulty name text
    const textStyle = {
      ...this.responsive.getFontStyle(FontSize.NORMAL, '#ffffff'),
      fontStyle: 'bold'
    };
    this.difficultyText = this.scene.add.text(labelX, -this.responsive.scale(5), 'Leisurely Stroll', textStyle);
    this.container.add(this.difficultyText);
    
    // Create star indicators
    const starScale = this.responsive.getUIScale() * 0.4;
    const starSpacing = this.responsive.scale(25);
    for (let i = 0; i < 4; i++) {
      const star = this.scene.add.image(labelX + (i * starSpacing), this.responsive.scale(20), 'star');
      star.setScale(starScale);
      star.setTint(0x444444); // Inactive color
      this.difficultyStars.push(star);
      this.container.add(star);
    }
    
    // Set initial depth
    this.container.setDepth(1000);
  }
  
  public updateDifficulty(level: DifficultyLevel, config: DifficultyConfig): void {
    // Update difficulty text
    this.difficultyText.setText(config.displayName);
    
    // Animate text color based on difficulty
    const textColors = {
      [DifficultyLevel.EASY]: '#4CAF50',
      [DifficultyLevel.MEDIUM]: '#FFC107',
      [DifficultyLevel.HARD]: '#FF9800',
      [DifficultyLevel.NIGHTMARE]: '#F44336'
    };
    
    this.difficultyText.setColor(textColors[level]);
    
    // Update stars with animation
    this.updateStars(level);
    
    // Pulse animation for difficulty change
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    });
    
    // Flash effect on panel with responsive sizing
    const panelWidth = this.responsive.scale(200);
    const panelHeight = this.responsive.scale(60);
    const flashOverlay = this.scene.add.rectangle(0, 0, panelWidth, panelHeight, 0xffffff, 0.8);
    this.container.add(flashOverlay);
    
    this.scene.tweens.add({
      targets: flashOverlay,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        flashOverlay.destroy();
      }
    });
  }
  
  private updateStars(level: DifficultyLevel): void {
    const activeStars = level + 1; // 1-4 stars
    
    // Star colors for each difficulty
    const starColors = {
      [DifficultyLevel.EASY]: 0x4CAF50,
      [DifficultyLevel.MEDIUM]: 0xFFC107,
      [DifficultyLevel.HARD]: 0xFF9800,
      [DifficultyLevel.NIGHTMARE]: 0xF44336
    };
    
    this.difficultyStars.forEach((star, index) => {
      if (index < activeStars) {
        // Activate star with color and animation
        star.setTint(starColors[level]);
        
        // Stagger the star animations
        this.scene.time.delayedCall(index * 100, () => {
          const targetScale = this.responsive.getUIScale() * 0.6;
          this.scene.tweens.add({
            targets: star,
            scaleX: targetScale,
            scaleY: targetScale,
            duration: 300,
            yoyo: true,
            ease: 'Bounce.out'
          });
        });
      } else {
        // Deactivate star
        star.setTint(0x444444);
      }
    });
  }
  
  public showTransitionMessage(message: string, duration: number = 2000): void {
    const textStyle = {
      ...this.responsive.getFontStyle(FontSize.NORMAL, '#ffffff'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: this.responsive.scale(4)
    };
    const transitionText = this.scene.add.text(0, this.responsive.scale(50), message, textStyle);
    transitionText.setOrigin(0.5);
    this.container.add(transitionText);
    
    // Animate in
    transitionText.setAlpha(0);
    transitionText.setScale(0.5);
    
    this.scene.tweens.add({
      targets: transitionText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.out'
    });
    
    // Animate out after duration
    this.scene.time.delayedCall(duration, () => {
      this.scene.tweens.add({
        targets: transitionText,
        alpha: 0,
        y: transitionText.y - 20,
        duration: 500,
        onComplete: () => {
          transitionText.destroy();
        }
      });
    });
  }
  
  public setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }
  
  public destroy(): void {
    this.container.destroy();
  }
}