import Phaser from 'phaser';

interface EffectConfig {
  texture: string;
  speed: { min: number; max: number };
  scale: { start: number; end: number };
  lifespan: number;
  quantity: number;
  tint?: number | number[];
  gravity?: { x: number; y: number };
  emitZone?: { source: any };
  alpha?: { start: number; end: number };
  blendMode?: string;
  frequency?: number;
  angle?: { min: number; max: number };
  bounce?: { x: number; y: number };
}

interface TrailEffect {
  target: Phaser.GameObjects.GameObject;
  emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  duration: number;
}

export class EffectsManager {
  private scene: Phaser.Scene;
  private particleEmitterPool: any[] = [];
  private activeEmitters: Map<any, number> = new Map();
  private maxPoolSize: number = 30; // Increased pool size
  private effectConfigs: Map<string, EffectConfig> = new Map();
  private activeTrails: Map<string, TrailEffect> = new Map();
  private environmentalEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private slowMotionActive: boolean = false;
  private qualityLevel: number = 2; // 0=low, 1=medium, 2=high
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeEffectConfigs();
    this.prewarmPool();
  }
  
  private initializeEffectConfigs(): void {
    // Enhanced rescue effect (collecting strollers)
    this.effectConfigs.set('rescue', {
      texture: 'star',
      speed: { min: 100, max: 200 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      quantity: 8,
      tint: [0x00ff00, 0x00ff88, 0x88ff00],
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD'
    });
    
    // Enhanced impact effect with debris (hitting hazards)
    this.effectConfigs.set('impact', {
      texture: 'star',
      speed: { min: 150, max: 350 },
      scale: { start: 0.8, end: 0.1 },
      lifespan: 600,
      quantity: 12,
      tint: [0xff0000, 0xff4400, 0xffaa00],
      gravity: { x: 0, y: 300 },
      alpha: { start: 1, end: 0 },
      angle: { min: 0, max: 360 },
      bounce: { x: 0.3, y: 0.2 }
    });
    
    // Enhanced protection effect (protecting VIPs)
    this.effectConfigs.set('protection', {
      texture: 'star',
      speed: { min: 80, max: 150 },
      scale: { start: 0.6, end: 0 },
      lifespan: 1000,
      quantity: 15,
      tint: [0xffd700, 0xffff00, 0xffffff],
      alpha: { start: 0.8, end: 0 },
      blendMode: 'ADD',
      emitZone: {
        source: new Phaser.Geom.Circle(0, 0, 25)
      }
    });
    
    // Enhanced elimination effect (shooting assassins)
    this.effectConfigs.set('elimination', {
      texture: 'star',
      speed: { min: 200, max: 400 },
      scale: { start: 1.0, end: 0 },
      lifespan: 800,
      quantity: 18,
      tint: [0xff0000, 0xff6600, 0xffff00],
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      emitZone: {
        source: new Phaser.Geom.Circle(0, 0, 30)
      }
    });
    
    // Enhanced streak bonus effect
    this.effectConfigs.set('streak', {
      texture: 'star',
      speed: { min: 100, max: 300 },
      scale: { start: 1.5, end: 0 },
      lifespan: 1200,
      quantity: 20,
      tint: [0x00ffff, 0x0088ff, 0xffffff],
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      emitZone: {
        source: new Phaser.Geom.Circle(0, 0, 40)
      }
    });

    // New particle effects
    
    // Projectile trail effect
    this.effectConfigs.set('projectile_trail', {
      texture: 'star',
      speed: { min: 20, max: 50 },
      scale: { start: 0.3, end: 0 },
      lifespan: 300,
      quantity: 2,
      tint: [0xffffff, 0x88ffff, 0x0088ff],
      alpha: { start: 0.8, end: 0 },
      frequency: 50,
      blendMode: 'ADD'
    });
    
    // Explosion effect for major impacts
    this.effectConfigs.set('explosion', {
      texture: 'star',
      speed: { min: 100, max: 500 },
      scale: { start: 1.2, end: 0 },
      lifespan: 800,
      quantity: 25,
      tint: [0xff4400, 0xff8800, 0xffcc00, 0xffffff],
      gravity: { x: 0, y: 200 },
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      angle: { min: 0, max: 360 }
    });
    
    // Smoke effect for environmental ambiance
    this.effectConfigs.set('smoke', {
      texture: 'star',
      speed: { min: 20, max: 60 },
      scale: { start: 0.8, end: 1.5 },
      lifespan: 2000,
      quantity: 3,
      tint: [0x666666, 0x888888, 0xaaaaaa],
      gravity: { x: 0, y: -50 },
      alpha: { start: 0.6, end: 0 },
      frequency: 200
    });
    
    // Sparkle effect for special moments
    this.effectConfigs.set('sparkle', {
      texture: 'star',
      speed: { min: 50, max: 150 },
      scale: { start: 0.4, end: 0 },
      lifespan: 600,
      quantity: 12,
      tint: [0xffffff, 0xffffaa, 0xffaaff],
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      angle: { min: 0, max: 360 }
    });
    
    // Dust effect for ground impacts
    this.effectConfigs.set('dust', {
      texture: 'star',
      speed: { min: 80, max: 200 },
      scale: { start: 0.6, end: 0 },
      lifespan: 1000,
      quantity: 8,
      tint: [0xccaa88, 0xddbb99, 0xeecc99],
      gravity: { x: 0, y: 100 },
      alpha: { start: 0.7, end: 0 },
      angle: { min: 160, max: 200 }
    });
    
    // Power-up collection effect
    this.effectConfigs.set('powerup', {
      texture: 'star',
      speed: { min: 150, max: 250 },
      scale: { start: 0.8, end: 0 },
      lifespan: 700,
      quantity: 15,
      tint: [0xff00ff, 0xff88ff, 0xffffff],
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      emitZone: {
        source: new Phaser.Geom.Circle(0, 0, 20)
      }
    });

    // Environmental rain/debris effect
    this.effectConfigs.set('debris', {
      texture: 'star',
      speed: { min: 100, max: 200 },
      scale: { start: 0.3, end: 0.1 },
      lifespan: 3000,
      quantity: 1,
      tint: [0x666666, 0x444444, 0x888888],
      gravity: { x: 0, y: 150 },
      alpha: { start: 0.4, end: 0 },
      frequency: 100,
      angle: { min: 85, max: 95 }
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
  
  private playEffect(x: number, y: number, effectType: string, scale: number = 1): void {
    const config = this.effectConfigs.get(effectType);
    if (!config) return;
    
    // Apply quality scaling
    const qualityScale = this.getQualityScale();
    const adjustedQuantity = Math.max(1, Math.floor(config.quantity * qualityScale * scale));
    
    const emitter = this.getEmitterFromPool();
    if (!emitter) return;
    
    // Configure emitter with enhanced settings
    emitter.setPosition(x, y);
    emitter.setTexture(config.texture);
    
    const emitterConfig: any = {
      speed: config.speed,
      scale: config.scale,
      lifespan: config.lifespan,
      quantity: adjustedQuantity,
      gravityX: config.gravity?.x || 0,
      gravityY: config.gravity?.y || 0,
      emitZone: config.emitZone,
      alpha: config.alpha || { start: 1, end: 0 },
      angle: config.angle || { min: 0, max: 360 },
      bounce: config.bounce,
      frequency: config.frequency || -1
    };
    
    // Handle tint arrays for color variety
    if (Array.isArray(config.tint)) {
      emitterConfig.tint = config.tint;
    } else if (config.tint) {
      emitterConfig.tint = config.tint;
    }
    
    // Apply blend mode if specified
    if (config.blendMode) {
      emitter.setBlendMode(config.blendMode);
    }
    
    emitter.setConfig(emitterConfig);
    emitter.setActive(true);
    emitter.setVisible(true);
    emitter.explode(adjustedQuantity);
    
    // Track active emitter
    this.activeEmitters.set(emitter, Date.now());
    
    // Schedule return to pool
    this.scene.time.delayedCall(config.lifespan, () => {
      this.returnEmitterToPool(emitter);
    });
  }
  
  private getQualityScale(): number {
    switch (this.qualityLevel) {
      case 0: return 0.3; // Low quality
      case 1: return 0.7; // Medium quality
      case 2: return 1.0; // High quality
      default: return 1.0;
    }
  }
  
  // Enhanced existing effects
  public playRescueEffect(x: number, y: number): void {
    this.playEffect(x, y, 'rescue');
    this.playEffect(x, y, 'sparkle', 0.5); // Add sparkles
  }
  
  public playImpactEffect(x: number, y: number): void {
    this.playEffect(x, y, 'impact');
    this.playEffect(x, y, 'dust', 0.7); // Add dust cloud
    
    // Screen shake for impact
    this.screenShake(200, 0.01);
  }
  
  public playProtectionEffect(x: number, y: number): void {
    this.playEffect(x, y, 'protection');
    
    // Create protective aura ring
    this.createProtectiveAura(x, y);
  }
  
  public playEliminationEffect(x: number, y: number): void {
    this.playEffect(x, y, 'elimination');
    this.playEffect(x, y, 'explosion', 0.8); // Add explosion
    
    // Enhanced flash effect
    this.createEliminationFlash(x, y);
    
    // Screen shake for elimination
    this.screenShake(300, 0.015);
  }
  
  public playStreakBonusEffect(x: number, y: number): void {
    this.playEffect(x, y, 'streak');
    this.playEffect(x, y, 'sparkle', 1.2); // Extra sparkles
    
    // Enhanced expanding ring effect
    this.createStreakRings(x, y);
  }

  // New particle effects
  public playExplosionEffect(x: number, y: number, scale: number = 1): void {
    this.playEffect(x, y, 'explosion', scale);
    this.playEffect(x, y, 'smoke', scale * 0.5);
    
    // Screen shake proportional to explosion size
    this.screenShake(400 * scale, 0.02 * scale);
  }
  
  public playPowerUpEffect(x: number, y: number): void {
    this.playEffect(x, y, 'powerup');
    this.playEffect(x, y, 'sparkle', 0.8);
    
    // Color flash for power-up collection
    this.flashScreen(0xff00ff, 200);
  }
  
  public playProjectileTrail(target: Phaser.GameObjects.GameObject): string {
    const trailId = `trail_${Date.now()}_${Math.random()}`;
    const config = this.effectConfigs.get('projectile_trail');
    if (!config || !target.body) return trailId;
    
    const emitter = this.getEmitterFromPool();
    if (!emitter) return trailId;
    
    // Configure trail emitter
    emitter.setTexture(config.texture);
    emitter.setConfig({
      speed: config.speed,
      scale: config.scale,
      lifespan: config.lifespan,
      quantity: config.quantity,
      tint: config.tint,
      alpha: config.alpha,
      frequency: config.frequency,
      blendMode: config.blendMode
    });
    
    emitter.setActive(true);
    emitter.setVisible(true);
    emitter.startFollow(target);
    
    // Store trail reference
    this.activeTrails.set(trailId, {
      target,
      emitter,
      duration: Date.now() + 5000 // 5 second max duration
    });
    
    return trailId;
  }
  
  public stopProjectileTrail(trailId: string): void {
    const trail = this.activeTrails.get(trailId);
    if (trail) {
      trail.emitter.stopFollow();
      this.returnEmitterToPool(trail.emitter);
      this.activeTrails.delete(trailId);
    }
  }
  
  public startEnvironmentalEffect(effectType: 'debris' | 'smoke', intensity: number = 1): void {
    const config = this.effectConfigs.get(effectType);
    if (!config) return;
    
    const camera = this.scene.cameras.main;
    const emitter = this.scene.add.particles(0, -50, config.texture, {
      x: { min: 0, max: camera.width },
      speed: config.speed,
      scale: config.scale,
      lifespan: config.lifespan,
      quantity: Math.floor(config.quantity * intensity),
      tint: config.tint,
      alpha: config.alpha,
      gravityX: config.gravity?.x || 0,
      gravityY: config.gravity?.y || 0,
      frequency: Math.floor((config.frequency || 200) / intensity),
      angle: config.angle
    });
    
    emitter.setScrollFactor(0);
    this.environmentalEmitters.push(emitter);
  }
  
  public stopEnvironmentalEffects(): void {
    this.environmentalEmitters.forEach(emitter => {
      emitter.destroy();
    });
    this.environmentalEmitters = [];
  }

  // Screen effects
  public slowMotion(duration: number = 1000, factor: number = 0.3): void {
    if (this.slowMotionActive) return;
    
    this.slowMotionActive = true;
    
    // Slow down physics and tweens
    this.scene.physics.world.timeScale = factor;
    this.scene.tweens.timeScale = factor;
    
    // Visual indicator
    this.createSlowMotionOverlay(factor);
    
    // Restore normal speed after duration
    this.scene.time.delayedCall(duration, () => {
      this.scene.physics.world.timeScale = 1;
      this.scene.tweens.timeScale = 1;
      this.slowMotionActive = false;
    });
  }
  
  public screenShake(duration: number = 300, intensity: number = 0.02): void {
    this.scene.cameras.main.shake(duration, intensity);
  }
  
  public flashScreen(color: number = 0xffffff, duration: number = 200): void {
    this.scene.cameras.main.flash(duration, (color >> 16) & 255, (color >> 8) & 255, color & 255);
  }
  
  public zoomEffect(scale: number = 1.2, duration: number = 500): void {
    const camera = this.scene.cameras.main;
    const originalZoom = camera.zoom;
    
    this.scene.tweens.add({
      targets: camera,
      zoom: scale,
      duration: duration / 2,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        camera.setZoom(originalZoom);
      }
    });
  }
  
  public colorOverlay(color: number, alpha: number = 0.5, duration: number = 1000): void {
    const camera = this.scene.cameras.main;
    const overlay = this.scene.add.rectangle(
      camera.centerX, camera.centerY,
      camera.width, camera.height,
      color, alpha
    );
    overlay.setScrollFactor(0);
    overlay.setDepth(1000);
    
    this.scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration,
      ease: 'Power2',
      onComplete: () => {
        overlay.destroy();
      }
    });
  }

  // Helper methods for complex effects
  private createProtectiveAura(x: number, y: number): void {
    const ring1 = this.scene.add.graphics();
    const ring2 = this.scene.add.graphics();
    
    ring1.lineStyle(3, 0xffd700, 0.8);
    ring1.strokeCircle(x, y, 30);
    ring2.lineStyle(2, 0xffffff, 0.6);
    ring2.strokeCircle(x, y, 40);
    
    [ring1, ring2].forEach((ring, index) => {
      this.scene.tweens.add({
        targets: ring,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 800 + (index * 200),
        ease: 'Power2',
        onComplete: () => ring.destroy()
      });
    });
  }
  
  private createEliminationFlash(x: number, y: number): void {
    const flash = this.scene.add.image(x, y, 'star');
    flash.setScale(3);
    flash.setTint(0xff4400);
    flash.setBlendMode('ADD');
    
    this.scene.tweens.add({
      targets: flash,
      scale: 0,
      alpha: 0,
      duration: 400,
      ease: 'Power3',
      onComplete: () => flash.destroy()
    });
  }
  
  private createStreakRings(x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.graphics();
      ring.lineStyle(4 - i, 0x00ffff, 0.8 - (i * 0.2));
      ring.strokeCircle(x, y, 15 + (i * 10));
      
      this.scene.tweens.add({
        targets: ring,
        scaleX: 2 + i,
        scaleY: 2 + i,
        alpha: 0,
        duration: 600 + (i * 200),
        ease: 'Power2',
        delay: i * 100,
        onComplete: () => ring.destroy()
      });
    }
  }
  
  private createSlowMotionOverlay(factor: number): void {
    const overlay = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0x0088ff, 0.1 + (1 - factor) * 0.2
    );
    overlay.setScrollFactor(0);
    overlay.setDepth(999);
    
    this.scene.tweens.add({
      targets: overlay,
      alpha: { from: 0, to: overlay.alpha },
      duration: 200,
      yoyo: true,
      repeat: -1
    });
    
    // Remove overlay when slow motion ends
    this.scene.time.delayedCall(1000, () => {
      overlay.destroy();
    });
  }
  
  public getPoolStats(): { total: number; active: number; available: number; trails: number; environmental: number } {
    const active = this.activeEmitters.size;
    return {
      total: this.particleEmitterPool.length,
      active: active,
      available: this.particleEmitterPool.length - active,
      trails: this.activeTrails.size,
      environmental: this.environmentalEmitters.length
    };
  }
  
  public setQualityLevel(level: number): void {
    this.qualityLevel = Math.max(0, Math.min(2, level));
    
    // Adjust environmental effects based on quality
    if (level === 0) {
      this.stopEnvironmentalEffects();
    }
  }
  
  public getQualityLevel(): number {
    return this.qualityLevel;
  }
  
  public cleanup(): void {
    const now = Date.now();
    
    // Clean up expired emitters
    this.activeEmitters.forEach((startTime, emitter) => {
      if (now - startTime > 10000) { // Safety cleanup after 10 seconds
        this.returnEmitterToPool(emitter);
      }
    });
    
    // Clean up expired trails
    this.activeTrails.forEach((trail, trailId) => {
      if (now > trail.duration) {
        this.stopProjectileTrail(trailId);
      }
    });
  }
  
  public pauseEffects(): void {
    // Pause all active emitters
    this.activeEmitters.forEach((_, emitter) => {
      emitter.pause();
    });
    
    // Pause environmental effects
    this.environmentalEmitters.forEach(emitter => {
      emitter.pause();
    });
  }
  
  public resumeEffects(): void {
    // Resume all active emitters
    this.activeEmitters.forEach((_, emitter) => {
      emitter.resume();
    });
    
    // Resume environmental effects
    this.environmentalEmitters.forEach(emitter => {
      emitter.resume();
    });
  }
  
  public destroy(): void {
    // Stop all screen effects
    if (this.slowMotionActive) {
      this.scene.physics.world.timeScale = 1;
      this.scene.tweens.timeScale = 1;
      this.slowMotionActive = false;
    }
    
    // Clean up trails
    this.activeTrails.forEach((_, trailId) => {
      this.stopProjectileTrail(trailId);
    });
    
    // Stop environmental effects
    this.stopEnvironmentalEffects();
    
    // Return all active emitters to pool
    this.activeEmitters.forEach((_, emitter) => {
      this.returnEmitterToPool(emitter);
    });
    
    // Destroy all emitters
    this.particleEmitterPool.forEach(emitter => {
      emitter.destroy();
    });
    
    // Clear all data structures
    this.particleEmitterPool = [];
    this.activeEmitters.clear();
    this.activeTrails.clear();
    this.environmentalEmitters = [];
    this.effectConfigs.clear();
  }
}