import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DifficultyManager, DifficultyLevel } from '../DifficultyManager';
import { mockPhaser } from '../../test/mocks/phaser.mock';

describe('DifficultyManager', () => {
  let difficultyManager: DifficultyManager;
  let mockScene: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    mockScene = new mockPhaser.Scene();
    mockScene.time = {
      addEvent: vi.fn().mockReturnValue({ destroy: vi.fn() }),
      delayedCall: vi.fn().mockReturnValue({ destroy: vi.fn() })
    };
    mockScene.cameras = {
      main: {
        flash: vi.fn(),
        shake: vi.fn(),
        setBackgroundColor: vi.fn(),
        backgroundColor: { color: 0x000000 }
      }
    };
    mockScene.tweens = {
      add: vi.fn()
    };
    mockScene.sound = {
      get: vi.fn().mockReturnValue(true),
      play: vi.fn()
    };
    mockScene.events = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn()
    };
    
    difficultyManager = new DifficultyManager(mockScene);
  });

  describe('initialization', () => {
    it('should initialize with EASY difficulty', () => {
      expect(difficultyManager.getCurrentDifficulty()).toBe(DifficultyLevel.EASY);
    });
    
    it('should set up timers for difficulty checks', () => {
      expect(mockScene.time.addEvent).toHaveBeenCalledTimes(2);
      expect(mockScene.time.addEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          delay: 1000,
          loop: true
        })
      );
      expect(mockScene.time.addEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          delay: 5000,
          loop: true
        })
      );
    });
    
    it('should set up event listeners', () => {
      expect(mockScene.events.on).toHaveBeenCalledWith('scoreChanged', expect.any(Function), difficultyManager);
      expect(mockScene.events.on).toHaveBeenCalledWith('lifeLost', expect.any(Function), difficultyManager);
      expect(mockScene.events.on).toHaveBeenCalledWith('streakAchieved', expect.any(Function), difficultyManager);
    });
  });

  describe('time-based difficulty progression', () => {
    it('should increase difficulty to MEDIUM after 30 seconds', () => {
      const emitSpy = vi.spyOn(difficultyManager, 'emit');
      
      // Fast forward 31 seconds
      vi.advanceTimersByTime(31000);
      
      // Manually trigger the timer callback
      const timerCallback = mockScene.time.addEvent.mock.calls[0][0].callback;
      for (let i = 0; i < 31; i++) {
        timerCallback();
      }
      
      expect(difficultyManager.getCurrentDifficulty()).toBe(DifficultyLevel.MEDIUM);
      expect(emitSpy).toHaveBeenCalledWith('difficultyChanged', expect.objectContaining({
        level: DifficultyLevel.MEDIUM,
        trigger: 'time'
      }));
    });
    
    it('should increase difficulty to HARD after 60 seconds', () => {
      // Fast forward 61 seconds
      vi.advanceTimersByTime(61000);
      
      const timerCallback = mockScene.time.addEvent.mock.calls[0][0].callback;
      for (let i = 0; i < 61; i++) {
        timerCallback();
      }
      
      expect(difficultyManager.getCurrentDifficulty()).toBe(DifficultyLevel.HARD);
    });
    
    it('should increase difficulty to NIGHTMARE after 120 seconds', () => {
      // Fast forward 121 seconds
      vi.advanceTimersByTime(121000);
      
      const timerCallback = mockScene.time.addEvent.mock.calls[0][0].callback;
      for (let i = 0; i < 121; i++) {
        timerCallback();
      }
      
      expect(difficultyManager.getCurrentDifficulty()).toBe(DifficultyLevel.NIGHTMARE);
    });
  });

  describe('score-based difficulty progression', () => {
    it('should increase difficulty to MEDIUM at 10 points', () => {
      const scoreChangedCall = mockScene.events.on.mock.calls.find(
        (call: any[]) => call[0] === 'scoreChanged'
      );
      const scoreChangedHandler = scoreChangedCall[1];
      const context = scoreChangedCall[2];
      
      scoreChangedHandler.call(context, 10);
      
      expect(difficultyManager.getCurrentDifficulty()).toBe(DifficultyLevel.MEDIUM);
    });
    
    it('should increase difficulty to HARD at 25 points', () => {
      const scoreChangedCall = mockScene.events.on.mock.calls.find(
        (call: any[]) => call[0] === 'scoreChanged'
      );
      const scoreChangedHandler = scoreChangedCall[1];
      const context = scoreChangedCall[2];
      
      scoreChangedHandler.call(context, 25);
      
      expect(difficultyManager.getCurrentDifficulty()).toBe(DifficultyLevel.HARD);
    });
    
    it('should increase difficulty to NIGHTMARE at 50 points', () => {
      const scoreChangedCall = mockScene.events.on.mock.calls.find(
        (call: any[]) => call[0] === 'scoreChanged'
      );
      const scoreChangedHandler = scoreChangedCall[1];
      const context = scoreChangedCall[2];
      
      scoreChangedHandler.call(context, 50);
      
      expect(difficultyManager.getCurrentDifficulty()).toBe(DifficultyLevel.NIGHTMARE);
    });
    
    it('should not decrease difficulty if score-based is higher than time-based', () => {
      const scoreChangedCall = mockScene.events.on.mock.calls.find(
        (call: any[]) => call[0] === 'scoreChanged'
      );
      const scoreChangedHandler = scoreChangedCall[1];
      const context = scoreChangedCall[2];
      
      // Set difficulty to HARD via score
      scoreChangedHandler.call(context, 25);
      expect(difficultyManager.getCurrentDifficulty()).toBe(DifficultyLevel.HARD);
      
      // Try to set lower difficulty via time (should not work)
      const timerCallback = mockScene.time.addEvent.mock.calls[0][0].callback;
      for (let i = 0; i < 31; i++) {
        timerCallback();
      }
      
      // Should still be HARD, not MEDIUM
      expect(difficultyManager.getCurrentDifficulty()).toBe(DifficultyLevel.HARD);
    });
  });

  describe('difficulty configuration', () => {
    it('should return correct configuration for each difficulty level', () => {
      const easyConfig = difficultyManager.getDifficultyConfig();
      expect(easyConfig.spawnRateMultiplier).toBe(1.0);
      expect(easyConfig.speedMultiplier).toBe(1.0);
      expect(easyConfig.displayName).toBe('Leisurely Stroll');
      
      difficultyManager.forceDifficulty(DifficultyLevel.NIGHTMARE);
      const nightmareConfig = difficultyManager.getDifficultyConfig();
      expect(nightmareConfig.spawnRateMultiplier).toBe(3.0);
      expect(nightmareConfig.speedMultiplier).toBe(2.0);
      expect(nightmareConfig.displayName).toBe('Nightmare Descent');
    });
    
    it('should return correct multipliers', () => {
      expect(difficultyManager.getSpeedMultiplier()).toBe(1.0);
      expect(difficultyManager.getHazardVariety()).toBe(1);
      expect(difficultyManager.getAssassinAggressiveness()).toBe(1.0);
      
      difficultyManager.forceDifficulty(DifficultyLevel.HARD);
      expect(difficultyManager.getSpeedMultiplier()).toBe(1.5);
      expect(difficultyManager.getHazardVariety()).toBe(3);
      expect(difficultyManager.getAssassinAggressiveness()).toBe(1.5);
    });
  });

  describe('visual and audio feedback', () => {
    it('should trigger visual effects on difficulty change', () => {
      difficultyManager.forceDifficulty(DifficultyLevel.MEDIUM);
      
      expect(mockScene.cameras.main.flash).toHaveBeenCalledWith(500, 255, 255, 255, false);
      expect(mockScene.tweens.add).toHaveBeenCalled();
    });
    
    it('should trigger screen shake for nightmare mode', () => {
      difficultyManager.forceDifficulty(DifficultyLevel.NIGHTMARE);
      
      expect(mockScene.cameras.main.shake).toHaveBeenCalledWith(300, 0.01);
    });
    
    it('should play audio feedback on difficulty increase', () => {
      difficultyManager.forceDifficulty(DifficultyLevel.MEDIUM);
      
      expect(mockScene.sound.play).toHaveBeenCalledWith('difficulty_increase', { volume: 0.5 });
    });
  });

  describe('adaptive difficulty', () => {
    it('should track lives lost', () => {
      const lifeLostCall = mockScene.events.on.mock.calls.find(
        (call: any[]) => call[0] === 'lifeLost'
      );
      const lifeLostHandler = lifeLostCall[1];
      const context = lifeLostCall[2];
      
      lifeLostHandler.call(context);
      lifeLostHandler.call(context);
      
      // The performance metrics are private, but we can test the effect
      const recommendation = (difficultyManager as any).getAdaptiveRecommendation();
      expect(recommendation).toBeLessThan(1.0); // Should recommend easier difficulty
    });
    
    it('should track score gain rate', () => {
      const scoreChangedCall = mockScene.events.on.mock.calls.find(
        (call: any[]) => call[0] === 'scoreChanged'
      );
      const scoreChangedHandler = scoreChangedCall[1];
      const context = scoreChangedCall[2];
      
      scoreChangedHandler.call(context, 0);
      vi.advanceTimersByTime(1000);
      scoreChangedHandler.call(context, 10);
      
      // The score gain rate should be tracked
      const adaptiveCallback = mockScene.time.addEvent.mock.calls[1][0].callback;
      adaptiveCallback();
      
      const emitSpy = vi.spyOn(difficultyManager, 'emit');
      adaptiveCallback();
      
      expect(emitSpy).toHaveBeenCalledWith('adaptiveDifficulty', expect.any(Object));
    });
    
    it('should recommend appropriate difficulty adjustments', () => {
      // First set a difficulty level above EASY to enable adaptive difficulty
      difficultyManager.forceDifficulty(DifficultyLevel.MEDIUM);
      
      const emitSpy = vi.spyOn(difficultyManager, 'emit');
      
      // Trigger adaptive check
      const adaptiveCallback = mockScene.time.addEvent.mock.calls[1][0].callback;
      adaptiveCallback();
      
      expect(emitSpy).toHaveBeenCalledWith('adaptiveDifficulty', expect.objectContaining({
        recommendation: expect.any(Number)
      }));
    });
  });

  describe('difficulty stats', () => {
    it('should track difficulty statistics', () => {
      difficultyManager.forceDifficulty(DifficultyLevel.HARD);
      vi.advanceTimersByTime(5000);
      
      const stats = difficultyManager.getDifficultyStats();
      
      expect(stats.currentLevel).toBe(DifficultyLevel.HARD);
      expect(stats.highestLevelReached).toBe(DifficultyLevel.HARD);
      expect(stats.difficultyChanges).toBe(1);
      expect(stats.timeInDifficulty).toBeGreaterThan(0);
      expect(stats.currentMultipliers.spawnRate).toBeGreaterThan(1);
      expect(stats.currentMultipliers.speed).toBe(1.5);
    });
    
    it('should track highest difficulty reached', () => {
      difficultyManager.forceDifficulty(DifficultyLevel.NIGHTMARE);
      difficultyManager.forceDifficulty(DifficultyLevel.MEDIUM);
      
      const stats = difficultyManager.getDifficultyStats();
      expect(stats.highestLevelReached).toBe(DifficultyLevel.NIGHTMARE);
      expect(stats.currentLevel).toBe(DifficultyLevel.MEDIUM);
    });
  });

  describe('reset functionality', () => {
    it('should reset to initial state', () => {
      difficultyManager.forceDifficulty(DifficultyLevel.HARD);
      const lifeLostCall = mockScene.events.on.mock.calls.find(
        (call: any[]) => call[0] === 'lifeLost'
      );
      const lifeLostHandler = lifeLostCall[1];
      const context = lifeLostCall[2];
      lifeLostHandler.call(context);
      
      difficultyManager.reset();
      
      expect(difficultyManager.getCurrentDifficulty()).toBe(DifficultyLevel.EASY);
      const stats = difficultyManager.getDifficultyStats();
      expect(stats.difficultyChanges).toBe(0);
      expect(mockScene.cameras.main.setBackgroundColor).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      const timer1 = { destroy: vi.fn() };
      const timer2 = { destroy: vi.fn() };
      mockScene.time.addEvent
        .mockReturnValueOnce(timer1)
        .mockReturnValueOnce(timer2);
      
      const manager = new DifficultyManager(mockScene);
      const removeAllListenersSpy = vi.spyOn(manager, 'removeAllListeners');
      
      manager.destroy();
      
      expect(timer1.destroy).toHaveBeenCalled();
      expect(timer2.destroy).toHaveBeenCalled();
      expect(mockScene.events.off).toHaveBeenCalledTimes(3);
      expect(removeAllListenersSpy).toHaveBeenCalled();
    });
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
});