# Vector Space - 3D Spaceship Game

## Project Overview

A browser-based 3D vector-style spaceship game built with Three.js. Players pilot a spaceship through a procedurally generated city while engaging enemy ships. Uses wireframe rendering for a retro vector aesthetic.

## Tech Stack

- **Three.js** (via CDN) - 3D rendering engine
- **Vanilla JavaScript** (ES6 modules) - Game logic
- **HTML5/CSS3** - UI and structure

## Project Structure

```
/
├── CLAUDE.md           # This file - project documentation
├── index.html          # Entry point, loads Three.js and game modules
├── styles.css          # Game UI styling
└── js/
    ├── main.js         # Game initialization and main loop
    ├── player.js       # Player spaceship class and controls
    ├── city.js         # Procedural city generation
    ├── enemies.js      # Enemy AI and spawning
    ├── combat.js       # Projectiles and collision detection
    └── hud.js          # Heads-up display overlay
```

## Architecture

### Game Loop
- Fixed timestep physics at 60 FPS
- Three.js render loop via `requestAnimationFrame`
- State machine: MENU → PLAYING → GAME_OVER

### Player Controls
- **WASD** - Forward/backward thrust, strafe left/right
- **Mouse** - Pitch and yaw (look direction)
- **Space** - Shoot
- **Shift** - Boost speed
- **Q/E** - Roll left/right

### City Generation
Buildings are placed on a grid with random variation:
- **Skyscrapers**: Tall rectangular prisms (downtown area)
- **Ballparks**: Oval stadium shapes with stands
- **Schools**: L-shaped buildings with flat roofs
- **Houses**: Small cubes with pyramid roofs (suburban areas)

### Enemy Behavior
- Patrol waypoints when player not detected
- Chase player when within detection range
- Fire projectiles at player
- Avoid buildings (basic obstacle avoidance)

### Collision System
- AABB (Axis-Aligned Bounding Box) for buildings
- Sphere colliders for ships and projectiles
- Spatial partitioning grid for performance

## Visual Style

- **Wireframe materials** on all geometry
- **Color palette**:
  - Player: Cyan (#00ffff)
  - Enemies: Red (#ff0044)
  - Buildings: Green (#00ff00)
  - Ground: Dark blue grid (#001144)
  - Projectiles: Yellow (#ffff00)
- **Post-processing**: Bloom effect for glow

## Development Commands

```bash
# Serve locally (requires any static server)
npx serve .
# or
python3 -m http.server 8000
```

## Game Constants

- World size: 2000 x 2000 units
- Building count: ~100 structures
- Max enemies: 10 active at once
- Player health: 100
- Enemy health: 25
- Projectile speed: 500 units/sec
- Player max speed: 200 units/sec

## Known Patterns

- All game objects extend a base `GameObject` class
- Use object pooling for projectiles to avoid GC
- Buildings stored in spatial hash for fast collision queries
- Enemy AI uses finite state machine (PATROL, CHASE, ATTACK)

## Code Conventions

- Use `const` by default, `let` when reassignment needed
- Classes for game objects, functions for utilities
- Three.js vectors are reused (not created per frame)
- Comments for complex math/physics calculations
