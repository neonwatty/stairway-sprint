import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    this.add.text(width / 2, height / 2 - 100, 'PAUSED', {
      font: '48px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    const resumeButton = this.add.text(width / 2, height / 2, 'Resume', {
      font: '32px Arial',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => resumeButton.setStyle({ backgroundColor: '#555555' }))
      .on('pointerout', () => resumeButton.setStyle({ backgroundColor: '#333333' }))
      .on('pointerdown', () => {
        const gameScene = this.scene.get('GameScene') as any;
        if (gameScene && gameScene.resume) {
          gameScene.resume();
        }
        this.scene.resume('GameScene');
        this.scene.stop();
      });

    const quitButton = this.add.text(width / 2, height / 2 + 80, 'Quit to Menu', {
      font: '24px Arial',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => quitButton.setStyle({ backgroundColor: '#555555' }))
      .on('pointerout', () => quitButton.setStyle({ backgroundColor: '#333333' }))
      .on('pointerdown', () => {
        this.scene.stop('GameScene');
        this.scene.stop();
        this.scene.start('MainMenuScene');
      });
  }
}