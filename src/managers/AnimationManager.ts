import Phaser from 'phaser';

interface AnimationConfig {
  key: string;
  frames: string[] | { key: string; frame?: string | number }[];
  frameRate: number;
  repeat: number;
  yoyo?: boolean;
  delay?: number;
  repeatDelay?: number;
}

interface AnimationSequence {
  animations: string[];
  currentIndex: number;
  loop: boolean;
  onComplete?: () => void;
}

interface TweenAnimation {
  target: Phaser.GameObjects.GameObject;
  tween: Phaser.Tweens.Tween;
  type: string;
}

export class AnimationManager {
  private scene: Phaser.Scene;
  private animationConfigs: Map<string, AnimationConfig> = new Map();
  private activeSequences: Map<string, AnimationSequence> = new Map();
  private activeTweens: Map<string, TweenAnimation> = new Map();
  private globalAnimationSpeed: number = 1.0;
  private animationQuality: number = 2; // 0=low, 1=medium, 2=high

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupCoreAnimations();
  }

  private setupCoreAnimations(): void {
    // Player animations
    this.registerAnimation({
      key: 'player-idle',
      frames: ['player-down'],
      frameRate: 1,
      repeat: -1
    });

    this.registerAnimation({
      key: 'player-moving-left',
      frames: ['player-left'],
      frameRate: 8,
      repeat: 0
    });

    this.registerAnimation({
      key: 'player-moving-right',
      frames: ['player-right'],
      frameRate: 8,
      repeat: 0
    });

    this.registerAnimation({
      key: 'player-shooting',
      frames: ['player-up'],
      frameRate: 10,
      repeat: 0
    });

    this.registerAnimation({
      key: 'player-hit',
      frames: ['player-down'],
      frameRate: 8,
      repeat: 3,
      yoyo: true
    });

    // Entity animations
    this.registerAnimation({
      key: 'stroller-rolling',
      frames: ['stroller-1', 'stroller-2', 'stroller-3'],
      frameRate: 6,
      repeat: -1
    });

    this.registerAnimation({
      key: 'hazard-lawnmower-active',
      frames: ['hazard-lawnmower'],
      frameRate: 12,
      repeat: -1,
      yoyo: true
    });

    this.registerAnimation({
      key: 'vip-idle',
      frames: ['vip'],
      frameRate: 2,
      repeat: -1,
      yoyo: true
    });

    this.registerAnimation({
      key: 'assassin-moving',
      frames: ['assassin'],
      frameRate: 8,
      repeat: -1
    });

    // Power-up animations
    this.registerAnimation({
      key: 'powerup-shield-glow',
      frames: ['powerup-shield'],
      frameRate: 4,
      repeat: -1,
      yoyo: true
    });

    this.registerAnimation({
      key: 'powerup-speed-pulse',
      frames: ['powerup-speed'],
      frameRate: 6,
      repeat: -1,
      yoyo: true
    });

    this.registerAnimation({
      key: 'powerup-multi-spin',
      frames: ['powerup-multi'],
      frameRate: 8,
      repeat: -1
    });
  }

  public registerAnimation(config: AnimationConfig): void {
    this.animationConfigs.set(config.key, config);

    // Create Phaser animation if scene has anims manager
    if (this.scene.anims) {
      const phaserFrames = config.frames.map(frame => {
        if (typeof frame === 'string') {
          return { key: frame };
        }
        return frame;
      });

      this.scene.anims.create({
        key: config.key,
        frames: phaserFrames,
        frameRate: config.frameRate * this.globalAnimationSpeed,
        repeat: config.repeat,
        yoyo: config.yoyo || false,
        delay: config.delay || 0,
        repeatDelay: config.repeatDelay || 0
      });
    }
  }

  public playAnimation(sprite: Phaser.GameObjects.Sprite, animationKey: string, ignoreIfPlaying: boolean = false): boolean {
    if (!sprite || !this.animationConfigs.has(animationKey)) {
      return false;
    }

    try {
      sprite.play(animationKey, ignoreIfPlaying);
      return true;
    } catch (error) {
      console.warn(`Failed to play animation: ${animationKey}`, error);
      return false;
    }
  }

  public createAnimationSequence(
    sprite: Phaser.GameObjects.Sprite,
    animations: string[],
    loop: boolean = false,
    onComplete?: () => void
  ): string {
    const sequenceId = `seq_${Date.now()}_${Math.random()}`;
    
    const sequence: AnimationSequence = {
      animations,
      currentIndex: 0,
      loop,
      onComplete
    };

    this.activeSequences.set(sequenceId, sequence);
    this.playSequenceStep(sprite, sequenceId);

    return sequenceId;
  }

  private playSequenceStep(sprite: Phaser.GameObjects.Sprite, sequenceId: string): void {
    const sequence = this.activeSequences.get(sequenceId);
    if (!sequence) return;

    const currentAnimation = sequence.animations[sequence.currentIndex];
    if (!currentAnimation) return;

    // Listen for animation complete
    sprite.once('animationcomplete', () => {
      sequence.currentIndex++;

      if (sequence.currentIndex >= sequence.animations.length) {
        if (sequence.loop) {
          sequence.currentIndex = 0;
          this.playSequenceStep(sprite, sequenceId);
        } else {
          this.activeSequences.delete(sequenceId);
          sequence.onComplete?.();
        }
      } else {
        this.playSequenceStep(sprite, sequenceId);
      }
    });

    this.playAnimation(sprite, currentAnimation);
  }

  public stopAnimationSequence(sequenceId: string): void {
    this.activeSequences.delete(sequenceId);
  }

  // Tween-based animations
  public createTweenAnimation(
    target: Phaser.GameObjects.GameObject,
    properties: any,
    duration: number,
    ease: string = 'Power2',
    delay: number = 0,
    onComplete?: () => void
  ): string {
    const animId = `tween_${Date.now()}_${Math.random()}`;
    
    const tween = this.scene.tweens.add({
      targets: target,
      ...properties,
      duration: duration / this.globalAnimationSpeed,
      ease,
      delay,
      onComplete: () => {
        this.activeTweens.delete(animId);
        onComplete?.();
      }
    });

    this.activeTweens.set(animId, {
      target,
      tween,
      type: 'basic'
    });

    return animId;
  }

  public createBounceAnimation(target: Phaser.GameObjects.GameObject, strength: number = 0.2, duration: number = 300): string {
    const animId = `bounce_${Date.now()}_${Math.random()}`;
    
    // Type check for objects with scale properties
    if (!('scaleX' in target) || !('setScale' in target)) {
      console.warn('Target object does not support scale animations');
      return animId;
    }
    
    const transformTarget = target as any;
    const originalScale = transformTarget.scaleX;

    const tween = this.scene.tweens.add({
      targets: target,
      scaleX: originalScale + strength,
      scaleY: originalScale + strength,
      duration: duration / 2 / this.globalAnimationSpeed,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete: () => {
        transformTarget.setScale(originalScale);
        this.activeTweens.delete(animId);
      }
    });

    this.activeTweens.set(animId, {
      target,
      tween,
      type: 'bounce'
    });

    return animId;
  }

  public createShakeAnimation(target: Phaser.GameObjects.GameObject, intensity: number = 5, duration: number = 200): string {
    const animId = `shake_${Date.now()}_${Math.random()}`;
    
    // Type check for objects with position properties
    if (!('x' in target) || !('y' in target) || !('setPosition' in target)) {
      console.warn('Target object does not support position animations');
      return animId;
    }
    
    const transformTarget = target as any;
    const originalX = transformTarget.x;
    const originalY = transformTarget.y;

    let shakeCount = 0;
    const maxShakes = Math.floor(duration / 50);

    const shakeStep = () => {
      if (shakeCount >= maxShakes) {
        transformTarget.setPosition(originalX, originalY);
        this.activeTweens.delete(animId);
        return;
      }

      const offsetX = (Math.random() - 0.5) * intensity * 2;
      const offsetY = (Math.random() - 0.5) * intensity * 2;

      const tween = this.scene.tweens.add({
        targets: target,
        x: originalX + offsetX,
        y: originalY + offsetY,
        duration: 50 / this.globalAnimationSpeed,
        ease: 'Power1',
        onComplete: () => {
          shakeCount++;
          shakeStep();
        }
      });
    };

    shakeStep();
    return animId;
  }

  public createPulseAnimation(
    target: Phaser.GameObjects.GameObject,
    scale: number = 1.2,
    duration: number = 800,
    repeat: number = -1
  ): string {
    const animId = `pulse_${Date.now()}_${Math.random()}`;
    
    // Type check for objects with scale properties
    if (!('scaleX' in target) || !('setScale' in target)) {
      console.warn('Target object does not support scale animations');
      return animId;
    }
    
    const transformTarget = target as any;
    const originalScale = transformTarget.scaleX;

    const tween = this.scene.tweens.add({
      targets: target,
      scaleX: scale,
      scaleY: scale,
      duration: duration / 2 / this.globalAnimationSpeed,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat,
      onComplete: () => {
        if (repeat !== -1) {
          transformTarget.setScale(originalScale);
          this.activeTweens.delete(animId);
        }
      }
    });

    this.activeTweens.set(animId, {
      target,
      tween,
      type: 'pulse'
    });

    return animId;
  }

  public createFloatAnimation(
    target: Phaser.GameObjects.GameObject,
    distance: number = 10,
    duration: number = 2000
  ): string {
    const animId = `float_${Date.now()}_${Math.random()}`;
    
    // Type check for objects with position properties
    if (!('y' in target)) {
      console.warn('Target object does not support position animations');
      return animId;
    }
    
    const transformTarget = target as any;
    const originalY = transformTarget.y;

    const tween = this.scene.tweens.add({
      targets: target,
      y: originalY - distance,
      duration: duration / 2 / this.globalAnimationSpeed,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    this.activeTweens.set(animId, {
      target,
      tween,
      type: 'float'
    });

    return animId;
  }

  public createFadeAnimation(
    target: Phaser.GameObjects.GameObject,
    targetAlpha: number,
    duration: number = 500,
    onComplete?: () => void
  ): string {
    const animId = `fade_${Date.now()}_${Math.random()}`;

    const tween = this.scene.tweens.add({
      targets: target,
      alpha: targetAlpha,
      duration: duration / this.globalAnimationSpeed,
      ease: 'Power2',
      onComplete: () => {
        this.activeTweens.delete(animId);
        onComplete?.();
      }
    });

    this.activeTweens.set(animId, {
      target,
      tween,
      type: 'fade'
    });

    return animId;
  }

  public stopAnimation(animationId: string): void {
    const tweenAnimation = this.activeTweens.get(animationId);
    if (tweenAnimation) {
      tweenAnimation.tween.stop();
      this.activeTweens.delete(animationId);
    }

    this.stopAnimationSequence(animationId);
  }

  public stopAllAnimationsForTarget(target: Phaser.GameObjects.GameObject): void {
    // Stop all tweens for target
    this.activeTweens.forEach((animation, animId) => {
      if (animation.target === target) {
        animation.tween.stop();
        this.activeTweens.delete(animId);
      }
    });

    // Stop sprite animations if it's a sprite
    if (target instanceof Phaser.GameObjects.Sprite) {
      target.stop();
    }
  }

  public setGlobalAnimationSpeed(speed: number): void {
    this.globalAnimationSpeed = Math.max(0.1, Math.min(3.0, speed));
    
    // Update existing animations
    this.activeTweens.forEach(animation => {
      if (animation.tween.isPlaying()) {
        animation.tween.timeScale = this.globalAnimationSpeed;
      }
    });
  }

  public getGlobalAnimationSpeed(): number {
    return this.globalAnimationSpeed;
  }

  public setAnimationQuality(quality: number): void {
    this.animationQuality = Math.max(0, Math.min(2, quality));
    
    // Adjust animation frame rates based on quality
    const qualityMultiplier = this.getQualityMultiplier();
    
    this.animationConfigs.forEach((config, key) => {
      if (this.scene.anims && this.scene.anims.exists(key)) {
        const anim = this.scene.anims.get(key);
        anim.frameRate = config.frameRate * qualityMultiplier * this.globalAnimationSpeed;
      }
    });
  }

  private getQualityMultiplier(): number {
    switch (this.animationQuality) {
      case 0: return 0.5; // Low quality - half frame rate
      case 1: return 0.75; // Medium quality - 3/4 frame rate
      case 2: return 1.0; // High quality - full frame rate
      default: return 1.0;
    }
  }

  public getAnimationQuality(): number {
    return this.animationQuality;
  }

  public pauseAllAnimations(): void {
    // Pause all tweens
    this.activeTweens.forEach(animation => {
      animation.tween.pause();
    });

    // Pause global animation manager
    if (this.scene.anims) {
      this.scene.anims.pauseAll();
    }
  }

  public resumeAllAnimations(): void {
    // Resume all tweens
    this.activeTweens.forEach(animation => {
      animation.tween.resume();
    });

    // Resume global animation manager
    if (this.scene.anims) {
      this.scene.anims.resumeAll();
    }
  }

  public getActiveAnimationCount(): number {
    return this.activeTweens.size + this.activeSequences.size;
  }

  public getAnimationStats(): {
    tweens: number;
    sequences: number;
    registeredAnimations: number;
    globalSpeed: number;
    quality: number;
  } {
    return {
      tweens: this.activeTweens.size,
      sequences: this.activeSequences.size,
      registeredAnimations: this.animationConfigs.size,
      globalSpeed: this.globalAnimationSpeed,
      quality: this.animationQuality
    };
  }

  public destroy(): void {
    // Stop all active tweens
    this.activeTweens.forEach(animation => {
      animation.tween.stop();
    });

    // Clear all data structures
    this.activeTweens.clear();
    this.activeSequences.clear();
    this.animationConfigs.clear();
  }
}