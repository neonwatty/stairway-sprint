# CollisionManager Implementation TODO

## Overview
Refactor the collision system from GameScene into a dedicated CollisionManager class with performance optimizations and better organization.

## Phase 1: Create Core CollisionManager Infrastructure

### 1.1 Create CollisionManager Class
- [x] Create `src/managers/CollisionManager.ts`
- [x] Define class structure with:
  - Constructor accepting GameScene
  - References to player, entity groups, projectiles
  - Event emitter for collision events
  - Collision handlers map for different collision types
  - Performance metrics tracking

### 1.2 Create EffectsManager Class
- [x] Create `src/managers/EffectsManager.ts`
- [x] Implement object pooling for particle effects
- [x] Define effect types: rescue, impact, protection, elimination
- [x] Create methods for each effect type with pooling
- [x] Add cleanup and recycling logic

### 1.3 Move Collision Setup
- [x] Move all `physics.add.overlap` calls from GameScene to CollisionManager
- [x] Create `setupCollisions()` method in CollisionManager
- [x] Maintain references to all active colliders for cleanup
- [x] Add enable/disable methods for collision groups

## Phase 2: Refactor Collision Handlers

### 2.1 Move Collision Handler Methods
- [x] Move `handleStrollerCollision` to CollisionManager
- [x] Move `handleHazardCollision` to CollisionManager
- [x] Move `handleVIPCollision` to CollisionManager
- [x] Move `handleAssassinCollision` to CollisionManager
- [x] Move `handleProjectileAssassinCollision` to CollisionManager
- [x] Move `handleVIPAssassinCollision` to CollisionManager

### 2.2 Integrate EffectsManager
- [x] Replace inline particle creation with EffectsManager calls
- [x] Pool particle emitters for better performance
- [x] Add configuration for different effect types
- [x] Implement effect recycling after lifespan

### 2.3 Update GameScene Integration
- [x] Remove collision setup from GameScene
- [x] Remove collision handlers from GameScene
- [x] Add CollisionManager initialization in GameScene.create()
- [x] Add CollisionManager cleanup in GameScene.shutdown()

## Phase 3: Implement Spatial Partitioning

### 3.1 Lane-Based Optimization
- [x] Create spatial partitioning system using lanes
- [x] Implement `checkLaneCollisions()` method
- [x] Only check collisions between entities in same/adjacent lanes
- [x] Add lane transition collision checks
- [x] Create collision candidate filtering

### 3.2 Vertical Partitioning
- [x] Divide screen into vertical zones
- [x] Only check collisions in player's zone + adjacent
- [x] Update zone tracking as entities move
- [x] Optimize collision checks based on entity positions

## Phase 4: Performance Optimizations

### 4.1 Off-Screen Entity Optimization
- [x] Add `isOnScreen()` check for entities
- [x] Disable physics bodies for off-screen entities
- [x] Re-enable physics when entities come back on screen
- [x] Add buffer zone to prevent edge-case issues
- [x] Track performance improvements

### 4.2 Collision Frequency Optimization
- [ ] Implement collision check throttling
- [ ] Different check frequencies for entity types:
  - Player-hazard: Every frame
  - Player-stroller: Every frame
  - VIP-assassin: Every 2-3 frames
  - Projectile-assassin: Every frame
- [ ] Add adaptive frequency based on entity count

### 4.3 Object Pooling Enhancement
- [ ] Ensure all visual effects use object pooling
- [ ] Pre-warm pools at scene start
- [ ] Monitor pool usage and adjust sizes
- [ ] Add pool statistics for debugging

## Phase 5: Debug and Monitoring Tools

### 5.1 Debug Visualization
- [x] Add debug mode toggle (press 'C' key)
- [x] Show collision boundaries when enabled
- [x] Display spatial partitioning grid
- [x] Show active/inactive collision zones
- [x] Add color coding for different collision types

### 5.2 Performance Monitoring
- [ ] Add FPS counter in debug mode
- [ ] Track collision checks per frame
- [ ] Monitor entity counts by type
- [ ] Add performance warnings for high collision counts
- [ ] Create performance report method

## Phase 6: Testing and Integration

### 6.1 Unit Tests
- [x] Create `src/managers/__tests__/CollisionManager.test.ts`
- [x] Test all collision handler methods
- [x] Test spatial partitioning logic
- [x] Test performance optimizations
- [x] Test effect pooling and recycling

### 6.2 Integration Tests
- [ ] Test collision detection accuracy
- [ ] Verify no collisions are missed with optimizations
- [ ] Test edge cases (multiple simultaneous collisions)
- [ ] Verify memory usage stays stable
- [ ] Test with high entity counts

### 6.3 Performance Benchmarks
- [ ] Measure FPS with old vs new system
- [ ] Compare collision checks per frame
- [ ] Test with 50, 100, 200 entities
- [ ] Document performance improvements
- [ ] Create performance regression tests

## Implementation Notes

### Key Considerations:
1. Maintain exact same collision behavior as current system
2. Ensure scoring and lives updates work correctly
3. Keep visual feedback timing identical
4. Don't break existing game mechanics
5. Make system extensible for future entity types

### Architecture Decisions:
1. CollisionManager handles logic, EffectsManager handles visuals
2. Use events for decoupling (collision events → game events)
3. Keep spatial partitioning simple (lanes + vertical zones)
4. Prioritize accuracy over performance optimizations
5. Make debug tools optional but comprehensive

### Performance Targets:
- Maintain 60 FPS with 100+ entities
- Reduce collision checks by 50-70% with spatial partitioning
- Keep memory usage under 10MB for effects
- Pool warm-up time < 100ms

### Risk Mitigation:
1. Keep old collision code until new system is verified
2. Add feature flags for enabling optimizations
3. Extensive testing at each phase
4. Performance monitoring in production
5. Rollback plan if issues arise