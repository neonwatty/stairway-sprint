import Phaser from 'phaser';

export enum TransitionType {
  FADE = 'fade',
  SLIDE_LEFT = 'slide-left',
  SLIDE_RIGHT = 'slide-right',
  SLIDE_UP = 'slide-up',
  SLIDE_DOWN = 'slide-down',
  SCALE_IN = 'scale-in',
  SCALE_OUT = 'scale-out',
  ROTATE_IN = 'rotate-in',
  ROTATE_OUT = 'rotate-out',
  WIPE_LEFT = 'wipe-left',
  WIPE_RIGHT = 'wipe-right',
  CIRCLE_IN = 'circle-in',
  CIRCLE_OUT = 'circle-out',
  PARTICLE_BURST = 'particle-burst',
  PIXELATE = 'pixelate',
  RIPPLE = 'ripple'
}

interface TransitionConfig {
  type: TransitionType;
  duration: number;
  ease?: string;
  color?: number;
  direction?: 'in' | 'out';
  onComplete?: () => void;
}

export class SceneTransitionManager {
  private scene: Phaser.Scene;
  private transitionOverlay?: Phaser.GameObjects.Container;
  private isTransitioning: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public async transitionTo(
    targetScene: string, 
    transitionType: TransitionType = TransitionType.FADE,
    duration: number = 500,
    color: number = 0x000000
  ): Promise<void> {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;

    try {
      // Start transition out effect
      await this.playTransitionOut(transitionType, duration, color);
      
      // Switch to target scene
      this.scene.scene.start(targetScene);
      
    } catch (error) {
      console.error('Scene transition failed:', error);
      // Fallback to basic scene change
      this.scene.scene.start(targetScene);
    } finally {
      this.isTransitioning = false;
    }
  }

  public async transitionIn(
    transitionType: TransitionType = TransitionType.FADE,
    duration: number = 500,
    color: number = 0x000000
  ): Promise<void> {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;

    try {
      await this.playTransitionIn(transitionType, duration, color);
    } catch (error) {
      console.error('Transition in failed:', error);
    } finally {
      this.isTransitioning = false;
    }
  }

  private async playTransitionOut(
    type: TransitionType, 
    duration: number, 
    color: number
  ): Promise<void> {
    return new Promise((resolve) => {
      switch (type) {
        case TransitionType.FADE:
          this.fadeOut(duration, color, resolve);
          break;
        case TransitionType.SLIDE_LEFT:
          this.slideOut('left', duration, color, resolve);
          break;
        case TransitionType.SLIDE_RIGHT:
          this.slideOut('right', duration, color, resolve);
          break;
        case TransitionType.SLIDE_UP:
          this.slideOut('up', duration, color, resolve);
          break;
        case TransitionType.SLIDE_DOWN:
          this.slideOut('down', duration, color, resolve);
          break;
        case TransitionType.SCALE_OUT:
          this.scaleOut(duration, color, resolve);
          break;
        case TransitionType.ROTATE_OUT:
          this.rotateOut(duration, color, resolve);
          break;
        case TransitionType.WIPE_LEFT:
          this.wipeOut('left', duration, color, resolve);
          break;
        case TransitionType.WIPE_RIGHT:
          this.wipeOut('right', duration, color, resolve);
          break;
        case TransitionType.CIRCLE_OUT:
          this.circleOut(duration, color, resolve);
          break;
        case TransitionType.PARTICLE_BURST:
          this.particleBurstOut(duration, color, resolve);
          break;
        case TransitionType.PIXELATE:
          this.pixelateOut(duration, color, resolve);
          break;
        case TransitionType.RIPPLE:
          this.rippleOut(duration, color, resolve);
          break;
        default:
          this.fadeOut(duration, color, resolve);
      }
    });
  }

