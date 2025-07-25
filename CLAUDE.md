# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stairway Sprint is a 2D arcade action game where players control a baby in a stroller navigating down an infinitely scrolling stairway, dodging hazards, protecting VIPs, and avoiding assassins.

## Technology Stack

- **Game Engine**: Phaser 3.x
- **Language**: JavaScript/TypeScript
- **Build Tool**: Vite (or Webpack)
- **Physics**: Phaser Arcade Physics
- **Platform**: Web browsers and mobile devices

## Development Commands

Once the project is set up, these commands should be available:
```bash
npm install        # Install dependencies
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## Architecture Overview

### Core Game Systems

1. **Lane System**: 3-lane horizontal movement (x: 160, 320, 480 on 640px canvas)
2. **Entity System**: Spawns strollers, hazards, VIPs, and assassins with defined spawn rates
3. **Collision System**: Handles interactions between player and entities
4. **Scoring System**: Points for survival, VIP protection, and special combos
5. **Difficulty System**: Progressive difficulty with 6 stages (Leisurely to Nightmare)

### Key Scenes

- `PreloadScene`: Asset loading with progress bar
- `MainMenuScene`: Title screen with navigation
- `GameScene`: Core gameplay loop
- `PauseScene`: Pause menu overlay
- `GameOverScene`: End game summary

### Performance Requirements

- Maintain 60 FPS minimum
- Load time < 3 seconds on 3G
- Memory usage < 100MB
- Canvas size: 640x960px (scales responsively)

## Development Workflow

1. **Before implementing features**: Review `/docs/tasks.json` for detailed task requirements and test strategies
2. **Asset specifications**: Check PRD for exact dimensions, colors, and behaviors
3. **Testing focus**: Each task includes specific test requirements - implement and verify these
4. **Responsive design**: Test across 320px-1920px screen widths
5. **Cross-browser**: Test on Chrome, Firefox, Safari, Edge

## Key Implementation Details

### Entity Behaviors
- **Strollers**: Move upward at player speed
- **Hazards**: Stationary obstacles
- **VIPs**: Move upward at 80% player speed
- **Assassins**: Move toward nearest VIP at 1.2x player speed

### Collision Rules
- Player + Stroller = +100 points
- Player + Hazard = -1 life
- Player + VIP = VIP protected, +50 points
- Assassin + VIP = VIP eliminated, -200 points
- Assassin + Player = -1 life, assassin removed

### Controls
- **Desktop**: Arrow keys or A/D for movement
- **Mobile**: Swipe or tap gestures
- **Pause**: ESC or P key, tap pause button on mobile

## Testing Guidelines

**IMPORTANT**: When running tests, avoid creating continuously running processes:
- Always use `npm test -- --run` for single test execution (no watch mode)
- Never use `npm test` alone as it creates a continuously running process
- For coverage reports, use `npm test:coverage -- --run`
- For specific test files, use `npm test -- --run src/path/to/test.ts`
- This project uses Vitest, not Jest

## Current Status

This is a greenfield project with comprehensive planning documentation. Begin with Task 1 from `/docs/tasks.json` to set up the development environment and basic project structure.