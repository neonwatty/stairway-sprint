# Stairway Sprint - Implementation Notes

This document tracks technical decisions, implementation details, and lessons learned during the development of Stairway Sprint.

## Overview

This log serves as a reference for:
- Architectural decisions and their rationale
- Implementation challenges and solutions
- Performance optimization strategies
- Code patterns and conventions
- Integration issues and resolutions

---

## Phase 1: Foundation Setup

### Task 1: Project Setup and Configuration

#### Decision: Vite over Webpack
**Date**: [TBD]
**Rationale**: 
- Faster development builds (10-100x faster)
- Better HMR (Hot Module Replacement)
- Simpler configuration
- Native ES modules support
- Built-in TypeScript support

**Implementation Notes**:
```javascript
// vite.config.js structure
export default {
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  }
}
```

#### Decision: TypeScript Strict Mode
**Date**: [TBD]
**Rationale**:
- Catches more potential bugs at compile time
- Better IDE support and autocomplete
- Easier refactoring
- Self-documenting code

**Challenges**:
- Phaser type definitions sometimes incomplete
- Need for type assertions in some cases

#### Decision: 640x960 Base Resolution
**Date**: [TBD]
**Rationale**:
- 2:3 aspect ratio works well for mobile portrait
- Scales cleanly to common resolutions
- Good balance of detail vs performance
- Lane width of 160px divides evenly

**Scaling Strategy**:
```typescript
const config = {
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 640,
    height: 960,
    min: {
      width: 320,
      height: 480
    },
    max: {
      width: 1280,
      height: 1920
    }
  }
};
```

### Task 2: Asset Preloading System

#### Decision: Asset Manifest System
**Date**: [TBD]
**Rationale**:
- Single source of truth for all assets
- Easier to manage asset versions
- Supports dynamic loading
- Enables preload progress calculation

**Implementation Pattern**:
```typescript
interface AssetManifest {
  sprites: Record<string, SpriteConfig>;
  audio: Record<string, AudioConfig>;
  // ... other asset types
}
```

#### Decision: Texture Atlases for Sprites
**Date**: [TBD]
**Rationale**:
- Reduces draw calls significantly
- Faster loading (single file)
- Better memory usage
- Supports sprite batching

**Tools**: TexturePacker or free-tex-packer

### Task 3: Main Menu Implementation

#### Decision: Scene-Based Menu System
**Date**: [TBD]
**Rationale**:
- Clean separation of concerns
- Easy to manage state
- Built-in transition support
- Memory efficient (scenes can be destroyed)

**Scene Organization**:
- MainMenuScene: Primary menu
- SettingsScene: Overlay scene
- CreditsScene: Separate scene
- PauseScene: Overlay during gameplay

---

## Phase 2: Core Game Mechanics

### Task 4: Lane System Implementation

#### Decision: Fixed Lane Positions
**Date**: [TBD]
**Rationale**:
- Predictable gameplay
- Easier collision detection
- Better mobile UX
- Consistent visual design

**Lane Configuration**:
```typescript
const LANES = {
  LEFT: { index: 0, x: 160 },
  CENTER: { index: 1, x: 320 },
  RIGHT: { index: 2, x: 480 }
};
```

#### Challenge: Smooth Lane Transitions
**Solution**: Tween-based movement with easing
```typescript
this.scene.tweens.add({
  targets: this.player,
  x: targetLane.x,
  duration: 200,
  ease: 'Quad.easeInOut'
});
```

### Task 5: Player Character Implementation

#### Decision: State Machine for Player
**Date**: [TBD]
**Rationale**:
- Clear state management
- Prevents invalid state combinations
- Easier to debug
- Extensible for new states

**States**:
- IDLE
- MOVING
- SHOOTING
- HIT
- DEAD

#### Decision: Input Buffering
**Date**: [TBD]
**Rationale**:
- More responsive feel
- Prevents dropped inputs
- Better for less precise mobile input

**Buffer Window**: 100ms

### Task 6: Entity Spawning System

#### Decision: Object Pooling Required
**Date**: [TBD]
**Rationale**:
- Constant entity creation causes GC spikes
- Mobile devices particularly affected
- Predictable memory usage
- Better performance

**Pool Sizes** (based on max concurrent):
- Strollers: 10
- Hazards: 8
- VIPs: 2
- Assassins: 2
- Projectiles: 5
- Effects: 20

#### Challenge: VIP-Assassin Pairing
**Solution**: Event-based spawning with delayed assassin
```typescript
spawnVIP() {
  const vip = this.vipPool.get();
  // ... position VIP
  
  this.time.delayedCall(2000 + Math.random() * 1000, () => {
    this.spawnAssassin(vip);
  });
}
```

### Task 7: Collision System

#### Decision: Arcade Physics over Matter.js
**Date**: [TBD]
**Rationale**:
- Simpler for 2D arcade game
- Better performance
- Easier to configure
- Built-in to Phaser

**Collision Groups**:
- Player
- Entities (strollers, hazards)
- VIPs
- Assassins
- Projectiles

#### Performance: Spatial Partitioning
**Date**: [TBD]
**Implementation**: Lane-based partitioning
- Only check collisions within same lane
- Reduces checks by ~67%

