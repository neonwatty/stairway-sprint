import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Fade in from black
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a);

    // Add some decorative elements using loaded assets
    const playerSprite = this.add.image(width / 2, height / 2 - 200, 'player-down');
    playerSprite.setScale(1.5);

    this.add.text(width / 2, height / 2 - 100, 'Stairway Sprint', {
      font: '48px Arial',
      color: '#ffffff',
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5);

    const playButton = this.add.text(width / 2, height / 2, 'Play', {
      font: '32px Arial',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => playButton.setStyle({ backgroundColor: '#555555' }))
      .on('pointerout', () => playButton.setStyle({ backgroundColor: '#333333' }))
      .on('pointerdown', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene');
        });
      });

    this.add.text(width / 2, height - 50, 'Press PLAY to start', {
      font: '18px Arial',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Add some animated elements
    this.tweens.add({
      targets: playerSprite,
      y: height / 2 - 190,
      duration: 2000,
      ease: 'Sine.easeInOut',
      repeat: -1,
      yoyo: true
    });
  }
}