# DifficultyManager Implementation TODO

## Overview
Implement a difficulty progression system that scales challenge based on time elapsed and score milestones, with visual/audio feedback and entity behavior adjustments.

## Phase 1: Core DifficultyManager Class

### 1.1 Create DifficultyManager Class Structure
- [x] Create `src/managers/DifficultyManager.ts`
- [x] Define difficulty levels enum (EASY, MEDIUM, HARD, NIGHTMARE)
- [x] Add properties:
  - currentDifficulty: DifficultyLevel
  - gameStartTime: number
  - scene: GameScene
  - events: EventEmitter
  - difficultyConfig: object with spawn rates, speeds, etc.
  - visualEffects: background colors, screen effects
  
### 1.2 Initialize Configuration
- [x] Define difficulty configurations for each level:
  - Spawn rates for each entity type
  - Entity movement speeds
  - Special ability cooldowns
  - Visual theme colors
- [x] Create default difficulty settings
- [x] Set up event emitter for difficulty changes

## Phase 2: Time-Based Difficulty Progression

### 2.1 Implement Time Tracking
- [x] Track game start time on initialization
- [x] Create timer event that checks every second
- [x] Calculate elapsed game time
- [x] Define time thresholds:
  - 0-30s: EASY
  - 30-60s: MEDIUM
  - 60-120s: HARD
  - 120+s: NIGHTMARE

### 2.2 Time-Based Difficulty Updates
- [x] Create `checkTimeDifficulty()` method
- [x] Check elapsed time against thresholds
- [x] Trigger difficulty changes when thresholds met
- [x] Prevent downgrading difficulty from time alone
- [x] Emit 'difficultyChanged' event with trigger info

## Phase 3: Score-Based Difficulty Progression

### 3.1 Score Milestone Tracking
- [x] Listen to ScoreManager's 'scoreChanged' events
- [x] Define score milestones:
  - 10 points: First increase
  - 25 points: Second increase
  - 50 points: Maximum difficulty
  - 100 points: Nightmare mode
- [x] Create `checkScoreDifficulty()` method

### 3.2 Score-Based Difficulty Updates
- [x] Compare current score to milestones
- [x] Trigger difficulty changes at milestones
- [x] Ensure score-based can override time-based
- [x] Emit 'difficultyChanged' event with trigger info
- [x] Track highest difficulty reached

## Phase 4: Visual and Audio Feedback

### 4.1 Visual Difficulty Indicators
- [ ] Create background color transitions:
  - EASY: Green tint (#2a4d3a)
  - MEDIUM: Yellow tint (#4d4a2a)
  - HARD: Orange tint (#4d3a2a)
  - NIGHTMARE: Red tint (#4d2a2a)
- [ ] Implement camera flash on difficulty change
- [ ] Add UI difficulty indicator (1-4 stars)
- [ ] Create smooth color transitions with tweens
- [ ] Add particle effects for major difficulty jumps

### 4.2 Audio Feedback
- [ ] Define audio cues for difficulty changes
- [ ] Play ascending tone for difficulty increase
- [ ] Add ambient music tempo changes
- [ ] Create warning sounds for nightmare mode
- [ ] Implement audio fade transitions

## Phase 5: Entity Behavior Adjustments

### 5.1 Spawn Rate Modifications
- [ ] Create `getSpawnRateMultiplier()` method
- [ ] Define spawn rate scales:
  - EASY: 1.0x base rate
  - MEDIUM: 1.5x base rate
  - HARD: 2.0x base rate
  - NIGHTMARE: 3.0x base rate
- [ ] Apply different multipliers per entity type
- [ ] Increase hazard variety at higher difficulties

### 5.2 Entity Speed Adjustments
- [ ] Create `getSpeedMultiplier()` method
- [ ] Define speed scales:
  - EASY: 1.0x base speed
  - MEDIUM: 1.2x base speed
  - HARD: 1.5x base speed
  - NIGHTMARE: 2.0x base speed
- [ ] Apply to strollers, VIPs, and assassins
- [ ] Keep player speed constant

### 5.3 Special Ability Modifications
- [ ] Adjust assassin targeting speed
- [ ] Modify VIP protection duration
- [ ] Change projectile cooldown times
- [ ] Add new hazard types at higher difficulties

## Phase 6: Adaptive Difficulty System

### 6.1 Performance Tracking
- [ ] Track player performance metrics:
  - Lives lost per minute
  - Score gain rate
  - Streak frequency
  - Death frequency
- [ ] Create performance score calculation
- [ ] Store rolling average over 30 seconds

### 6.2 Dynamic Adjustments
- [ ] Create `evaluatePlayerPerformance()` method
- [ ] Implement slight difficulty adjustments:
  - Struggling: -10% spawn rate
  - Excelling: +10% spawn rate
- [ ] Cap adjustments to prevent exploitation
- [ ] Maintain minimum challenge level

## Phase 7: Integration and Polish

### 7.1 Scene Integration
- [ ] Initialize DifficultyManager in GameScene
- [ ] Connect to ScoreManager events
- [ ] Update EntitySpawner with difficulty settings
- [ ] Modify entity behaviors based on difficulty
- [ ] Add difficulty display to UI

### 7.2 Persistence and Stats
- [ ] Track highest difficulty reached
- [ ] Save difficulty stats to localStorage
- [ ] Create difficulty achievement system
- [ ] Add stats to game over screen
- [ ] Implement difficulty leaderboards

### 7.3 Debug Tools
- [ ] Add debug key to force difficulty changes
- [ ] Create visual debug overlay for difficulty stats
- [ ] Add performance metrics display
- [ ] Implement difficulty override commands
- [ ] Create difficulty testing presets

## Phase 8: Testing and Balancing

### 8.1 Unit Tests
- [ ] Create `src/managers/__tests__/DifficultyManager.test.ts`
- [ ] Test time-based progression
- [ ] Test score-based progression
- [ ] Test visual/audio feedback triggers
- [ ] Test entity behavior modifications
- [ ] Test adaptive difficulty calculations

### 8.2 Integration Tests
- [ ] Test with EntitySpawner integration
- [ ] Verify visual effects work correctly
- [ ] Test audio cue timing
- [ ] Validate UI updates properly
- [ ] Test save/load functionality

### 8.3 Balance Testing
- [ ] Test difficulty curve progression
- [ ] Verify challenge remains appropriate
- [ ] Test adaptive system responsiveness
- [ ] Validate nightmare mode difficulty
- [ ] Gather playtest feedback

## Implementation Notes

### Key Considerations:
1. Difficulty should feel natural and progressive
2. Visual/audio cues must be clear but not jarring
3. Performance impact must be minimal
4. Adaptive system should be subtle
5. Player should always feel in control

### Architecture Decisions:
1. Use event-driven updates for loose coupling
2. Store difficulty configs in separate data structure
3. Make all values easily tunable for balancing
4. Keep adaptive adjustments conservative
5. Provide clear debug/testing tools

### Performance Targets:
- Difficulty checks: < 1ms per frame
- Visual transitions: 60 FPS maintained
- No memory leaks from repeated transitions
- Efficient event handling

### Risk Mitigation:
1. Test edge cases (rapid score gains, etc.)
2. Prevent difficulty oscillation
3. Handle scene transitions gracefully
4. Validate all difficulty combinations
5. Ensure save system handles corruption