---

## Phase 3: Game Systems

### Task 8: Scoring System

#### Decision: Event-Driven Scoring
**Date**: [TBD]
**Rationale**:
- Decoupled from game logic
- Easy to modify point values
- Supports achievements/stats
- Testable

**Event System**:
```typescript
this.events.emit('score:add', {
  type: 'stroller_rescue',
  points: 100,
  combo: this.comboCount
});
```

### Task 9: Difficulty Progression

#### Decision: Hybrid Difficulty System
**Date**: [TBD]
**Rationale**:
- Time-based ensures progression
- Score milestones reward skill
- Prevents farming easy sections
- Balanced challenge curve

**Difficulty Factors**:
- Spawn rate multiplier
- Entity speed multiplier
- Hazard frequency
- VIP/Assassin frequency

### Task 10: HUD Implementation

#### Decision: Canvas-Based HUD
**Date**: [TBD]
**Rationale**:
- Better performance than DOM
- Consistent across platforms
- Integrated with game renderer
- Supports effects/animations

**HUD Layers**:
1. Static elements (borders, labels)
2. Dynamic text (score, lives)
3. Animated elements (combos, warnings)

### Task 11: Audio System

#### Decision: Web Audio API via Phaser
**Date**: [TBD]
**Rationale**:
- Built-in support
- Good cross-browser compatibility
- Spatial audio capabilities
- Low latency

#### Challenge: Mobile Audio Restrictions
**Solution**: User interaction required
```typescript
// Resume audio context on first touch
this.input.once('pointerdown', () => {
  this.sound.context.resume();
});
```

### Task 12: State Management

#### Decision: Centralized GameStateManager
**Date**: [TBD]
**Rationale**:
- Single source of truth
- Easy save/load
- Debugging friendly
- Prevents state inconsistencies

**State Structure**:
```typescript
interface GameState {
  score: number;
  lives: number;
  level: number;
  difficulty: DifficultyLevel;
  stats: GameStats;
  settings: GameSettings;
}
```

---

## Phase 4: Polish and Optimization

### Task 13: Visual Effects

#### Decision: GPU-Based Particle System
**Date**: [TBD]
**Rationale**:
- Better performance
- More particles possible
- Smooth on mobile
- Hardware accelerated

**Effect Budget**:
- Max 100 particles simultaneously
- Pool size: 200 particles
- Auto-quality adjustment based on FPS

### Task 14: Performance Optimization

#### Critical Optimizations
1. **Texture Atlases**: All sprites in 2-3 atlases
2. **Object Pooling**: All entities pooled
3. **Render Batching**: Minimize draw calls
4. **Asset Compression**: WebP for images, OGG for audio
5. **Code Splitting**: Separate vendor bundle

#### Performance Monitoring
```typescript
class PerformanceMonitor {
  private samples: number[] = [];
  
  update(delta: number) {
    this.samples.push(1000 / delta);
    if (this.samples.length > 60) {
      this.samples.shift();
    }
  }
  
  get averageFPS() {
    return this.samples.reduce((a, b) => a + b) / this.samples.length;
  }
}
```

### Task 15: Cross-Platform Testing

#### Browser-Specific Issues
**Safari iOS**:
- Audio requires user gesture
- Fullscreen API different
- Touch events need preventDefault

**Chrome Android**:
- Address bar affects viewport
- Performance varies widely by device

**Solution**: Feature detection over browser detection

---

## Code Conventions

### File Structure
```
src/
  scenes/       # All game scenes
  objects/      # Game objects/entities
  managers/     # System managers
  utils/        # Helper functions
  types/        # TypeScript types
  config/       # Configuration files
```

### Naming Conventions
- **Classes**: PascalCase (PlayerCharacter)
- **Files**: kebab-case (player-character.ts)
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase with 'I' prefix (IPlayerConfig)

### Performance Guidelines
1. Always use object pools for repeated entities
2. Minimize texture switches (use atlases)
3. Batch similar operations
4. Profile before optimizing
5. Test on lowest target device

### Common Pitfalls Avoided
1. **Memory Leaks**: Always remove event listeners
2. **GC Pressure**: Pool objects, avoid temporary objects in update loops
3. **Draw Calls**: Batch sprites, use texture atlases
4. **State Bugs**: Use proper state machine
5. **Input Lag**: Process input in update, not event handlers

---

## Debugging Tools

### Custom Debug Panel
```typescript
// Enable with ?debug=true
if (URLSearchParams.has('debug')) {
  this.scene.add('DebugScene', DebugScene, true);
}
```

Features:
- FPS display
- Entity count
- Memory usage
- Collision boxes
- State viewer

### Performance Profiling
```bash
# Development
npm run dev -- --profile

# Analyze bundle
npm run build -- --analyze
```

---

## Deployment Considerations

### Build Optimization
- Minification + tree shaking
- Asset compression (WebP, OGG)
- CDN for static assets
- Service worker for offline play

### Analytics Integration
- Track key metrics
- Error reporting
- Performance monitoring
- Player behavior

### Future Considerations
- Multiplayer possibilities
- Additional game modes
- Seasonal events
- Achievement system
- Cloud saves