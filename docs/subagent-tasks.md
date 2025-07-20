# Stairway Sprint - Subagent Tasks

This document lists all tasks suitable for delegation to subagents during the development of Stairway Sprint. These tasks are marked with 🤖 in the main todo.md file.

## Overview

Subagents can efficiently handle:
- Configuration file generation
- Boilerplate code creation  
- Test suite generation
- Asset manifest creation
- Performance profiling scripts
- Documentation generation
- Repetitive code patterns

## Phase 1: Foundation Setup

### Task 1: Project Setup and Configuration

1. **Generate TypeScript Configuration**
   - Create tsconfig.json with Phaser-specific settings
   - Include proper type definitions
   - Set up path aliases for clean imports

2. **Create Project Structure**
   - Generate complete directory structure
   - Create placeholder files for all modules
   - Set up proper file naming conventions

3. **Build Configuration Files**
   - Generate vite.config.js with optimization settings
   - Create .eslintrc with game development rules
   - Create .prettierrc for consistent formatting
   - Generate package.json scripts

### Task 2: Asset Preloading System

1. **Generate Asset Manifest**
   ```json
   {
     "sprites": {
       "player": {
         "path": "assets/sprites/player.png",
         "frameWidth": 32,
         "frameHeight": 48,
         "animations": ["idle", "walk", "shoot"]
       }
     }
   }
   ```

2. **Create Fallback Asset System**
   - Generate placeholder assets with correct dimensions
   - Create error asset handlers
   - Build retry mechanism configuration

3. **Asset Optimization Scripts**
   - Create compression scripts
   - Generate CDN configuration
   - Build cache manifest

## Phase 2: Core Game Mechanics

### Task 4: Lane System Implementation

1. **Generate Lane Configuration**
   ```typescript
   // Generate lane-config.ts
   export const LANE_CONFIG = {
     lanes: [
       { id: 0, x: 160, width: 160 },
       { id: 1, x: 320, width: 160 },
       { id: 2, x: 480, width: 160 }
     ],
     transitionTime: 0.2,
     easingFunction: 'Quad.easeInOut'
   };
   ```

2. **Performance Optimization Scripts**
   - Generate profiling utilities
   - Create performance benchmarks
   - Build optimization reports

### Task 5: Player Character Implementation

1. **Generate Input Configuration**
   ```typescript
   // Generate input-config.ts
   export const INPUT_CONFIG = {
     keyboard: {
       left: ['LEFT', 'A'],
       right: ['RIGHT', 'D'],
       shoot: ['SPACE']
     },
     touch: {
       swipeThreshold: 50,
       tapArea: { width: 100, height: 100 }
     }
   };
   ```

### Task 6: Entity Spawning System

1. **Generate Entity Templates**
   ```typescript
   // Generate entity-templates.ts
   export const ENTITY_TEMPLATES = {
     stroller: {
       speed: { min: 100, max: 150 },
       spawnRate: { min: 2, max: 4 },
       points: 100,
       sprite: 'stroller'
     },
     // ... more entities
   };
   ```

2. **Create Object Pool Configurations**
   - Generate pool size calculations
   - Create pool manager boilerplate
   - Build recycling strategies

### Task 7: Collision System

1. **Generate Collision Matrix**
   ```typescript
   // Generate collision-matrix.ts
   export const COLLISION_MATRIX = {
     player: {
       stroller: { points: 100, lives: 0, action: 'rescue' },
       hazard: { points: -2, lives: -1, action: 'damage' },
       // ... more collisions
     }
   };
   ```

2. **Create Visual Effect Configurations**
   - Generate particle effect templates
   - Create screen shake presets
   - Build effect timing configurations

## Phase 3: Game Systems

### Task 8: Scoring System

1. **Generate Score Configuration**
   - Create scoring rules matrix
   - Generate combo definitions
   - Build milestone configurations

### Task 9: Difficulty Progression

