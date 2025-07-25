import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Player, PlayerState } from '../Player';
import { LaneManager } from '../../utils/LaneManager';
import { mockPhaser } from '../../test/mocks/phaser.mock';

describe('Player', () => {
  let player: Player;
  let mockScene: any;
  let mockLaneManager: LaneManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create enhanced mock scene
    mockScene = new mockPhaser.Scene();
    
    // Add missing properties for Player
    mockScene.add = {
      ...mockScene.add,
      existing: vi.fn(),
      image: vi.fn(() => ({
        body: {
          setVelocityY: vi.fn()
        },
        destroy: vi.fn()
      }))
    };
    
    mockScene.physics = {
      add: {
        existing: vi.fn(),
        group: vi.fn(),
        overlap: vi.fn(),
        collider: vi.fn()
      }
    };
    
    mockScene.anims = {
      create: vi.fn()
    };
    
    mockScene.cameras = {
      main: {
        width: 640,
        height: 960
      }
    };
    
    mockScene.tweens = {
      add: vi.fn(),
      killTweensOf: vi.fn()
    };
    
    // Mock LaneManager
    mockLaneManager = {
      getLaneForPosition: vi.fn().mockReturnValue(1),
      getLanePosition: vi.fn((lane) => 160 + (lane * 160)), // lanes at 160, 320, 480
      getLaneCount: vi.fn().mockReturnValue(3),
      highlightLane: vi.fn()
    } as any;
    
    // Copy all mocked properties to the scene before creating Player
    Object.assign(mockScene, {
      add: mockScene.add,
      physics: mockScene.physics,
      anims: mockScene.anims,
      cameras: mockScene.cameras,
      tweens: mockScene.tweens,
      time: mockScene.time
    });
    
    // Create player
    player = new Player(mockScene, 320, 800);
  });

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      expect(player.getCurrentLane()).toBe(1);
      expect(player.getState()).toBe(PlayerState.IDLE);
      expect(player.getLives()).toBe(3);
      expect(player.isInvincible()).toBe(false);
    });

    it('should set up physics body correctly', () => {
      expect(mockScene.add.existing).toHaveBeenCalledWith(player);
      expect(mockScene.physics.add.existing).toHaveBeenCalledWith(player);
      expect(player.setDepth).toHaveBeenCalledWith(10);
      expect(player.setScale).toHaveBeenCalledWith(1);
    });

    it('should create all required animations', () => {
      expect(mockScene.anims.create).toHaveBeenCalledTimes(4);
      
      // Check animation configurations
      const calls = mockScene.anims.create.mock.calls;
      expect(calls[0][0]).toEqual(expect.objectContaining({ key: 'player-idle' }));
      expect(calls[1][0]).toEqual(expect.objectContaining({ key: 'player-moving-left' }));
      expect(calls[2][0]).toEqual(expect.objectContaining({ key: 'player-moving-right' }));
      expect(calls[3][0]).toEqual(expect.objectContaining({ key: 'player-shooting' }));
    });
  });

  describe('lane management', () => {
    beforeEach(() => {
      player.setLaneManager(mockLaneManager);
    });

    it('should set lane manager and update current lane', () => {
      expect(mockLaneManager.getLaneForPosition).toHaveBeenCalledWith(320);
      expect(player.getCurrentLane()).toBe(1);
    });

    it('should get lane position from manager', () => {
      mockLaneManager.getLanePosition.mockReturnValue(480);
      const position = mockLaneManager.getLanePosition(2);
      expect(position).toBe(480);
    });
  });

  describe('movement', () => {
    beforeEach(() => {
      player.setLaneManager(mockLaneManager);
    });

    describe('moveLeft', () => {
      it('should move left when possible', () => {
        player.moveLeft();
        
        expect(player.getCurrentLane()).toBe(0);
        expect(player.getState()).toBe(PlayerState.MOVING);
        expect(player.play).toHaveBeenCalledWith('player-moving-left');
        expect(mockLaneManager.highlightLane).toHaveBeenCalledWith(0);
        expect(mockScene.tweens.add).toHaveBeenCalledWith(
          expect.objectContaining({
            targets: player,
            x: 160, // mockLaneManager.getLanePosition(0)
            duration: 200,
            ease: 'Power2'
          })
        );
      });

      it('should not move left from leftmost lane', () => {
        // Set player to leftmost lane
        (player as any).currentLane = 0;
        
        player.moveLeft();
        
        expect(player.getCurrentLane()).toBe(0);
        expect(player.getState()).toBe(PlayerState.IDLE);
        expect(mockScene.tweens.add).not.toHaveBeenCalled();
      });

      it('should not move left when already moving', () => {
        (player as any).isMoving = true;
        
        player.moveLeft();
        
        expect(player.getCurrentLane()).toBe(1);
        expect(mockScene.tweens.add).not.toHaveBeenCalled();
      });

      it('should not move left without lane manager', () => {
        const playerWithoutLanes = new Player(mockScene, 320, 800);
        
        playerWithoutLanes.moveLeft();
        
        expect(playerWithoutLanes.getCurrentLane()).toBe(1);
      });

      it('should complete movement animation correctly', () => {
        player.moveLeft();
        
        // Simulate tween completion
        const tweenCall = mockScene.tweens.add.mock.calls[0][0];
        tweenCall.onComplete();
        
        expect((player as any).isMoving).toBe(false);
        expect(player.getState()).toBe(PlayerState.IDLE);
        expect(player.play).toHaveBeenCalledWith('player-idle');
      });
    });

    describe('moveRight', () => {
      it('should move right when possible', () => {
        player.moveRight();
        
        expect(player.getCurrentLane()).toBe(2);
        expect(player.getState()).toBe(PlayerState.MOVING);
        expect(player.play).toHaveBeenCalledWith('player-moving-right');
        expect(mockLaneManager.highlightLane).toHaveBeenCalledWith(2);
        expect(mockScene.tweens.add).toHaveBeenCalledWith(
          expect.objectContaining({
            targets: player,
            x: 480, // mockLaneManager.getLanePosition(2)
            duration: 200,
            ease: 'Power2'
          })
        );
      });

      it('should not move right from rightmost lane', () => {
        // Set player to rightmost lane
        (player as any).currentLane = 2;
        
        player.moveRight();
        
        expect(player.getCurrentLane()).toBe(2);
        expect(player.getState()).toBe(PlayerState.IDLE);
        expect(mockScene.tweens.add).not.toHaveBeenCalled();
      });

      it('should not move right when already moving', () => {
        (player as any).isMoving = true;
        
        player.moveRight();
        
        expect(player.getCurrentLane()).toBe(1);
        expect(mockScene.tweens.add).not.toHaveBeenCalled();
      });

      it('should complete movement animation correctly', () => {
        player.moveRight();
        
        // Simulate tween completion
        const tweenCall = mockScene.tweens.add.mock.calls[0][0];
        tweenCall.onComplete();
        
        expect((player as any).isMoving).toBe(false);
        expect(player.getState()).toBe(PlayerState.IDLE);
        expect(player.play).toHaveBeenCalledWith('player-idle');
      });
    });
  });

  describe('shooting', () => {
    it('should shoot projectile when allowed', () => {
      const projectile = player.shoot();
      
      expect(projectile).toBeTruthy();
      expect(player.getState()).toBe(PlayerState.SHOOTING);
      expect(player.play).toHaveBeenCalledWith('player-shooting');
      expect(mockScene.add.image).toHaveBeenCalledWith(320, 760, 'projectile');
      expect(mockScene.physics.add.existing).toHaveBeenCalled();
    });

    it('should not shoot when on cooldown', () => {
      // First shot
      player.shoot();
      
      // Second shot should be blocked
      const secondProjectile = player.shoot();
      
      expect(secondProjectile).toBeNull();
      expect(mockScene.add.image).toHaveBeenCalledTimes(1);
    });

    it('should return to idle state after shooting animation', () => {
      player.shoot();
      
      // Simulate delayed call completion
      const delayedCall = mockScene.time.delayedCall.mock.calls.find(
        call => call[0] === 100
      );
      expect(delayedCall).toBeDefined();
      
      delayedCall[1](); // Execute callback
      
      expect(player.getState()).toBe(PlayerState.IDLE);
      expect(player.play).toHaveBeenCalledWith('player-idle');
    });

    it('should reset shoot cooldown after delay', () => {
      player.shoot();
      expect((player as any).canShoot).toBe(false);
      
      // Simulate cooldown completion
      const cooldownCall = mockScene.time.delayedCall.mock.calls.find(
        call => call[0] === 500
      );
      expect(cooldownCall).toBeDefined();
      
      cooldownCall[1](); // Execute callback
      
      expect((player as any).canShoot).toBe(true);
    });
  });

  describe('hit and damage', () => {
    it('should take damage when not invincible', () => {
      const initialLives = player.getLives();
      
      player.hit();
      
      expect(player.getLives()).toBe(initialLives - 1);
      expect(player.getState()).toBe(PlayerState.HIT);
    });

    it('should not take damage when invincible', () => {
      player.setInvincible(true);
      const initialLives = player.getLives();
      
      player.hit();
      
      expect(player.getLives()).toBe(initialLives);
      expect(player.getState()).toBe(PlayerState.IDLE);
    });

    it('should return to idle state after hit recovery', () => {
      player.hit();
      
      // Simulate recovery time
      const recoveryCall = mockScene.time.delayedCall.mock.calls.find(
        call => call[0] === 500
      );
      expect(recoveryCall).toBeDefined();
      
      recoveryCall[1](); // Execute callback
      
      expect(player.getState()).toBe(PlayerState.IDLE);
    });
  });

  describe('invincibility', () => {
    it('should set invincible state and start flashing', () => {
      player.setInvincible(true);
      
      expect(player.isInvincible()).toBe(true);
      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: player,
          alpha: { from: 1, to: 0.5 },
          duration: 200,
          repeat: -1,
          yoyo: true
        })
      );
    });

    it('should remove invincible state and stop flashing', () => {
      player.setInvincible(true);
      player.setInvincible(false);
      
      expect(player.isInvincible()).toBe(false);
      expect(mockScene.tweens.killTweensOf).toHaveBeenCalledWith(player);
      expect(player.setAlpha).toHaveBeenCalledWith(1);
    });
  });

  describe('state management', () => {
    it('should get and set player state correctly', () => {
      expect(player.getState()).toBe(PlayerState.IDLE);
      
      (player as any).setPlayerState(PlayerState.MOVING);
      expect(player.getState()).toBe(PlayerState.MOVING);
      
      (player as any).setPlayerState(PlayerState.SHOOTING);
      expect(player.getState()).toBe(PlayerState.SHOOTING);
      
      (player as any).setPlayerState(PlayerState.HIT);
      expect(player.getState()).toBe(PlayerState.HIT);
    });

    it('should get and set lives correctly', () => {
      expect(player.getLives()).toBe(3);
      
      player.setLives(5);
      expect(player.getLives()).toBe(5);
      
      player.setLives(1);
      expect(player.getLives()).toBe(1);
    });
  });

  describe('reset functionality', () => {
    beforeEach(() => {
      player.setLaneManager(mockLaneManager);
    });

    it('should reset player to center lane', () => {
      // Move player to side lane
      player.moveLeft();
      
      player.reset();
      
      expect(player.getCurrentLane()).toBe(1); // center lane (3 lanes / 2 = 1.5, floored = 1)
      expect((player as any).x).toBe(320); // mockLaneManager.getLanePosition(1)
    });

    it('should reset all player states', () => {
      // Set various states
      (player as any).isMoving = true;
      (player as any).canShoot = false;
      player.setInvincible(true);
      (player as any).setPlayerState(PlayerState.HIT);
      (player as any).alpha = 0.5;
      
      player.reset();
      
      expect((player as any).isMoving).toBe(false);
      expect((player as any).canShoot).toBe(true);
      expect(player.isInvincible()).toBe(false);
      expect(player.getState()).toBe(PlayerState.IDLE);
      expect((player as any).alpha).toBe(1);
    });

    it('should handle reset without lane manager', () => {
      const playerWithoutLanes = new Player(mockScene, 320, 800);
      
      expect(() => playerWithoutLanes.reset()).not.toThrow();
    });
  });

  describe('update lifecycle', () => {
    beforeEach(() => {
      // Mock the body property
      (player as any).body = {
        setVelocity: vi.fn()
      };
      player.destroy = vi.fn();
    });

    it('should destroy player when too far above screen', () => {
      (player as any).y = -100;
      
      player.update();
      
      expect((player as any).body.setVelocity).toHaveBeenCalledWith(0, 0);
      expect(player.destroy).toHaveBeenCalled();
    });

    it('should destroy player when too far below screen', () => {
      (player as any).y = 1100; // > 960 + 50
      
      player.update();
      
      expect((player as any).body.setVelocity).toHaveBeenCalledWith(0, 0);
      expect(player.destroy).toHaveBeenCalled();
    });

    it('should not destroy player when within screen bounds', () => {
      (player as any).y = 500; // within bounds
      
      player.update();
      
      expect((player as any).body.setVelocity).not.toHaveBeenCalled();
      expect(player.destroy).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle movement with different lane counts', () => {
      mockLaneManager.getLaneCount.mockReturnValue(5);
      player.setLaneManager(mockLaneManager);
      
      // Should be able to move right multiple times
      player.moveRight(); // lane 2
      expect(player.getCurrentLane()).toBe(2);
      
      // Complete first movement
      const tweenCall = mockScene.tweens.add.mock.calls[0][0];
      tweenCall.onComplete();
      
      player.moveRight(); // lane 3
      expect(player.getCurrentLane()).toBe(3);
    });

    it('should handle shooting state interruption', () => {
      player.shoot();
      expect(player.getState()).toBe(PlayerState.SHOOTING);
      
      // If state changes before animation completes
      (player as any).setPlayerState(PlayerState.HIT);
      
      // Animation completion should not override new state
      const delayedCall = mockScene.time.delayedCall.mock.calls.find(
        call => call[0] === 100
      );
      delayedCall[1](); // Execute callback
      
      expect(player.getState()).toBe(PlayerState.HIT);
    });
  });
});