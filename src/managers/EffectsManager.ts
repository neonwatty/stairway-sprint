import Phaser from 'phaser';

interface EffectConfig {
  texture: string;
  speed: { min: number; max: number };
  scale: { start: number; end: number };
  lifespan: number;
  quantity: number;
  tint?: number;
  gravity?: { x: number; y: number };
  emitZone?: { source: any };
}

export class EffectsManager {
  private scene: Phaser.Scene;
  private particleEmitterPool: any[] = [];
  private activeEmitters: Map<any, number> = new Map();
  private maxPoolSize: number = 20;
  private effectConfigs: Map<string, EffectConfig> = new Map();
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeEffectConfigs();
    this.prewarmPool();
  }
  
  private initializeEffectConfigs(): void {
    // Rescue effect (collecting strollers)
    this.effectConfigs.set('rescue', {
      texture: 'star',
      speed: { min: 100, max: 200 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      quantity: 5,
      tint: 0x00ff00
    });
    
    // Impact effect (hitting hazards)
    this.effectConfigs.set('impact', {
      texture: 'star',
      speed: { min: 150, max: 250 },
      scale: { start: 0.7, end: 0 },
      lifespan: 400,
      quantity: 8,
      tint: 0xff0000,
      gravity: { x: 0, y: 200 }
    });
    
    // Protection effect (protecting VIPs)
    this.effectConfigs.set('protection', {
      texture: 'star',
      speed: { min: 200, max: 300 },
      scale: { start: 0.8, end: 0 },
      lifespan: 800,
      quantity: 10,
      tint: 0xffd700
    });
    
    // Elimination effect (shooting assassins)
    this.effectConfigs.set('elimination', {
      texture: 'star',
      speed: { min: 250, max: 350 },
      scale: { start: 1.0, end: 0 },
      lifespan: 600,
      quantity: 12,
      tint: 0xff0000,
      emitZone: {
        source: new Phaser.Geom.Circle(0, 0, 20)
      }
    });
    
    // Streak bonus effect
    this.effectConfigs.set('streak', {
      texture: 'star',
      speed: { min: 300, max: 400 },
      scale: { start: 1.2, end: 0 },
      lifespan: 1000,
      quantity: 15,
      tint: 0x00ffff,
      emitZone: {
        source: new Phaser.Geom.Circle(0, 0, 30)
      }
    });
  }
  
  private prewarmPool(): void {
    // Pre-create particle emitters for better performance
    for (let i = 0; i < this.maxPoolSize; i++) {
      const emitter = this.scene.add.particles(0, 0, 'star', {
        active: false,
        visible: false
      });
      this.particleEmitterPool.push(emitter);
    }
  }
  
  private getEmitterFromPool(): any | null {
    // Find an inactive emitter
    const emitter = this.particleEmitterPool.find(e => !e.active);
    
    if (!emitter && this.particleEmitterPool.length < this.maxPoolSize) {
      // Create a new emitter if pool isn't full
      const newEmitter = this.scene.add.particles(0, 0, 'star', {
        active: false,
        visible: false
      });
      this.particleEmitterPool.push(newEmitter);
      return newEmitter;
    }
    
    return emitter || null;
  }
  
  private returnEmitterToPool(emitter: any): void {
    emitter.stop();
    emitter.setActive(false);
    emitter.setVisible(false);
    emitter.x = 0;
    emitter.y = 0;
    this.activeEmitters.delete(emitter);
  }
  
  private playEffect(x: number, y: number, effectType: string): void {
    const config = this.effectConfigs.get(effectType);
    if (!config) return;
    
    const emitter = this.getEmitterFromPool();
    if (!emitter) return;
    
    // Configure emitter with effect settings
    emitter.setPosition(x, y);
    emitter.setTexture(config.texture);
    emitter.setConfig({
      speed: config.speed,
      scale: config.scale,
      lifespan: config.lifespan,
      quantity: config.quantity,
      tint: config.tint,
      gravityX: config.gravity?.x || 0,
      gravityY: config.gravity?.y || 0,
      emitZone: config.emitZone
    });
    
    emitter.setActive(true);
    emitter.setVisible(true);
    emitter.explode(config.quantity);
    
    // Track active emitter
    this.activeEmitters.set(emitter, Date.now());
    
    // Schedule return to pool
    this.scene.time.delayedCall(config.lifespan, () => {
      this.returnEmitterToPool(emitter);
    });
  }
  
  public playRescueEffect(x: number, y: number): void {
    this.playEffect(x, y, 'rescue');
    
    // Optional: Add sound effect
    if (this.scene.sound.get('rescue')) {
      this.scene.sound.play('rescue', { volume: 0.5 });
    }
  }
  
  public playImpactEffect(x: number, y: number): void {
    this.playEffect(x, y, 'impact');
    
    // Optional: Add sound effect
    if (this.scene.sound.get('impact')) {
      this.scene.sound.play('impact', { volume: 0.7 });
    }
  }
  
  public playProtectionEffect(x: number, y: number): void {
    this.playEffect(x, y, 'protection');
    
    // Optional: Add sound effect
    if (this.scene.sound.get('protection')) {
      this.scene.sound.play('protection', { volume: 0.6 });
    }
  }
  
  public playEliminationEffect(x: number, y: number): void {
    this.playEffect(x, y, 'elimination');
    
    // Create additional flash effect
    const flash = this.scene.add.image(x, y, 'star');
    flash.setScale(2);
    flash.setTint(0xff0000);
    
    this.scene.tweens.add({
      targets: flash,
      scale: 0,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy();
      }
    });
    
    // Optional: Add sound effect
    if (this.scene.sound.get('elimination')) {
      this.scene.sound.play('elimination', { volume: 0.8 });
    }
  }
  
  public playStreakBonusEffect(x: number, y: number): void {
    this.playEffect(x, y, 'streak');
    
    // Create expanding ring effect
    const ring = this.scene.add.graphics();
    ring.lineStyle(4, 0x00ffff, 1);
    ring.strokeCircle(x, y, 10);
    
    this.scene.tweens.add({
      targets: ring,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        ring.destroy();
      }
    });
    
    // Optional: Add sound effect
    if (this.scene.sound.get('bonus')) {
      this.scene.sound.play('bonus', { volume: 0.7 });
    }
  }
  
  public getPoolStats(): { total: number; active: number; available: number } {
    const active = this.activeEmitters.size;
    return {
      total: this.particleEmitterPool.length,
      active: active,
      available: this.particleEmitterPool.length - active
    };
  }
  
  public cleanup(): void {
    // Clean up expired emitters
    const now = Date.now();
    this.activeEmitters.forEach((startTime, emitter) => {
      if (now - startTime > 10000) { // Safety cleanup after 10 seconds
        this.returnEmitterToPool(emitter);
      }
    });
  }
  
  public destroy(): void {
    // Return all active emitters to pool
    this.activeEmitters.forEach((_, emitter) => {
      this.returnEmitterToPool(emitter);
    });
    
    // Destroy all emitters
    this.particleEmitterPool.forEach(emitter => {
      emitter.destroy();
    });
    
    this.particleEmitterPool = [];
    this.activeEmitters.clear();
    this.effectConfigs.clear();
  }
}