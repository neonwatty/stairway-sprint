import Phaser from 'phaser';

interface BackgroundLayer {
  sprites: Phaser.GameObjects.TileSprite[];
  scrollSpeed: number;
  depth: number;
}

export class BackgroundManager {
  private scene: Phaser.Scene;
  private layers: BackgroundLayer[] = [];
  private baseScrollSpeed: number = 2;
  private isScrolling: boolean = true;
  
  // Parallax layer configurations
  private readonly layerConfigs = [
    { key: 'wall-tile', scrollSpeed: 0.3, depth: -3, alpha: 0.5 }, // Far background
    { key: 'stair-tile', scrollSpeed: 0.6, depth: -2, alpha: 0.8 }, // Mid background
    { key: 'stair-tile', scrollSpeed: 1.0, depth: -1, alpha: 1.0 }  // Near background
  ];
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  public create(): void {
    const { width, height } = this.scene.cameras.main;
    
    // Create each parallax layer
    this.layerConfigs.forEach(config => {
      const layer: BackgroundLayer = {
        sprites: [],
        scrollSpeed: config.scrollSpeed,
        depth: config.depth
      };
      
      // Calculate how many tiles we need to cover the screen height plus buffer
      const tileHeight = 64; // Assuming standard tile size
      const tilesNeeded = Math.ceil((height + 200) / tileHeight);
      
      // Create tile sprites for this layer
      for (let i = 0; i < tilesNeeded; i++) {
        const tile = this.scene.add.tileSprite(
          width / 2,
          i * tileHeight - 100, // Start above screen
          width,
          tileHeight,
          config.key
        );
        
        tile.setDepth(config.depth);
        tile.setAlpha(config.alpha);
        
        // Add some variety to wall tiles
        if (config.key === 'wall-tile') {
          tile.setTint(Phaser.Math.Between(0xcccccc, 0xffffff));
        }
        
        layer.sprites.push(tile);
      }
      
      this.layers.push(layer);
    });
    
    // Add decorative elements
    this.addDecorativeElements();
  }
  
  private addDecorativeElements(): void {
    const { width, height } = this.scene.cameras.main;
    
    // Add random windows on wall tiles (far background)
    for (let i = 0; i < 5; i++) {
      const window = this.scene.add.rectangle(
        Phaser.Math.Between(50, width - 50),
        Phaser.Math.Between(100, height - 100),
        40,
        60,
        0x4444ff,
        0.3
      );
      window.setDepth(-2.5);
    }
    
    // Add dust particles
    const particles = this.scene.add.particles(0, 0, 'star', {
      x: { min: 0, max: width },
      y: 0,
      lifespan: { min: 4000, max: 6000 },
      speedY: { min: 20, max: 50 },
      speedX: { min: -20, max: 20 },
      scale: { start: 0.1, end: 0 },
      alpha: { start: 0.3, end: 0 },
      frequency: 500,
      blendMode: 'ADD'
    });
    
    particles.setDepth(-0.5);
  }
  
  public update(deltaTime: number): void {
    if (!this.isScrolling) return;
    
    const scrollAmount = this.baseScrollSpeed * (deltaTime / 16.67); // Normalize to 60fps
    
    this.layers.forEach(layer => {
      layer.sprites.forEach(sprite => {
        // Scroll the tile texture
        sprite.tilePositionY -= scrollAmount * layer.scrollSpeed;
        
        // Also move the sprite itself for endless scrolling
        sprite.y += scrollAmount * layer.scrollSpeed;
        
        // Reset position if sprite has scrolled off screen
        if (sprite.y > this.scene.cameras.main.height + 100) {
          const firstSprite = layer.sprites[0];
          sprite.y = firstSprite.y - sprite.height;
          
          // Shift array to maintain order
          layer.sprites.shift();
          layer.sprites.push(sprite);
        }
      });
    });
  }
  
  public setScrollSpeed(speed: number): void {
    this.baseScrollSpeed = speed;
  }
  
  public getScrollSpeed(): number {
    return this.baseScrollSpeed;
  }
  
  public pause(): void {
    this.isScrolling = false;
  }
  
  public resume(): void {
    this.isScrolling = true;
  }
  
  public setQuality(quality: 'low' | 'medium' | 'high'): void {
    // Adjust particle density and layer visibility based on quality
    this.layers.forEach((layer, index) => {
      if (quality === 'low' && index === 0) {
        // Hide far background on low quality
        layer.sprites.forEach(sprite => sprite.setVisible(false));
      } else {
        layer.sprites.forEach(sprite => sprite.setVisible(true));
      }
    });
  }
  
  public destroy(): void {
    this.layers.forEach(layer => {
      layer.sprites.forEach(sprite => sprite.destroy());
    });
    this.layers = [];
  }
}