  private async playTransitionIn(
    type: TransitionType, 
    duration: number, 
    color: number
  ): Promise<void> {
    return new Promise((resolve) => {
      switch (type) {
        case TransitionType.FADE:
          this.fadeIn(duration, resolve);
          break;
        case TransitionType.SLIDE_LEFT:
          this.slideIn('left', duration, color, resolve);
          break;
        case TransitionType.SLIDE_RIGHT:
          this.slideIn('right', duration, color, resolve);
          break;
        case TransitionType.SLIDE_UP:
          this.slideIn('up', duration, color, resolve);
          break;
        case TransitionType.SLIDE_DOWN:
          this.slideIn('down', duration, color, resolve);
          break;
        case TransitionType.SCALE_IN:
          this.scaleIn(duration, resolve);
          break;
        case TransitionType.ROTATE_IN:
          this.rotateIn(duration, resolve);
          break;
        case TransitionType.WIPE_LEFT:
          this.wipeIn('left', duration, resolve);
          break;
        case TransitionType.WIPE_RIGHT:
          this.wipeIn('right', duration, resolve);
          break;
        case TransitionType.CIRCLE_IN:
          this.circleIn(duration, resolve);
          break;
        default:
          this.fadeIn(duration, resolve);
      }
    });
  }

  // Basic fade transitions
  private fadeOut(duration: number, color: number, callback: () => void): void {
    this.scene.cameras.main.fadeOut(duration, 
      (color >> 16) & 255, 
      (color >> 8) & 255, 
      color & 255
    );
    this.scene.cameras.main.once('camerafadeoutcomplete', callback);
  }

  private fadeIn(duration: number, callback: () => void): void {
    this.scene.cameras.main.fadeIn(duration, 0, 0, 0);
    this.scene.cameras.main.once('camerafadeincomplete', callback);
  }

  // Slide transitions
  private slideOut(direction: string, duration: number, color: number, callback: () => void): void {
    const camera = this.scene.cameras.main;
    const overlay = this.createOverlay(color);
    
    let startX = 0, startY = 0, endX = 0, endY = 0;
    
    switch (direction) {
      case 'left':
        startX = camera.width;
        endX = 0;
        break;
      case 'right':
        startX = -camera.width;
        endX = 0;
        break;
      case 'up':
        startY = camera.height;
        endY = 0;
        break;
      case 'down':
        startY = -camera.height;
        endY = 0;
        break;
    }
    
    overlay.setPosition(startX, startY);
    
    this.scene.tweens.add({
      targets: overlay,
      x: endX,
      y: endY,
      duration,
      ease: 'Power2',
      onComplete: () => {
        callback();
        overlay.destroy();
      }
    });
  }

  private slideIn(direction: string, duration: number, color: number, callback: () => void): void {
    const camera = this.scene.cameras.main;
    const overlay = this.createOverlay(color);
    
    let endX = 0, endY = 0;
    
    switch (direction) {
      case 'left':
        endX = -camera.width;
        break;
      case 'right':
        endX = camera.width;
        break;
      case 'up':
        endY = -camera.height;
        break;
      case 'down':
        endY = camera.height;
        break;
    }
    
    this.scene.tweens.add({
      targets: overlay,
      x: endX,
      y: endY,
      duration,
      ease: 'Power2',
      onComplete: () => {
        callback();
        overlay.destroy();
      }
    });
  }

  // Scale transitions
  private scaleOut(duration: number, color: number, callback: () => void): void {
    const overlay = this.createOverlay(color);
    overlay.setScale(0);
    
    this.scene.tweens.add({
      targets: overlay,
      scaleX: 1,
      scaleY: 1,
      duration,
      ease: 'Back.easeIn',
      onComplete: () => {
        callback();
        overlay.destroy();
      }
    });
  }

  private scaleIn(duration: number, callback: () => void): void {
    if (!this.transitionOverlay) return callback();
    
    this.scene.tweens.add({
      targets: this.transitionOverlay,
      scaleX: 0,
      scaleY: 0,
      duration,
      ease: 'Back.easeOut',
      onComplete: () => {
        callback();
        this.transitionOverlay?.destroy();
        this.transitionOverlay = undefined;
      }
    });
  }

