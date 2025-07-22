import Phaser from 'phaser';

interface AssetCategory {
  name: string;
  assets: Array<{
    key: string;
    path: string;
    type: 'image' | 'audio' | 'spritesheet';
    frameConfig?: { frameWidth: number; frameHeight: number };
  }>;
}

export class PreloadScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;
  private assetText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private failedAssets: string[] = [];
  private retryAttempts = 0;
  private maxRetries = 3;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  init(): void {
    // Initialize loading state
    this.failedAssets = [];
    this.retryAttempts = 0;
  }

  preload(): void {
    this.createLoadingUI();
    this.setupLoadingEvents();
    this.loadAssets();
  }

  private createLoadingUI(): void {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a);

    // Title
    this.titleText = this.add.text(width / 2, height / 2 - 150, 'Stairway Sprint', {
      font: '48px Arial',
      color: '#ffffff',
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5);

    // Loading box background
    const boxWidth = 400;
    const boxHeight = 100;
    this.loadingBar = this.add.graphics();
    this.loadingBar.fillStyle(0x222222, 0.8);
    this.loadingBar.fillRoundedRect(
      width / 2 - boxWidth / 2,
      height / 2 - boxHeight / 2,
      boxWidth,
      boxHeight,
      10
    );

    // Progress bar
    this.progressBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2 - 70, 'Loading Assets...', {
      font: '24px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Percentage text
    this.percentText = this.add.text(width / 2, height / 2, '0%', {
      font: '36px Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Current asset text
    this.assetText = this.add.text(width / 2, height / 2 + 70, '', {
      font: '16px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);
  }

  private setupLoadingEvents(): void {
    const { width, height } = this.cameras.main;
    const barWidth = 360;
    const barHeight = 30;
    const barX = width / 2 - barWidth / 2;
    const barY = height / 2 - barHeight / 2;

    this.load.on('progress', (value: number) => {
      // Update percentage
      this.percentText.setText(`${Math.round(value * 100)}%`);

      // Update progress bar
      this.progressBar.clear();
      this.progressBar.fillStyle(0x00ff00, 1);
      this.progressBar.fillRoundedRect(
        barX,
        barY,
        barWidth * value,
        barHeight,
        5
      );

      // Add shine effect
      if (value > 0 && value < 1) {
        this.progressBar.fillStyle(0xffffff, 0.3);
        this.progressBar.fillRect(
          barX + (barWidth * value) - 20,
          barY,
          20,
          barHeight
        );
      }
    });

    this.load.on('fileprogress', (file: any) => {
      this.assetText.setText(`Loading: ${file.key}`);
    });

    this.load.on('filecomplete', (key: string, type: string, data: any) => {
      console.log(`Loaded: ${key} (${type})`);
    });

    this.load.on('loaderror', (file: any) => {
      console.error(`Failed to load: ${file.key}`);
      this.failedAssets.push(file.key);
      this.assetText.setText(`Error loading: ${file.key}`);
      this.assetText.setColor('#ff0000');
    });

    this.load.on('complete', () => {
      this.handleLoadComplete();
    });
  }

  private loadAssets(): void {
    // Set base URL for all assets
    this.load.setBaseURL('/assets');

    // Define asset categories
    const assetCategories: AssetCategory[] = [
      {
        name: 'Player Sprites',
        assets: [
          { key: 'player-up', path: 'images/sprites/player-up.png', type: 'image' },
          { key: 'player-down', path: 'images/sprites/player-down.png', type: 'image' },
          { key: 'player-left', path: 'images/sprites/player-left.png', type: 'image' },
          { key: 'player-right', path: 'images/sprites/player-right.png', type: 'image' }
        ]
      },
      {
        name: 'Stroller Sprites',
        assets: [
          { key: 'stroller-1', path: 'images/sprites/stroller-1.png', type: 'image' },
          { key: 'stroller-2', path: 'images/sprites/stroller-2.png', type: 'image' },
          { key: 'stroller-3', path: 'images/sprites/stroller-3.png', type: 'image' }
        ]
      },
      {
        name: 'Hazard Sprites',
        assets: [
          { key: 'hazard-lawnmower', path: 'images/sprites/hazard-lawnmower.png', type: 'image' },
          { key: 'hazard-crate', path: 'images/sprites/hazard-crate.png', type: 'image' },
          { key: 'hazard-trashcan', path: 'images/sprites/hazard-trashcan.png', type: 'image' }
        ]
      },
      {
        name: 'Character Sprites',
        assets: [
          { key: 'vip', path: 'images/sprites/vip.png', type: 'image' },
          { key: 'assassin', path: 'images/sprites/assassin.png', type: 'image' },
          { key: 'projectile', path: 'images/sprites/projectile.png', type: 'image' }
        ]
      },
      {
        name: 'Power-up Sprites',
        assets: [
          { key: 'powerup-shield', path: 'images/sprites/powerup-shield.png', type: 'image' },
          { key: 'powerup-speed', path: 'images/sprites/powerup-speed.png', type: 'image' },
          { key: 'powerup-multi', path: 'images/sprites/powerup-multi.png', type: 'image' }
        ]
      },
      {
        name: 'Tile Sprites',
        assets: [
          { key: 'stair-tile', path: 'images/tiles/stair-tile.png', type: 'image' },
          { key: 'wall-tile', path: 'images/tiles/wall-tile.png', type: 'image' }
        ]
      },
      {
        name: 'UI Elements',
        assets: [
          { key: 'heart-full', path: 'images/ui/heart-full.png', type: 'image' },
          { key: 'heart-empty', path: 'images/ui/heart-empty.png', type: 'image' },
          { key: 'button', path: 'images/ui/button.png', type: 'image' },
          { key: 'pause-icon', path: 'images/ui/pause-icon.png', type: 'image' },
          { key: 'play-icon', path: 'images/ui/play-icon.png', type: 'image' },
          { key: 'star', path: 'images/ui/star.png', type: 'image' }
        ]
      },
      {
        name: 'Audio',
        assets: [
          { key: 'bgm-main', path: 'audio/bgm-main.mp3', type: 'audio' },
          { key: 'sfx-collect', path: 'audio/sfx-collect.mp3', type: 'audio' },
          { key: 'sfx-hit', path: 'audio/sfx-hit.mp3', type: 'audio' },
          { key: 'sfx-shoot', path: 'audio/sfx-shoot.mp3', type: 'audio' },
          { key: 'sfx-powerup', path: 'audio/sfx-powerup.mp3', type: 'audio' },
          { key: 'sfx-gameover', path: 'audio/sfx-gameover.mp3', type: 'audio' },
          { key: 'difficulty_increase', path: 'audio/difficulty-increase.mp3', type: 'audio' },
          { key: 'difficulty_decrease', path: 'audio/difficulty-decrease.mp3', type: 'audio' }
        ]
      }
    ];

    // Load all assets
    assetCategories.forEach(category => {
      console.log(`Loading ${category.name}...`);
      category.assets.forEach(asset => {
        switch (asset.type) {
          case 'image':
            this.load.image(asset.key, asset.path);
            break;
          case 'audio':
            this.load.audio(asset.key, asset.path);
            break;
          case 'spritesheet':
            if (asset.frameConfig) {
              this.load.spritesheet(asset.key, asset.path, asset.frameConfig);
            }
            break;
        }
      });
    });
  }

  private handleLoadComplete(): void {
    if (this.failedAssets.length > 0 && this.retryAttempts < this.maxRetries) {
      // Retry failed assets
      this.retryAttempts++;
      this.loadingText.setText(`Retrying failed assets... (Attempt ${this.retryAttempts}/${this.maxRetries})`);
      this.assetText.setText(`Failed to load ${this.failedAssets.length} assets`);
      
      // Reset and retry after a short delay
      this.time.delayedCall(1000, () => {
        this.failedAssets = [];
        this.load.start();
      });
    } else {
      // Loading complete or max retries reached
      if (this.failedAssets.length > 0) {
        console.warn(`Failed to load ${this.failedAssets.length} assets after ${this.maxRetries} attempts`);
        this.showLoadingError();
      } else {
        this.transitionToMainMenu();
      }
    }
  }

  private showLoadingError(): void {
    this.loadingText.setText('Some assets failed to load');
    this.assetText.setText('Click to continue anyway');
    this.assetText.setInteractive({ useHandCursor: true });
    this.assetText.on('pointerdown', () => this.transitionToMainMenu());
  }

  private transitionToMainMenu(): void {
    // Fade out loading screen
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MainMenuScene');
    });
  }

  create(): void {
    // Asset loading is handled in preload, this is called after
    console.log('All assets loaded successfully!');
  }
}