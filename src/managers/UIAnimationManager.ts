import Phaser from 'phaser';

interface UIAnimation {
  target: Phaser.GameObjects.GameObject;
  tween: Phaser.Tweens.Tween;
  type: string;
  id: string;
}

interface NumberRollConfig {
  target: Phaser.GameObjects.Text;
  from: number;
  to: number;
  duration: number;
  prefix?: string;
  suffix?: string;
  onUpdate?: (value: number) => void;
  onComplete?: () => void;
}

interface PopupConfig {
  text: string;
  x: number;
  y: number;
  style?: Phaser.Types.GameObjects.Text.TextStyle;
  duration?: number;
  animationType?: 'bounce' | 'slide' | 'fade' | 'zoom';
  direction?: 'up' | 'down' | 'left' | 'right';
}

export class UIAnimationManager {
  private scene: Phaser.Scene;
  private animations: Map<string, UIAnimation> = new Map();
  private popups: Set<Phaser.GameObjects.Container> = new Set();
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  // Button animations
  public animateButtonHover(button: Phaser.GameObjects.GameObject, scale: number = 1.1): string {
    const animId = this.generateAnimId('hover');
    
    // Type guard for scale properties
    if (!('scaleX' in button) || !('setScale' in button)) {
      console.warn('Button does not support scale animations');
      return animId;
    }
    
    const scaleTarget = button as any;
    const originalScale = scaleTarget.scaleX;
    
    const tween = this.scene.tweens.add({
      targets: button,
      scaleX: scale,
      scaleY: scale,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.animations.delete(animId);
      }
    });
    
