import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntitySpawner } from '../EntitySpawner';
import { mockPhaser } from '../../test/mocks/phaser.mock';
import { LaneManager } from '../../utils/LaneManager';
import { DifficultyManager } from '../../managers/DifficultyManager';

// Mock sprite classes
vi.mock('../../sprites/Stroller', () => ({
  Stroller: class MockStroller {
    active = true;
    setLaneManager = vi.fn();
    spawn = vi.fn();
    destroy = vi.fn();
  }
}));

vi.mock('../../sprites/Hazard', () => ({
  Hazard: class MockHazard {
    active = true;
    setLaneManager = vi.fn();
    spawn = vi.fn();
    destroy = vi.fn();
  }
}));

vi.mock('../../sprites/VIP', () => ({
  VIP: class MockVIP {
    active = true;
    setLaneManager = vi.fn();
    spawn = vi.fn();
    isProtected = vi.fn().mockReturnValue(false);
    destroy = vi.fn();
  }
}));

vi.mock('../../sprites/Assassin', () => ({
  Assassin: class MockAssassin {
    active = true;
    setLaneManager = vi.fn();
    setTarget = vi.fn();
    spawn = vi.fn();
    destroy = vi.fn();
  }
}));

describe('EntitySpawner', () => {
  let entitySpawner: EntitySpawner;
  let mockScene: any;
  let mockLaneManager: LaneManager;
  let mockDifficultyManager: DifficultyManager;
  let mockTimerEvent: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Create mock timer event
    mockTimerEvent = {
      paused: false,
      destroy: vi.fn()
    };
    
    // Create enhanced mock scene
    mockScene = new mockPhaser.Scene();
    
    mockScene.physics = {
      add: {
        group: vi.fn(() => ({
          get: vi.fn().mockReturnValue({
            active: true,
            setLaneManager: vi.fn(),
            spawn: vi.fn(),
            isProtected: vi.fn().mockReturnValue(false),
            setTarget: vi.fn()
          }),
          destroy: vi.fn(),
          children: { entries: [] }
        }))
      }
    };
    
    mockScene.time = {
      delayedCall: vi.fn((delay, callback) => {
        // Store callbacks for testing
        if (!mockScene.time._callbacks) {
          mockScene.time._callbacks = [];
        }
        mockScene.time._callbacks.push({ delay, callback });
        
        // Simulate timer execution
        setTimeout(callback, delay);
        
        return mockTimerEvent;
      }),
      _callbacks: []
    };
    
    // Mock LaneManager
    mockLaneManager = {
      getLaneCount: vi.fn().mockReturnValue(3),
      getLanePosition: vi.fn((lane) => 160 + (lane * 160))
    } as any;
    
    // Mock DifficultyManager
    mockDifficultyManager = {
      getSpeedMultiplier: vi.fn().mockReturnValue(1),
      getSpawnRateMultiplier: vi.fn().mockReturnValue(1),
      getHazardVariety: vi.fn().mockReturnValue(1),
      getAssassinAggressiveness: vi.fn().mockReturnValue(1)
    } as any;
    
    // Mock Phaser.Math methods
    let betweenCounter = 0;
    vi.spyOn(mockPhaser.Math, 'Between').mockImplementation((min, max) => {
      // Return predictable values for testing
      betweenCounter++;
      if (betweenCounter % 3 === 0) return min;
      if (betweenCounter % 3 === 1) return Math.floor((min + max) / 2);
      return max;
    });
    
    vi.spyOn(mockPhaser.Math.RND, 'pick').mockImplementation((array) => array[0]);
    
    // Create entity spawner
    entitySpawner = new EntitySpawner(mockScene, mockLaneManager);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should create object pools', () => {
      expect(mockScene.physics.add.group).toHaveBeenCalledTimes(4); // stroller, hazard, vip, assassin
      
      // Check pool configurations
      const calls = mockScene.physics.add.group.mock.calls;
      expect(calls[0][0]).toMatchObject({ maxSize: 20, runChildUpdate: true }); // stroller
      expect(calls[1][0]).toMatchObject({ maxSize: 15, runChildUpdate: true }); // hazard
      expect(calls[2][0]).toMatchObject({ maxSize: 5, runChildUpdate: true }); // vip
      expect(calls[3][0]).toMatchObject({ maxSize: 5, runChildUpdate: true }); // assassin
    });

    it('should setup initial spawn timers', () => {
      // Should have 3 initial timers (stroller, hazard, vip)
      expect(mockScene.time.delayedCall).toHaveBeenCalledTimes(3);
    });

    it('should get entity groups', () => {
      expect(entitySpawner.getStrollerGroup()).toBeDefined();
      expect(entitySpawner.getHazardGroup()).toBeDefined();
      expect(entitySpawner.getVIPGroup()).toBeDefined();
      expect(entitySpawner.getAssassinGroup()).toBeDefined();
    });
  });

  describe('difficulty management', () => {
    it('should set difficulty manager', () => {
      entitySpawner.setDifficultyManager(mockDifficultyManager);
      
      // Fast forward to trigger spawning
      vi.advanceTimersByTime(5000);
      
      // Difficulty manager methods should be called
      expect(mockDifficultyManager.getSpeedMultiplier).toHaveBeenCalled();
      expect(mockDifficultyManager.getSpawnRateMultiplier).toHaveBeenCalled();
    });

    it('should set difficulty level within bounds', () => {
      entitySpawner.setDifficultyLevel(3);
      expect(entitySpawner.getDifficultyLevel()).toBe(3);
      
      entitySpawner.setDifficultyLevel(10);
      expect(entitySpawner.getDifficultyLevel()).toBe(5); // clamped to max
      
      entitySpawner.setDifficultyLevel(-5);
      expect(entitySpawner.getDifficultyLevel()).toBe(0); // clamped to min
    });
  });

  describe('stroller spawning', () => {
    beforeEach(() => {
      entitySpawner.setDifficultyManager(mockDifficultyManager);
    });

    it('should spawn strollers periodically', () => {
      const strollerGroup = entitySpawner.getStrollerGroup();
      const mockStroller = strollerGroup.get();
      
      // Advance time to trigger initial spawn
      vi.advanceTimersByTime(2000);
      
      expect(mockStroller.setLaneManager).toHaveBeenCalledWith(mockLaneManager);
      expect(mockStroller.spawn).toHaveBeenCalled();
    });

    it('should apply speed multiplier to strollers', () => {
      mockDifficultyManager.getSpeedMultiplier.mockReturnValue(1.5);
      const strollerGroup = entitySpawner.getStrollerGroup();
      const mockStroller = strollerGroup.get();
      
      vi.advanceTimersByTime(2000);
      
      // Speed should be multiplied
      const spawnCall = mockStroller.spawn.mock.calls[0];
      expect(spawnCall[1]).toBeGreaterThan(100); // base speed with multiplier
    });

    it('should adjust spawn rate based on difficulty', () => {
      mockDifficultyManager.getSpawnRateMultiplier.mockReturnValue(2);
      
      const strollerGroup = entitySpawner.getStrollerGroup();
      const initialCalls = strollerGroup.get.mock.calls.length;
      
      vi.advanceTimersByTime(10000);
      
      // More strollers should spawn with higher spawn rate
      const finalCalls = strollerGroup.get.mock.calls.length;
      expect(finalCalls - initialCalls).toBeGreaterThanOrEqual(2);
    });
  });

  describe('hazard spawning', () => {
    beforeEach(() => {
      entitySpawner.setDifficultyManager(mockDifficultyManager);
    });

    it('should spawn hazards periodically', () => {
      const hazardGroup = entitySpawner.getHazardGroup();
      const mockHazard = hazardGroup.get();
      
      // Advance time to trigger initial spawn
      vi.advanceTimersByTime(3000);
      
      expect(mockHazard.setLaneManager).toHaveBeenCalledWith(mockLaneManager);
      expect(mockHazard.spawn).toHaveBeenCalled();
    });

    it('should use hazard variety from difficulty manager', () => {
      mockDifficultyManager.getHazardVariety.mockReturnValue(3);
      
      vi.advanceTimersByTime(3000);
      
      expect(mockDifficultyManager.getHazardVariety).toHaveBeenCalled();
    });

    it('should apply speed multiplier to hazards', () => {
      mockDifficultyManager.getSpeedMultiplier.mockReturnValue(2);
      const hazardGroup = entitySpawner.getHazardGroup();
      const mockHazard = hazardGroup.get();
      
      vi.advanceTimersByTime(3000);
      
      const spawnCall = mockHazard.spawn.mock.calls[0];
      expect(spawnCall[1]).toBeGreaterThanOrEqual(80); // minimum base speed
    });
  });

  describe('VIP and assassin spawning', () => {
    beforeEach(() => {
      entitySpawner.setDifficultyManager(mockDifficultyManager);
    });

    it('should spawn VIPs periodically', () => {
      const vipGroup = entitySpawner.getVIPGroup();
      const mockVIP = vipGroup.get();
      
      // Advance time to trigger initial VIP spawn
      vi.advanceTimersByTime(15000);
      
      expect(mockVIP.setLaneManager).toHaveBeenCalledWith(mockLaneManager);
      expect(mockVIP.spawn).toHaveBeenCalled();
    });

    it('should spawn VIPs at 80% of normal speed', () => {
      const vipGroup = entitySpawner.getVIPGroup();
      const mockVIP = vipGroup.get();
      
      vi.advanceTimersByTime(15000);
      
      const spawnCall = mockVIP.spawn.mock.calls[0];
      // VIP speed should be reduced (base * multiplier * 0.8)
      expect(spawnCall[1]).toBeLessThan(80); // max base speed of 80
    });

    it('should spawn assassin after VIP', () => {
      const assassinGroup = entitySpawner.getAssassinGroup();
      const mockAssassin = assassinGroup.get();
      const vipGroup = entitySpawner.getVIPGroup();
      const mockVIP = vipGroup.get();
      
      // Spawn VIP
      vi.advanceTimersByTime(15000);
      
      // Advance time for assassin spawn
      vi.advanceTimersByTime(3000);
      
      expect(mockAssassin.setLaneManager).toHaveBeenCalledWith(mockLaneManager);
      expect(mockAssassin.setTarget).toHaveBeenCalledWith(mockVIP);
      expect(mockAssassin.spawn).toHaveBeenCalled();
    });

    it('should not spawn assassin if VIP is protected', () => {
      const vipGroup = entitySpawner.getVIPGroup();
      const mockVIP = vipGroup.get();
      mockVIP.isProtected.mockReturnValue(true);
      
      const assassinGroup = entitySpawner.getAssassinGroup();
      
      // Spawn VIP
      vi.advanceTimersByTime(15000);
      
      // Advance time for assassin spawn
      vi.advanceTimersByTime(3000);
      
      expect(assassinGroup.get).not.toHaveBeenCalled();
    });

    it('should adjust assassin aggressiveness', () => {
      mockDifficultyManager.getAssassinAggressiveness.mockReturnValue(2);
      
      const assassinGroup = entitySpawner.getAssassinGroup();
      const mockAssassin = assassinGroup.get();
      
      // Spawn VIP and assassin
      vi.advanceTimersByTime(15000);
      vi.advanceTimersByTime(1500); // Faster with higher aggressiveness
      
      const spawnCall = mockAssassin.spawn.mock.calls[0];
      expect(spawnCall[1]).toBeGreaterThan(150); // base speed with multipliers
    });

    it('should pick random lane for assassin', () => {
      // Test that RND.pick is used for lane selection
      const pickSpy = vi.spyOn(mockPhaser.Math.RND, 'pick');
      
      vi.advanceTimersByTime(15000); // Spawn VIP
      vi.advanceTimersByTime(3000); // Spawn assassin
      
      expect(pickSpy).toHaveBeenCalledWith([0, 1, 2]); // lane choices
    });
  });

  describe('pause and resume', () => {
    it('should pause all spawn timers', () => {
      entitySpawner.pause();
      
      expect(mockTimerEvent.paused).toBe(true);
    });

    it('should resume all spawn timers', () => {
      entitySpawner.pause();
      entitySpawner.resume();
      
      expect(mockTimerEvent.paused).toBe(false);
    });

    it('should handle pause when timers not created', () => {
      const newSpawner = new EntitySpawner(mockScene, mockLaneManager);
      
      // Should not throw
      expect(() => newSpawner.pause()).not.toThrow();
      expect(() => newSpawner.resume()).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should destroy all timers', () => {
      // Advance time to create all timers
      vi.advanceTimersByTime(20000);
      
      entitySpawner.destroy();
      
      // Check that timer destroy was called
      expect(mockTimerEvent.destroy).toHaveBeenCalled();
    });

    it('should destroy all object pools', () => {
      const strollerGroup = entitySpawner.getStrollerGroup();
      const hazardGroup = entitySpawner.getHazardGroup();
      const vipGroup = entitySpawner.getVIPGroup();
      const assassinGroup = entitySpawner.getAssassinGroup();
      
      entitySpawner.destroy();
      
      expect(strollerGroup.destroy).toHaveBeenCalledWith(true);
      expect(hazardGroup.destroy).toHaveBeenCalledWith(true);
      expect(vipGroup.destroy).toHaveBeenCalledWith(true);
      expect(assassinGroup.destroy).toHaveBeenCalledWith(true);
    });
  });

  describe('edge cases', () => {
    it('should handle missing entities from pool', () => {
      const strollerGroup = entitySpawner.getStrollerGroup();
      strollerGroup.get = vi.fn().mockReturnValue(null);
      
      // Should not throw when entity is null
      expect(() => vi.advanceTimersByTime(2000)).not.toThrow();
    });

    it('should handle inactive VIP when spawning assassin', () => {
      const vipGroup = entitySpawner.getVIPGroup();
      const mockVIP = vipGroup.get();
      mockVIP.active = false;
      
      const assassinGroup = entitySpawner.getAssassinGroup();
      
      vi.advanceTimersByTime(15000); // Spawn VIP
      vi.advanceTimersByTime(3000); // Try to spawn assassin
      
      expect(assassinGroup.get).not.toHaveBeenCalled();
    });

    it('should handle errors during spawning', () => {
      const strollerGroup = entitySpawner.getStrollerGroup();
      const mockStroller = strollerGroup.get();
      
      // Make spawn throw error
      mockStroller.spawn.mockImplementationOnce(() => {
        throw new Error('Spawn error');
      });
      
      // Currently, errors are not caught, so this will throw
      // This test documents current behavior
      expect(() => vi.advanceTimersByTime(2000)).toThrow('Spawn error');
    });
  });

  describe('spawn timing', () => {
    it('should respect initial delays', () => {
      const callbacks = mockScene.time._callbacks;
      
      // Check initial timer delays
      expect(callbacks[0].delay).toBeGreaterThanOrEqual(1000); // stroller
      expect(callbacks[0].delay).toBeLessThanOrEqual(2000);
      
      expect(callbacks[1].delay).toBeGreaterThanOrEqual(2000); // hazard
      expect(callbacks[1].delay).toBeLessThanOrEqual(3000);
      
      expect(callbacks[2].delay).toBeGreaterThanOrEqual(10000); // vip
      expect(callbacks[2].delay).toBeLessThanOrEqual(15000);
    });

    it('should create recurring timers', () => {
      // Clear initial callbacks
      mockScene.time._callbacks = [];
      
      // Trigger initial spawns
      vi.advanceTimersByTime(15000);
      
      // Should have created new delayed calls for next spawns
      expect(mockScene.time.delayedCall.mock.calls.length).toBeGreaterThan(3);
    });
  });
});