  // Rotate transitions
  private rotateOut(duration: number, color: number, callback: () => void): void {
    const overlay = this.createOverlay(color);
    overlay.setScale(0);
    overlay.setAngle(0);
    
    this.scene.tweens.add({
      targets: overlay,
      scaleX: 1,
      scaleY: 1,
      angle: 360,
      duration,
      ease: 'Power2',
      onComplete: () => {
        callback();
        overlay.destroy();
      }
    });
  }

  private rotateIn(duration: number, callback: () => void): void {
    if (!this.transitionOverlay) return callback();
    
    this.scene.tweens.add({
      targets: this.transitionOverlay,
      scaleX: 0,
      scaleY: 0,
      angle: 360,
      duration,
      ease: 'Power2',
      onComplete: () => {
        callback();
        this.transitionOverlay?.destroy();
        this.transitionOverlay = undefined;
      }
    });
  }

  // Wipe transitions
  private wipeOut(direction: string, duration: number, color: number, callback: () => void): void {
    const camera = this.scene.cameras.main;
    const overlay = this.createOverlay(color);
    
    if (direction === 'left') {
      overlay.setOrigin(0, 0);
      overlay.setPosition(0, 0);
      overlay.setScale(0, 1);
      
      this.scene.tweens.add({
        targets: overlay,
        scaleX: 1,
        duration,
        ease: 'Power2',
        onComplete: () => {
          callback();
          overlay.destroy();
        }
      });
    } else {
      overlay.setOrigin(1, 0);
      overlay.setPosition(camera.width, 0);
      overlay.setScale(0, 1);
      
      this.scene.tweens.add({
        targets: overlay,
        scaleX: 1,
        duration,
        ease: 'Power2',
        onComplete: () => {
          callback();
          overlay.destroy();
        }
      });
    }
  }

  private wipeIn(direction: string, duration: number, callback: () => void): void {
    if (!this.transitionOverlay) return callback();
    
    this.scene.tweens.add({
      targets: this.transitionOverlay,
      scaleX: 0,
      duration,
      ease: 'Power2',
      onComplete: () => {
        callback();
        this.transitionOverlay?.destroy();
        this.transitionOverlay = undefined;
      }
    });
  }

  // Circle transitions
  private circleOut(duration: number, color: number, callback: () => void): void {
    const camera = this.scene.cameras.main;
    const graphics = this.scene.add.graphics();
    graphics.setDepth(10000);
    graphics.setScrollFactor(0);
    
    let radius = 0;
    const maxRadius = Math.max(camera.width, camera.height);
    
    const tween = this.scene.tweens.addCounter({
      from: 0,
      to: maxRadius,
      duration,
      ease: 'Power2',
      onUpdate: (tween) => {
        radius = tween.getValue();
        graphics.clear();
        graphics.fillStyle(color);
        graphics.fillCircle(camera.centerX, camera.centerY, radius);
      },
      onComplete: () => {
        callback();
        graphics.destroy();
      }
    });
  }

  private circleIn(duration: number, callback: () => void): void {
    const camera = this.scene.cameras.main;
    const graphics = this.scene.add.graphics();
    graphics.setDepth(10000);
    graphics.setScrollFactor(0);
    
    let radius = Math.max(camera.width, camera.height);
    
    graphics.fillStyle(0x000000);
    graphics.fillCircle(camera.centerX, camera.centerY, radius);
    
    this.scene.tweens.addCounter({
      from: radius,
      to: 0,
      duration,
      ease: 'Power2',
      onUpdate: (tween) => {
        radius = tween.getValue();
        graphics.clear();
        graphics.fillStyle(0x000000);
        graphics.fillCircle(camera.centerX, camera.centerY, radius);
      },
      onComplete: () => {
        callback();
        graphics.destroy();
      }
    });
  }

