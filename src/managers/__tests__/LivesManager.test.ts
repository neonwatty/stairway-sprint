import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LivesManager } from '../LivesManager';
import { mockPhaser } from '../../test/mocks/phaser.mock';

describe('LivesManager', () => {
  let livesManager: LivesManager;
  let mockScene: any;

  beforeEach(() => {
    mockScene = new mockPhaser.Scene();
    livesManager = new LivesManager(mockScene, 3);
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with specified number of lives', () => {
      expect(livesManager.getLives()).toBe(3);
      expect(livesManager.getMaxLives()).toBe(3);
    });

    it('should allow custom starting lives', () => {
      const customLivesManager = new LivesManager(mockScene, 5);
      expect(customLivesManager.getLives()).toBe(5);
      expect(customLivesManager.getMaxLives()).toBe(5);
    });

    it('should not be invincible on initialization', () => {
      expect(livesManager.isInvincible()).toBe(false);
    });
  });

  describe('life management', () => {
    it('should lose a life correctly', () => {
      const result = livesManager.loseLife();
      expect(livesManager.getLives()).toBe(2);
      expect(result).toBe(false); // Not game over
    });

    it('should emit lifeChanged event when losing life', () => {
      const emitSpy = vi.spyOn(livesManager.getEvents(), 'emit');
      livesManager.loseLife();
      expect(emitSpy).toHaveBeenCalledWith('lifeChanged', 2);
    });

    it('should return true when losing last life', () => {
      // Disable invincibility for testing
      (livesManager as any).invincible = false;
      livesManager.loseLife();
      (livesManager as any).invincible = false;
      livesManager.loseLife();
      (livesManager as any).invincible = false;
      const result = livesManager.loseLife();
      expect(result).toBe(true);
      expect(livesManager.getLives()).toBe(0);
    });

    it('should emit gameOver event when losing last life', () => {
      // Disable invincibility for testing
      (livesManager as any).invincible = false;
      livesManager.loseLife();
      (livesManager as any).invincible = false;
      livesManager.loseLife();
      (livesManager as any).invincible = false;
      const emitSpy = vi.spyOn(livesManager.getEvents(), 'emit');
      livesManager.loseLife();
      expect(emitSpy).toHaveBeenCalledWith('gameOver');
    });

    it('should not lose life when invincible', () => {
      // Manually set invincibility for testing
      (livesManager as any).invincible = true;
      const result = livesManager.loseLife();
      expect(livesManager.getLives()).toBe(3);
      expect(result).toBe(false);
    });

    it('should not go below 0 lives', () => {
      // Disable invincibility for testing
      (livesManager as any).invincible = false;
      livesManager.loseLife();
      (livesManager as any).invincible = false;
      livesManager.loseLife();
      (livesManager as any).invincible = false;
      livesManager.loseLife();
      (livesManager as any).invincible = false;
      livesManager.loseLife(); // Extra call
      expect(livesManager.getLives()).toBe(0);
    });

    it('should add life correctly', () => {
      livesManager.loseLife();
      livesManager.addLife();
      expect(livesManager.getLives()).toBe(3);
    });

    it('should not exceed max lives', () => {
      livesManager.addLife();
      expect(livesManager.getLives()).toBe(3);
    });

    it('should emit lifeChanged event when gaining life', () => {
      livesManager.loseLife();
      const emitSpy = vi.spyOn(livesManager.getEvents(), 'emit');
      livesManager.addLife();
      expect(emitSpy).toHaveBeenCalledWith('lifeChanged', 3);
    });
  });

  describe('invincibility', () => {
    it('should start invincibility after losing life', () => {
      const emitSpy = vi.spyOn(livesManager.getEvents(), 'emit');
      livesManager.loseLife();
      expect(emitSpy).toHaveBeenCalledWith('invincibilityStart');
    });

    it('should end invincibility after duration', async () => {
      vi.useFakeTimers();
      const emitSpy = vi.spyOn(livesManager.getEvents(), 'emit');
      
      livesManager.loseLife();
      expect(livesManager.isInvincible()).toBe(true);
      
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();
      
      expect(emitSpy).toHaveBeenCalledWith('invincibilityEnd');
      expect(livesManager.isInvincible()).toBe(false);
      
      vi.useRealTimers();
    });
  });

  describe('display compatibility', () => {
    it('should maintain createDisplay method for compatibility', () => {
      // This method now does nothing as display is handled by UIManager
      // But it should exist and not throw errors
      expect(() => livesManager.createDisplay(100, 50)).not.toThrow();
    });

    it('should emit events when lives change for UI updates', () => {
      const lifeChangedSpy = vi.fn();
      livesManager.getEvents().on('lifeChanged', lifeChangedSpy);
      
      livesManager.loseLife();
      
      expect(lifeChangedSpy).toHaveBeenCalledWith(2);
    });
  });

  describe('animations', () => {
    it('should play life loss animation with camera effects', () => {
      livesManager.loseLife();
      
      expect(mockScene.cameras.main.shake).toHaveBeenCalledWith(300, 0.02);
      expect(mockScene.cameras.main.flash).toHaveBeenCalledWith(300, 255, 0, 0);
    });

    it('should not play camera effects on final life loss', () => {
      livesManager.loseLife(); // 2 lives left
      livesManager.loseLife(); // 1 life left
      
      // Clear previous calls
      mockScene.cameras.main.shake.mockClear();
      mockScene.cameras.main.flash.mockClear();
      
      livesManager.loseLife(); // Final life - game over
      
      // Should not trigger camera effects on game over
      expect(mockScene.cameras.main.shake).not.toHaveBeenCalled();
      expect(mockScene.cameras.main.flash).not.toHaveBeenCalled();
    });

    it('should play life gain animation with particles', () => {
      livesManager.loseLife(); // Now has 2 lives
      livesManager.addLife();  // Back to 3 lives, should trigger animation
      
      expect(mockScene.add.particles).toHaveBeenCalledWith(
        320, 480, 'star',
        expect.objectContaining({
          speed: { min: 100, max: 200 },
          scale: { start: 0.5, end: 0 },
          lifespan: 500,
          quantity: 10,
          tint: 0xff69b4
        })
      );
    });
  });

  describe('reset functionality', () => {
    it('should reset lives to maximum', () => {
      livesManager.loseLife();
      livesManager.loseLife();
      livesManager.reset();
      
      expect(livesManager.getLives()).toBe(3);
      expect(livesManager.isInvincible()).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      livesManager.createDisplay(100, 50);
      const removeAllListenersSpy = vi.spyOn(livesManager.getEvents(), 'removeAllListeners');
      
      livesManager.destroy();
      
      expect(removeAllListenersSpy).toHaveBeenCalled();
    });
  });
});