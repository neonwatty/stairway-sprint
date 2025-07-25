import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStateManager, GameState } from '../GameStateManager';
import { mockPhaser } from '../../test/mocks/phaser.mock';

describe('GameStateManager', () => {
  let gameStateManager: GameStateManager;
  let mockScene: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockScene = new mockPhaser.Scene();
    gameStateManager = new GameStateManager(mockScene);
  });

  describe('initialization', () => {
    it('should initialize with INIT state', () => {
      expect(gameStateManager.getCurrentState()).toBe(GameState.INIT);
    });

    it('should set initial state in scene data', () => {
      expect(mockScene.data.set).toHaveBeenCalledWith('gameState', GameState.INIT);
    });

    it('should have no previous state initially', () => {
      expect(gameStateManager.getPreviousState()).toBeUndefined();
    });
  });

  describe('state transitions', () => {
    it('should change state correctly', () => {
      gameStateManager.changeState(GameState.PLAYING);
      expect(gameStateManager.getCurrentState()).toBe(GameState.PLAYING);
    });

    it('should track previous state', () => {
      gameStateManager.changeState(GameState.PLAYING);
      gameStateManager.changeState(GameState.PAUSED);
      expect(gameStateManager.getPreviousState()).toBe(GameState.PLAYING);
    });

    it('should update scene data on state change', () => {
      gameStateManager.changeState(GameState.PLAYING);
      expect(mockScene.data.set).toHaveBeenCalledWith('gameState', GameState.PLAYING);
    });

    it('should emit stateChanged event', () => {
      const emitSpy = vi.spyOn(gameStateManager.getEvents(), 'emit');
      gameStateManager.changeState(GameState.PLAYING);
      expect(emitSpy).toHaveBeenCalledWith('stateChanged', GameState.PLAYING, GameState.INIT);
    });

    it('should not change state if already in that state', () => {
      gameStateManager.changeState(GameState.PLAYING);
      const emitSpy = vi.spyOn(gameStateManager.getEvents(), 'emit');
      
      gameStateManager.changeState(GameState.PLAYING);
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('state handlers', () => {
    it('should emit initState event when entering INIT state', () => {
      // Change to a different state first
      gameStateManager.changeState(GameState.PLAYING);
      const emitSpy = vi.spyOn(gameStateManager.getEvents(), 'emit');
      gameStateManager.changeState(GameState.INIT);
      expect(emitSpy).toHaveBeenCalledWith('initState');
    });

    it('should emit gameStarted event when entering PLAYING state from non-paused', () => {
      const emitSpy = vi.spyOn(gameStateManager.getEvents(), 'emit');
      gameStateManager.changeState(GameState.PLAYING);
      expect(emitSpy).toHaveBeenCalledWith('gameStarted');
    });

    it('should emit gameResumed event when entering PLAYING state from PAUSED', () => {
      gameStateManager.changeState(GameState.PLAYING);
      gameStateManager.changeState(GameState.PAUSED);
      
      const emitSpy = vi.spyOn(gameStateManager.getEvents(), 'emit');
      gameStateManager.changeState(GameState.PLAYING);
      
      expect(emitSpy).toHaveBeenCalledWith('gameResumed');
      expect(mockScene.physics.resume).toHaveBeenCalled();
    });

    it('should pause physics when entering PAUSED state', () => {
      gameStateManager.changeState(GameState.PAUSED);
      expect(mockScene.physics.pause).toHaveBeenCalled();
    });

    it('should emit gamePaused event when entering PAUSED state', () => {
      const emitSpy = vi.spyOn(gameStateManager.getEvents(), 'emit');
      gameStateManager.changeState(GameState.PAUSED);
      expect(emitSpy).toHaveBeenCalledWith('gamePaused');
    });

    it('should pause physics when entering GAME_OVER state', () => {
      gameStateManager.changeState(GameState.GAME_OVER);
      expect(mockScene.physics.pause).toHaveBeenCalled();
    });

    it('should emit gameEnded event when entering GAME_OVER state', () => {
      const emitSpy = vi.spyOn(gameStateManager.getEvents(), 'emit');
      gameStateManager.changeState(GameState.GAME_OVER);
      expect(emitSpy).toHaveBeenCalledWith('gameEnded');
    });
  });

  describe('state queries', () => {
    it('should correctly report isPlaying state', () => {
      expect(gameStateManager.isPlaying()).toBe(false);
      gameStateManager.changeState(GameState.PLAYING);
      expect(gameStateManager.isPlaying()).toBe(true);
    });

    it('should correctly report isPaused state', () => {
      expect(gameStateManager.isPaused()).toBe(false);
      gameStateManager.changeState(GameState.PAUSED);
      expect(gameStateManager.isPaused()).toBe(true);
    });

    it('should correctly report isGameOver state', () => {
      expect(gameStateManager.isGameOver()).toBe(false);
      gameStateManager.changeState(GameState.GAME_OVER);
      expect(gameStateManager.isGameOver()).toBe(true);
    });

    it('should correctly report canPause', () => {
      expect(gameStateManager.canPause()).toBe(false);
      gameStateManager.changeState(GameState.PLAYING);
      expect(gameStateManager.canPause()).toBe(true);
      gameStateManager.changeState(GameState.PAUSED);
      expect(gameStateManager.canPause()).toBe(false);
    });

    it('should correctly report canResume', () => {
      expect(gameStateManager.canResume()).toBe(false);
      gameStateManager.changeState(GameState.PAUSED);
      expect(gameStateManager.canResume()).toBe(true);
      gameStateManager.changeState(GameState.PLAYING);
      expect(gameStateManager.canResume()).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should clean up event listeners on destroy', () => {
      const removeAllListenersSpy = vi.spyOn(gameStateManager.getEvents(), 'removeAllListeners');
      gameStateManager.destroy();
      expect(removeAllListenersSpy).toHaveBeenCalled();
    });
  });
});