import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoreManager } from '../ScoreManager';
import { mockPhaser } from '../../test/mocks/phaser.mock';

describe('ScoreManager', () => {
  let scoreManager: ScoreManager;
  let mockScene: any;

  beforeEach(() => {
    mockScene = new mockPhaser.Scene();
    scoreManager = new ScoreManager(mockScene);
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with score 0', () => {
      expect(scoreManager.getScore()).toBe(0);
    });

    it('should initialize with streak 0', () => {
      expect(scoreManager.getStreak()).toBe(0);
    });

    it('should load high score from localStorage', () => {
      // Reset the mock first
      localStorage.getItem = vi.fn().mockReturnValue('500');
      const newScoreManager = new ScoreManager(mockScene);
      expect(newScoreManager.getHighScore()).toBe(500);
    });

    it('should handle missing localStorage gracefully', () => {
      localStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      const newScoreManager = new ScoreManager(mockScene);
      expect(newScoreManager.getHighScore()).toBe(0);
    });
  });

  describe('score management', () => {
    it('should add positive points correctly', () => {
      scoreManager.addPoints(10);
      expect(scoreManager.getScore()).toBe(10);
      
      scoreManager.addPoints(5);
      expect(scoreManager.getScore()).toBe(15);
    });

    it('should subtract negative points correctly', () => {
      scoreManager.addPoints(20);
      scoreManager.addPoints(-5);
      expect(scoreManager.getScore()).toBe(15);
    });

    it('should not allow score to go below 0', () => {
      scoreManager.addPoints(-10);
      expect(scoreManager.getScore()).toBe(0);
    });

    it('should emit scoreChanged event when score changes', () => {
      const emitSpy = vi.spyOn(scoreManager.getEvents(), 'emit');
      scoreManager.addPoints(10);
      expect(emitSpy).toHaveBeenCalledWith('scoreChanged', 10, 0);
    });

    it('should update high score when current score exceeds it', () => {
      scoreManager.addPoints(100);
      expect(scoreManager.getHighScore()).toBe(100);
      
      scoreManager.addPoints(50);
      expect(scoreManager.getHighScore()).toBe(150);
    });

    it('should save high score to localStorage', () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem');
      scoreManager.addPoints(100);
      expect(setItemSpy).toHaveBeenCalledWith('stairwaySprintHighScore', '100');
    });

    it('should emit newHighScore event when high score is beaten', () => {
      const emitSpy = vi.spyOn(scoreManager.getEvents(), 'emit');
      scoreManager.addPoints(100);
      expect(emitSpy).toHaveBeenCalledWith('newHighScore', 100);
    });
  });

  describe('streak management', () => {
    it('should increment streak correctly', () => {
      scoreManager.addStreak();
      expect(scoreManager.getStreak()).toBe(1);
      
      scoreManager.addStreak();
      expect(scoreManager.getStreak()).toBe(2);
    });

    it('should reset streak after 10', () => {
      for (let i = 0; i < 10; i++) {
        scoreManager.addStreak();
      }
      expect(scoreManager.getStreak()).toBe(0);
    });

    it('should add bonus points for perfect streak', () => {
      for (let i = 0; i < 9; i++) {
        scoreManager.addStreak();
      }
      expect(scoreManager.getScore()).toBe(0);
      
      scoreManager.addStreak(); // 10th streak
      expect(scoreManager.getScore()).toBe(10); // Bonus points
    });

    it('should emit perfectStreak event after 10 streaks', () => {
      const emitSpy = vi.spyOn(scoreManager.getEvents(), 'emit');
      for (let i = 0; i < 10; i++) {
        scoreManager.addStreak();
      }
      expect(emitSpy).toHaveBeenCalledWith('perfectStreak');
    });

    it('should emit streakChanged event when streak changes', () => {
      const emitSpy = vi.spyOn(scoreManager.getEvents(), 'emit');
      scoreManager.addStreak();
      expect(emitSpy).toHaveBeenCalledWith('streakChanged', 1);
    });

    it('should reset streak to 0', () => {
      scoreManager.addStreak();
      scoreManager.addStreak();
      expect(scoreManager.getStreak()).toBe(2);
      
      scoreManager.resetStreak();
      expect(scoreManager.getStreak()).toBe(0);
    });
  });

  describe('display compatibility', () => {
    it('should create high score display for compatibility', () => {
      scoreManager.createDisplay(20, 20);
      
      // Only high score text is created, other displays handled by UIManager
      expect(mockScene.add.text).toHaveBeenCalledTimes(1);
      expect(mockScene.add.text).toHaveBeenCalledWith(20, 95, 'High: 0', expect.any(Object));
    });

    it('should emit events for UI updates', () => {
      const scoreChangedSpy = vi.fn();
      const streakChangedSpy = vi.fn();
      
      scoreManager.getEvents().on('scoreChanged', scoreChangedSpy);
      scoreManager.getEvents().on('streakChanged', streakChangedSpy);
      
      scoreManager.addPoints(100);
      scoreManager.addStreak();
      
      expect(scoreChangedSpy).toHaveBeenCalledWith(100, 0); // current score, previous score
      expect(streakChangedSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('reset functionality', () => {
    it('should reset score and streak but not high score', () => {
      scoreManager.addPoints(100);
      scoreManager.addStreak();
      scoreManager.addStreak();
      
      scoreManager.reset();
      
      expect(scoreManager.getScore()).toBe(0);
      expect(scoreManager.getStreak()).toBe(0);
      expect(scoreManager.getHighScore()).toBe(100);
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      scoreManager.createDisplay(20, 20);
      const removeAllListenersSpy = vi.spyOn(scoreManager.getEvents(), 'removeAllListeners');
      
      scoreManager.destroy();
      
      expect(removeAllListenersSpy).toHaveBeenCalled();
    });
  });
});