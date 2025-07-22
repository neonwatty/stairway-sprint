import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CollisionManager } from '../CollisionManager';
import { mockPhaser } from '../../test/mocks/phaser.mock';

describe('CollisionManager', () => {
  let collisionManager: CollisionManager;
  let mockScene: any;
  let mockPlayer: any;
  let mockScoreManager: any;
  let mockLivesManager: any;
  let mockEffectsManager: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock scene
    mockScene = new mockPhaser.Scene();
    mockScene.physics = {
      add: {
        overlap: vi.fn().mockReturnValue({ destroy: vi.fn() })
      },
      world: {
        removeCollider: vi.fn()
      }
    };
    mockScene.cameras = {
      main: {
        height: 960,
        width: 640,
        shake: vi.fn(),
        flash: vi.fn()
      }
    };
    
    // Create mock player
    mockPlayer = {
      x: 320,
      y: 860,
      active: true,
      getCurrentLane: vi.fn().mockReturnValue(1)
    };
    
    // Create mock managers
    mockScoreManager = {
      addPoints: vi.fn(),
      addStreak: vi.fn(),
      resetStreak: vi.fn()
    };
    
    mockLivesManager = {
      loseLife: vi.fn().mockReturnValue(false),
      isInvincible: vi.fn().mockReturnValue(false),
      getLives: vi.fn().mockReturnValue(3)
    };
    
    mockEffectsManager = {
      playRescueEffect: vi.fn(),
      playImpactEffect: vi.fn(),
      playProtectionEffect: vi.fn(),
      playEliminationEffect: vi.fn()
    };
    
    // Create collision manager
    collisionManager = new CollisionManager(
      mockScene,
      mockPlayer,
      mockScoreManager,
      mockLivesManager
    );
    collisionManager.setEffectsManager(mockEffectsManager);
  });

  describe('initialization', () => {
    it('should initialize with proper state', () => {
      expect(collisionManager.isEnabled()).toBe(true);
      expect(collisionManager.getCollisionStats().spatialPartitioningEnabled).toBe(true);
    });
    
    it('should set effects manager correctly', () => {
      const newEffectsManager = { playRescueEffect: vi.fn() };
      collisionManager.setEffectsManager(newEffectsManager as any);
      // Effects manager is private, so we'll test its usage in collision handlers
    });
  });

  describe('collision setup', () => {
    it('should set up all collision types', () => {
      const mockGroups = {
        stroller: { name: 'stroller' },
        hazard: { name: 'hazard' },
        vip: { name: 'vip' },
        assassin: { name: 'assassin' },
        projectile: { name: 'projectile' }
      };
      
      collisionManager.setupCollisions(
        mockGroups.stroller as any,
        mockGroups.hazard as any,
        mockGroups.vip as any,
        mockGroups.assassin as any,
        mockGroups.projectile as any
      );
      
      // Should create 6 collision overlaps
      expect(mockScene.physics.add.overlap).toHaveBeenCalledTimes(6);
    });
  });

  describe('enable/disable functionality', () => {
    it('should disable collision detection', () => {
      collisionManager.disable();
      expect(collisionManager.isEnabled()).toBe(false);
    });
    
    it('should enable collision detection', () => {
      collisionManager.disable();
      collisionManager.enable();
      expect(collisionManager.isEnabled()).toBe(true);
    });
  });

  describe('spatial partitioning', () => {
    it('should update spatial partitioning with entities', () => {
      const mockEntities = [
        { getCurrentLane: () => 0, active: true },
        { getCurrentLane: () => 1, active: true },
        { getCurrentLane: () => 2, active: true }
      ];
      
      collisionManager.updateSpatialPartitioning(mockEntities as any);
      
      const stats = collisionManager.getCollisionStats();
      expect(stats.laneGroups.size).toBe(3);
    });
    
    it('should calculate vertical zones correctly', () => {
      const zone = collisionManager.getVerticalZone(320);
      expect(zone).toBeGreaterThanOrEqual(0);
      expect(zone).toBeLessThan(3);
    });
    
    it('should check if entity is in player zone', () => {
      const mockEntity = { y: 850 };
      const inZone = collisionManager.isInPlayerZone(mockEntity);
      expect(inZone).toBe(true);
      
      const farEntity = { y: 100 };
      const notInZone = collisionManager.isInPlayerZone(farEntity);
      expect(notInZone).toBe(false);
    });
  });

  describe('performance tracking', () => {
    it('should track collision checks per frame', () => {
      const initialStats = collisionManager.getCollisionStats();
      expect(initialStats.checksPerFrame).toBe(0);
    });
    
    it('should reset frame stats correctly', () => {
      collisionManager.resetFrameStats();
      const stats = collisionManager.getCollisionStats();
      expect(stats.checksPerFrame).toBe(0);
    });
    
    it('should calculate performance improvement', () => {
      const stats = collisionManager.getCollisionStats();
      expect(stats.performanceImprovement).toMatch(/\d+(\.\d+)?%/);
    });
    
    it('should maintain performance history', () => {
      // Simulate multiple frames
      for (let i = 0; i < 10; i++) {
        collisionManager.resetFrameStats();
      }
      
      const stats = collisionManager.getCollisionStats();
      expect(stats.averageChecksPerFrame).toBeGreaterThanOrEqual(0);
    });
  });

  describe('debug mode', () => {
    it('should toggle debug mode', () => {
      collisionManager.setDebugMode(true);
      // Debug mode is internal, we can't directly test it
      // but we can verify it doesn't throw
      expect(() => collisionManager.setDebugMode(false)).not.toThrow();
    });
  });

  describe('collision event emission', () => {
    let emitSpy: any;
    
    beforeEach(() => {
      emitSpy = vi.spyOn(collisionManager, 'emit');
    });
    
    it('should emit strollerRescued event', () => {
      const mockStroller = {
        active: true,
        x: 100,
        y: 200,
        deactivate: vi.fn()
      };
      
      // Manually trigger collision handler
      (collisionManager as any).handleStrollerCollision(mockPlayer, mockStroller);
      
      expect(emitSpy).toHaveBeenCalledWith('strollerRescued', mockStroller);
      expect(mockScoreManager.addPoints).toHaveBeenCalledWith(1);
      expect(mockScoreManager.addStreak).toHaveBeenCalled();
    });
    
    it('should emit hazardHit event', () => {
      const mockHazard = {
        active: true,
        x: 100,
        y: 200,
        deactivate: vi.fn()
      };
      
      (collisionManager as any).handleHazardCollision(mockPlayer, mockHazard);
      
      expect(emitSpy).toHaveBeenCalledWith('hazardHit', mockHazard);
      expect(mockScoreManager.addPoints).toHaveBeenCalledWith(-2);
      expect(mockLivesManager.loseLife).toHaveBeenCalled();
    });
    
    it('should emit vipProtected event', () => {
      const mockVIP = {
        active: true,
        x: 100,
        y: 200,
        isProtected: vi.fn().mockReturnValue(false),
        protect: vi.fn()
      };
      
      (collisionManager as any).handleVIPCollision(mockPlayer, mockVIP);
      
      expect(emitSpy).toHaveBeenCalledWith('vipProtected', mockVIP);
      expect(mockScoreManager.addPoints).toHaveBeenCalledWith(5);
      expect(mockVIP.protect).toHaveBeenCalled();
    });
    
    it('should emit assassinEliminated event', () => {
      const mockProjectile = {
        active: true,
        destroy: vi.fn()
      };
      const mockAssassin = {
        active: true,
        x: 100,
        y: 200,
        eliminate: vi.fn()
      };
      
      (collisionManager as any).handleProjectileAssassinCollision(mockProjectile, mockAssassin);
      
      expect(emitSpy).toHaveBeenCalledWith('assassinEliminated', mockAssassin);
      expect(mockScoreManager.addPoints).toHaveBeenCalledWith(2);
    });
  });

  describe('cleanup', () => {
    it('should destroy properly', () => {
      const mockCollider = { destroy: vi.fn() };
      mockScene.physics.add.overlap = vi.fn().mockReturnValue(mockCollider);
      
      // Setup collisions to create colliders
      collisionManager.setupCollisions(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any
      );
      
      const removeAllListenersSpy = vi.spyOn(collisionManager, 'removeAllListeners');
      
      collisionManager.destroy();
      
      expect(mockScene.physics.world.removeCollider).toHaveBeenCalled();
      expect(removeAllListenersSpy).toHaveBeenCalled();
    });
  });
});