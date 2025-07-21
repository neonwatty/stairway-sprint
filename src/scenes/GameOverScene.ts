import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  private score: number = 0;
  private highScore: number = 0;
  
  constructor() {
    super({ key: 'GameOverScene' });
  }
  
  init(data: { score: number; highScore: number }): void {
    this.score = data.score || 0;
    this.highScore = data.highScore || 0;
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Black background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000);

    this.add.text(width / 2, height / 2 - 150, 'GAME OVER', {
      font: '48px Arial',
      color: '#ff0000',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 50, `Score: ${this.score}`, {
      font: '32px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    const isNewHighScore = this.score >= this.highScore;
    if (isNewHighScore) {
      this.add.text(width / 2, height / 2, 'NEW HIGH SCORE!', {
        font: '28px Arial',
        color: '#ffd700',
      }).setOrigin(0.5);
    } else {
      this.add.text(width / 2, height / 2, `High Score: ${this.highScore}`, {
        font: '24px Arial',
        color: '#aaaaaa',
      }).setOrigin(0.5);
    }

    const retryButton = this.add.text(width / 2, height / 2 + 50, 'Try Again', {
      font: '32px Arial',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => retryButton.setStyle({ backgroundColor: '#555555' }))
      .on('pointerout', () => retryButton.setStyle({ backgroundColor: '#333333' }))
      .on('pointerdown', () => this.scene.start('GameScene'));

    const menuButton = this.add.text(width / 2, height / 2 + 130, 'Main Menu', {
      font: '24px Arial',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => menuButton.setStyle({ backgroundColor: '#555555' }))
      .on('pointerout', () => menuButton.setStyle({ backgroundColor: '#333333' }))
      .on('pointerdown', () => this.scene.start('MainMenuScene'));
  }
}