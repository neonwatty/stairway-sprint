import Phaser from 'phaser';
import { DifficultyLevel, DifficultyConfig } from '../managers/DifficultyManager';

export class DifficultyDisplay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private difficultyText: Phaser.GameObjects.Text;
  private difficultyStars: Phaser.GameObjects.Image[] = [];
  private backgroundPanel: Phaser.GameObjects.Rectangle;
  private x: number;
  private y: number;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    
    this.createDisplay();
  }
  
  private createDisplay(): void {
    // Create container for all difficulty UI elements
    this.container = this.scene.add.container(this.x, this.y);
    
    // Background panel
    this.backgroundPanel = this.scene.add.rectangle(0, 0, 200, 60, 0x000000, 0.7);
    this.backgroundPanel.setStrokeStyle(2, 0xffffff, 0.5);
    this.container.add(this.backgroundPanel);
    
    // Difficulty label
    const label = this.scene.add.text(-90, -20, 'DIFFICULTY', {
      fontSize: '14px',
      color: '#888888',
      fontFamily: 'Arial'
    });
    this.container.add(label);
    
    // Difficulty name text
    this.difficultyText = this.scene.add.text(-90, -5, 'Leisurely Stroll', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.container.add(this.difficultyText);
    
    // Create star indicators
    for (let i = 0; i < 4; i++) {
      const star = this.scene.add.image(-90 + (i * 25), 20, 'star');
      star.setScale(0.4);
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
    
    // Flash effect on panel
    const flashOverlay = this.scene.add.rectangle(0, 0, 200, 60, 0xffffff, 0.8);
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
          this.scene.tweens.add({
            targets: star,
            scaleX: 0.6,
            scaleY: 0.6,
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
    const transitionText = this.scene.add.text(0, 50, message, {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });
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