    this.animations.set(animId, { target: button, tween, type: 'hover', id: animId });
    return animId;
  }
  
  public animateButtonPress(button: Phaser.GameObjects.GameObject): string {
    const animId = this.generateAnimId('press');
    
    // Type guard for scale properties
    if (!('scaleX' in button) || !('setScale' in button)) {
      console.warn('Button does not support scale animations');
      return animId;
    }
    
    const scaleTarget = button as any;
    const originalScale = scaleTarget.scaleX;
    
    const tween = this.scene.tweens.add({
      targets: button,
      scaleX: originalScale * 0.95,
      scaleY: originalScale * 0.95,
      duration: 100,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        scaleTarget.setScale(originalScale);
        this.animations.delete(animId);
      }
    });
    
    this.animations.set(animId, { target: button, tween, type: 'press', id: animId });
    return animId;
  }
  
  public createFocusRing(button: Phaser.GameObjects.GameObject, color: number = 0x00ff00): Phaser.GameObjects.Graphics {
    // Type guard for objects with bounds
    const buttonWithBounds = button as any;
    const bounds = buttonWithBounds.getBounds ? buttonWithBounds.getBounds() : { x: 0, y: 0, width: 100, height: 50 };
    const graphics = this.scene.add.graphics();
    
    graphics.lineStyle(3, color, 0);
    graphics.strokeRoundedRect(
      bounds.x - 5,
      bounds.y - 5,
      bounds.width + 10,
      bounds.height + 10,
      8
    );
    
    // Animate the focus ring
    this.scene.tweens.add({
      targets: graphics,
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Power2'
    });
    
    // Pulsing effect
    this.scene.tweens.add({
      targets: graphics,
      alpha: { from: 1, to: 0.6 },
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: 300
    });
    
    return graphics;
  }
  
  public createRippleEffect(x: number, y: number, color: number = 0xffffff, maxRadius: number = 100): void {
    const ripple = this.scene.add.graphics();
    ripple.lineStyle(2, color, 0.8);
    
    let radius = 0;
    
    this.scene.tweens.add({
      targets: { radius: 0 },
      radius: maxRadius,
      alpha: { from: 0.8, to: 0 },
      duration: 600,
      ease: 'Power2',
      onUpdate: (tween) => {
        const value = tween.getValue();
        ripple.clear();
        ripple.lineStyle(2, color, 0.8 * (1 - value / maxRadius));
        ripple.strokeCircle(x, y, value);
      },
      onComplete: () => {
        ripple.destroy();
      }
    });
  }
  
  // Number animations
  public animateNumberRoll(config: NumberRollConfig): string {
    const animId = this.generateAnimId('numberRoll');
    const { target, from, to, duration, prefix = '', suffix = '', onUpdate, onComplete } = config;
    
    const tween = this.scene.tweens.addCounter({
      from,
      to,
      duration,
      ease: 'Power2',
      onUpdate: (tween) => {
        const value = Math.floor(tween.getValue());
        target.setText(`${prefix}${value}${suffix}`);
        onUpdate?.(value);
      },
      onComplete: () => {
        target.setText(`${prefix}${to}${suffix}`);
        this.animations.delete(animId);
        onComplete?.();
      }
    });
    
    this.animations.set(animId, { 
      target: target as Phaser.GameObjects.GameObject, 
      tween, 
      type: 'numberRoll', 
      id: animId 
    });
    
    return animId;
  }
  
  public createDamageNumber(x: number, y: number, damage: number, color: number = 0xff0000): void {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    };
    
    const text = this.scene.add.text(x, y, `-${damage}`, style);
    text.setOrigin(0.5);
    text.setDepth(1000);
    
    // Animate upward and fade
    this.scene.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
    
    // Scale pop
    this.scene.tweens.add({
      targets: text,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 200,
      ease: 'Back.easeOut',
      yoyo: true
    });
  }
  
  // Popup system
  public createPopup(config: PopupConfig): Phaser.GameObjects.Container {
    const {
      text,
      x,
      y,
      style = {},
      duration = 2000,
      animationType = 'bounce',
      direction = 'up'
    } = config;
    
    // Default style
    const defaultStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
      align: 'center'
    };
    
    const finalStyle = { ...defaultStyle, ...style };
    
    // Create container
    const container = this.scene.add.container(x, y);
    container.setDepth(1000);
    
    // Create text
    const textObj = this.scene.add.text(0, 0, text, finalStyle);
    textObj.setOrigin(0.5);
    container.add(textObj);
    
    // Track popup
    this.popups.add(container);
    
    // Apply animation based on type
    switch (animationType) {
      case 'bounce':
        this.animatePopupBounce(container, duration);
        break;
      case 'slide':
        this.animatePopupSlide(container, duration, direction);
        break;
      case 'fade':
        this.animatePopupFade(container, duration);
        break;
      case 'zoom':
        this.animatePopupZoom(container, duration);
        break;
    }
    
    return container;
  }
  
  private animatePopupBounce(container: Phaser.GameObjects.Container, duration: number): void {
    container.setScale(0);
    
    // Bounce in
    this.scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    // Float up slightly
    this.scene.tweens.add({
      targets: container,
      y: container.y - 10,
      duration: duration - 600,
      delay: 300,
      ease: 'Sine.easeInOut'
    });
    
    // Fade out
    this.scene.tweens.add({
      targets: container,
      alpha: 0,
      duration: 300,
      delay: duration - 300,
      onComplete: () => {
        this.popups.delete(container);
        container.destroy();
      }
    });
  }
  
  private animatePopupSlide(container: Phaser.GameObjects.Container, duration: number, direction: string): void {
    let startX = container.x;
    let startY = container.y;
    let endX = container.x;
    let endY = container.y;
    
    // Set start position based on direction
    switch (direction) {
      case 'up':
        startY += 50;
        endY -= 50;
        break;
      case 'down':
        startY -= 50;
        endY += 50;
        break;
      case 'left':
        startX += 50;
        endX -= 50;
        break;
      case 'right':
        startX -= 50;
        endX += 50;
        break;
    }
    
    container.setPosition(startX, startY);
    container.setAlpha(0);
    
    // Slide in
    this.scene.tweens.add({
      targets: container,
      x: container.x,
      y: container.y,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });
    
    // Slide out
    this.scene.tweens.add({
      targets: container,
      x: endX,
      y: endY,
      alpha: 0,
      duration: 300,
      delay: duration - 300,
      ease: 'Power2',
      onComplete: () => {
        this.popups.delete(container);
        container.destroy();
      }
    });
  }
  
  private animatePopupFade(container: Phaser.GameObjects.Container, duration: number): void {
    container.setAlpha(0);
    
    // Fade in
    this.scene.tweens.add({
      targets: container,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });
    
    // Fade out
    this.scene.tweens.add({
      targets: container,
      alpha: 0,
      duration: 300,
      delay: duration - 300,
      ease: 'Power2',
      onComplete: () => {
        this.popups.delete(container);
        container.destroy();
      }
    });
  }
  
  private animatePopupZoom(container: Phaser.GameObjects.Container, duration: number): void {
    container.setScale(0);
    container.setAlpha(0);
    
    // Zoom in
    this.scene.tweens.add({
      targets: container,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    });
    
    // Settle
    this.scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 100,
      delay: 200,
      ease: 'Power2'
    });
    
    // Zoom out
    this.scene.tweens.add({
      targets: container,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 200,
      delay: duration - 200,
      ease: 'Power2',
      onComplete: () => {
        this.popups.delete(container);
        container.destroy();
      }
    });
  }
  
  // Heart/Lives animations
  public animateHeartDamage(heart: Phaser.GameObjects.Image): void {
    // Flash red
    heart.setTint(0xff0000);
    
    // Shake
    const originalX = heart.x;
    const originalY = heart.y;
    
    this.scene.tweens.add({
      targets: heart,
      x: originalX + Phaser.Math.Between(-5, 5),
      y: originalY + Phaser.Math.Between(-5, 5),
      duration: 50,
      repeat: 3,
      yoyo: true,
      onComplete: () => {
        heart.setPosition(originalX, originalY);
        heart.clearTint();
      }
    });
    
    // Scale bounce
    this.scene.tweens.add({
      targets: heart,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 200,
      ease: 'Power2',
      yoyo: true
    });
  }
  
  public animateHeartBreak(heart: Phaser.GameObjects.Image): void {
    // Create breaking effect
    const pieces = [];
    const originalX = heart.x;
    const originalY = heart.y;
    
    // Hide original
    heart.setVisible(false);
    
    // Create broken pieces (simplified - in a real game you'd use actual sprites)
    for (let i = 0; i < 4; i++) {
      const piece = this.scene.add.image(originalX, originalY, heart.texture.key);
      piece.setScale(0.5);
      piece.setDepth(heart.depth);
      pieces.push(piece);
      
      // Animate pieces flying apart
      const angle = (i / 4) * Math.PI * 2;
      const distance = 30;
      
      this.scene.tweens.add({
        targets: piece,
        x: originalX + Math.cos(angle) * distance,
        y: originalY + Math.sin(angle) * distance + 20,
        rotation: Phaser.Math.Between(-3, 3),
        alpha: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => piece.destroy()
      });
    }
    
    // Show empty heart after animation
    this.scene.time.delayedCall(300, () => {
      heart.setVisible(true);
      heart.setTexture('heart-empty');
      heart.setAlpha(0.5);
    });
  }
  
  public animateHeartRestore(heart: Phaser.GameObjects.Image): void {
    heart.setTexture('heart-full');
    heart.setScale(0);
    heart.setAlpha(1);
    
    // Grow with bounce
    this.scene.tweens.add({
      targets: heart,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });
    
    // Glow effect
    heart.setTint(0xffff00);
    this.scene.tweens.add({
      targets: heart,
      alpha: { from: 1, to: 0.8 },
      duration: 300,
      yoyo: true,
      repeat: 2,
      onComplete: () => heart.clearTint()
    });
  }
  
  // Menu animations
  public slideInMenu(container: Phaser.GameObjects.Container, direction: 'left' | 'right' | 'top' | 'bottom' = 'left'): void {
    const camera = this.scene.cameras.main;
    let startX = container.x;
    let startY = container.y;
    
    switch (direction) {
      case 'left':
        startX = -container.width;
        break;
      case 'right':
        startX = camera.width + container.width;
        break;
      case 'top':
        startY = -container.height;
        break;
      case 'bottom':
        startY = camera.height + container.height;
        break;
    }
    
    container.setPosition(startX, startY);
    
    this.scene.tweens.add({
      targets: container,
      x: container.x,
      y: container.y,
      duration: 500,
      ease: 'Power2'
    });
  }
  
  public animateButtonStagger(buttons: Phaser.GameObjects.GameObject[], delay: number = 50): void {
    buttons.forEach((button, index) => {
      // Type guard
      if (!('alpha' in button) || !('y' in button)) return;
      
      const target = button as any;
      const originalY = target.y;
      
      target.setAlpha(0);
      target.y = originalY + 20;
      
      this.scene.tweens.add({
        targets: button,
        alpha: 1,
        y: originalY,
        duration: 300,
        delay: index * delay,
        ease: 'Power2'
      });
    });
  }
  
  // Utility methods
  private generateAnimId(type: string): string {
    return `${type}_${Date.now()}_${Math.random()}`;
  }
  
  public stopAnimation(animId: string): void {
    const animation = this.animations.get(animId);
    if (animation) {
      animation.tween.stop();
      this.animations.delete(animId);
    }
  }
  
  public stopAllAnimations(): void {
    this.animations.forEach(animation => {
      animation.tween.stop();
    });
    this.animations.clear();
    
    this.popups.forEach(popup => {
      popup.destroy();
    });
    this.popups.clear();
  }
  
  public destroy(): void {
    this.stopAllAnimations();
  }
}