1. **Generate Difficulty Curves**
   ```typescript
   // Generate difficulty-config.ts
   export const DIFFICULTY_STAGES = [
     { name: 'Leisurely', time: 0, scoreThreshold: 0, spawnMultiplier: 1.0 },
     { name: 'Brisk', time: 30, scoreThreshold: 10, spawnMultiplier: 1.2 },
     // ... more stages
   ];
   ```

2. **Create Difficulty Test Scenarios**
   - Generate test cases for each stage
   - Create balance testing scripts
   - Build difficulty validation tools

### Task 10: HUD Implementation

1. **Generate Responsive Scaling Calculations**
   - Create breakpoint configurations
   - Generate scaling formulas
   - Build device-specific adjustments

### Task 11: Audio System

1. **Generate Audio Manifest**
   ```json
   {
     "music": {
       "menu": { "file": "menu-theme.mp3", "volume": 0.7, "loop": true },
       "game": { "file": "game-theme.mp3", "volume": 0.5, "loop": true }
     },
     "effects": {
       "rescue": { "file": "rescue.wav", "volume": 0.8 },
       // ... more effects
     }
   }
   ```

2. **Create Audio Sprite Sheets**
   - Generate audio sprite configurations
   - Create loading optimizations
   - Build audio pool settings

### Task 12: State Management

1. **Generate Save Game Schema**
   - Create state serialization format
   - Generate validation schemas
   - Build migration scripts

## Phase 4: Polish and Optimization

### Task 13: Visual Effects

1. **Generate Effect Templates**
   ```typescript
   // Generate effect-templates.ts
   export const EFFECT_TEMPLATES = {
     collision: {
       type: 'particle',
       texture: 'spark',
       lifespan: 500,
       quantity: 10,
       // ... more properties
     }
   };
   ```

### Task 14: Performance Optimization

1. **Generate Performance Profiling Suite**
   ```typescript
   // Generate performance-profiler.ts
   export class PerformanceProfiler {
     // Auto-generated profiling methods
     measureFPS(): number { }
     trackMemoryUsage(): MemoryStats { }
     countDrawCalls(): number { }
     // ... more methods
   }
   ```

2. **Create Optimization Scripts**
   - Generate texture atlas configurations
   - Create batch rendering setups
   - Build quality preset definitions

3. **Generate Memory Management Utilities**
   - Create garbage collection helpers
   - Generate memory pool configurations
   - Build leak detection scripts

### Task 15: Cross-Platform Testing

1. **Generate Test Matrices**
   ```typescript
   // Generate test-matrix.ts
   export const TEST_MATRIX = {
     browsers: ['Chrome 80+', 'Firefox 75+', 'Safari 13+', 'Edge'],
     devices: ['Desktop', 'Tablet', 'Mobile'],
     resolutions: ['320x568', '768x1024', '1920x1080'],
     // ... more test configurations
   };
   ```

2. **Create Automated Test Suites**
   - Generate browser compatibility tests
   - Create performance benchmarks
   - Build regression test scenarios

3. **Generate Accessibility Configurations**
   - Create color-blind mode settings
   - Generate ARIA labels
   - Build keyboard navigation maps

## Execution Strategy

### Priority Order
1. Configuration files (fastest wins)
2. Test suites (ensures quality)
3. Performance tools (identifies issues early)
4. Asset manifests (required for loading)
5. Template generation (speeds development)

### Batch Execution
Group related tasks for efficiency:
- All configuration files in one batch
- All test suites in one batch
- All asset-related tasks in one batch

### Validation
Each generated file should include:
- Proper TypeScript types
- JSDoc comments
- Example usage
- Test coverage

## Usage Instructions

To execute a subagent task:
1. Identify the task from this list
2. Provide clear specifications
3. Request generation with specific requirements
4. Validate the output
5. Integrate into the project

## Benefits

Using subagents for these tasks provides:
- **Consistency**: Uniform code structure
- **Speed**: Rapid file generation
- **Accuracy**: Reduced human error
- **Documentation**: Auto-generated docs
- **Maintainability**: Standardized patterns