  // Particle burst transition
  private particleBurstOut(duration: number, color: number, callback: () => void): void {
    const camera = this.scene.cameras.main;
    const particleCount = 50;
    const particles: Phaser.GameObjects.Graphics[] = [];
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.add.graphics();
      particle.fillStyle(color);
      particle.fillCircle(0, 0, Phaser.Math.Between(5, 15));
      particle.setPosition(camera.centerX, camera.centerY);
      particle.setDepth(10000);
      particle.setScrollFactor(0);
      
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = Phaser.Math.Between(200, 400);
      const endX = camera.centerX + Math.cos(angle) * speed;
      const endY = camera.centerY + Math.sin(angle) * speed;
      
      this.scene.tweens.add({
        targets: particle,
        x: endX,
        y: endY,
        alpha: 0,
        duration: duration * 0.8,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
      
      particles.push(particle);
    }
    
    // Create overlay after particles
    this.scene.time.delayedCall(duration * 0.5, () => {
      const overlay = this.createOverlay(color);
      overlay.setAlpha(0);
      
      this.scene.tweens.add({
        targets: overlay,
        alpha: 1,
        duration: duration * 0.5,
        onComplete: () => {
          callback();
          overlay.destroy();
        }
      });
    });
  }

  // Pixelate transition
  private pixelateOut(duration: number, color: number, callback: () => void): void {
    const camera = this.scene.cameras.main;
    const pixelSize = 20;
    const cols = Math.ceil(camera.width / pixelSize);
    const rows = Math.ceil(camera.height / pixelSize);
    
    const pixels: Phaser.GameObjects.Rectangle[] = [];
    
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const pixel = this.scene.add.rectangle(
          x * pixelSize + pixelSize / 2,
          y * pixelSize + pixelSize / 2,
          pixelSize,
          pixelSize,
          color
        );
        pixel.setDepth(10000);
        pixel.setScrollFactor(0);
        pixel.setAlpha(0);
        
        const delay = Math.random() * duration * 0.7;
        
        this.scene.time.delayedCall(delay, () => {
          this.scene.tweens.add({
            targets: pixel,
            alpha: 1,
            duration: 200,
            onComplete: () => {
              if (x === cols - 1 && y === rows - 1) {
                callback();
                pixels.forEach(p => p.destroy());
              }
            }
          });
        });
        
        pixels.push(pixel);
      }
    }
  }

  // Ripple transition
  private rippleOut(duration: number, color: number, callback: () => void): void {
    const camera = this.scene.cameras.main;
    const graphics = this.scene.add.graphics();
    graphics.setDepth(10000);
    graphics.setScrollFactor(0);
    
    const rippleCount = 5;
    let completedRipples = 0;
    
    for (let i = 0; i < rippleCount; i++) {
      const delay = (i / rippleCount) * duration * 0.3;
      
      this.scene.time.delayedCall(delay, () => {
        let radius = 0;
        const maxRadius = Math.max(camera.width, camera.height) * 1.5;
        
        this.scene.tweens.addCounter({
          from: 0,
          to: maxRadius,
          duration: duration * 0.8,
          ease: 'Power2',
          onUpdate: (tween) => {
            radius = tween.getValue();
            graphics.clear();
            graphics.lineStyle(20, color, 1 - (radius / maxRadius));
            graphics.strokeCircle(camera.centerX, camera.centerY, radius);
          },
          onComplete: () => {
            completedRipples++;
            if (completedRipples === rippleCount) {
              const overlay = this.createOverlay(color);
              overlay.setAlpha(0);
              
              this.scene.tweens.add({
                targets: overlay,
                alpha: 1,
                duration: 200,
                onComplete: () => {
                  callback();
                  graphics.destroy();
                  overlay.destroy();
                }
              });
            }
          }
        });
      });
    }
  }

  private createOverlay(color: number): Phaser.GameObjects.Rectangle {
    const camera = this.scene.cameras.main;
    const overlay = this.scene.add.rectangle(
      camera.centerX, camera.centerY,
      camera.width, camera.height,
      color
    );
    overlay.setDepth(10000);
    overlay.setScrollFactor(0);
    
    this.transitionOverlay = this.scene.add.container();
    this.transitionOverlay.add(overlay);
    this.transitionOverlay.setDepth(10000);
    this.transitionOverlay.setScrollFactor(0);
    
    return overlay;
  }

  public isInTransition(): boolean {
    return this.isTransitioning;
  }

  public destroy(): void {
    this.transitionOverlay?.destroy();
    this.transitionOverlay = undefined;
    this.isTransitioning = false;
  }
}