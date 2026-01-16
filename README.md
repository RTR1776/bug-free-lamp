# Vector Space - 3D Spaceship Game

A browser-based 3D vector-style spaceship game built with Three.js. Pilot your spaceship through a procedurally generated city, engage enemy ships, and survive as long as you can!

## Features

- **3D Graphics**: Real-time 3D rendering using Three.js
- **Dynamic City**: Procedurally generated city with buildings, streets, cars, and pedestrians
- **Flight Controls**: Arcade-style spaceship controls with realistic physics
- **Combat System**: Engage enemy ships in aerial dogfights
- **Living Environment**: Animated cars, walking pedestrians, street lights, and billboards
- **Retro Aesthetic**: Neon colors, bloom effects, and vector-style graphics

## How to Play

### Controls

- **W/S** - Pitch up/down (nose up/down)
- **A/D** - Yaw left/right (turn)
- **Q/E** - Roll left/right
- **Arrow Keys** - Alternative pitch controls
- **Mouse** - Fine control over pitch/yaw
- **SPACE** - Ascend
- **C** - Descend
- **SHIFT** - Boost speed
- **CLICK** - Shoot
- **CTRL** - Brake

### Objective

- Destroy enemy ships to earn points
- Avoid collisions with buildings
- Survive as long as possible

## Deployment

### Option 1: GitHub Pages

1. Push to GitHub
2. Enable GitHub Pages in repository settings
3. Select branch and root folder
4. Access at `https://yourusername.github.io/repository-name`

### Option 2: Netlify

1. Drag and drop the project folder to [Netlify Drop](https://app.netlify.com/drop)
2. Or connect your GitHub repository for automatic deployments

### Option 3: Vercel

```bash
npx vercel
```

### Option 4: Local Development

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Browser Requirements

- Modern browser with WebGL support
- Chrome, Firefox, Safari, or Edge (latest versions)
- Hardware acceleration enabled

## Project Structure

```
/
├── index.html          # Entry point
├── styles.css          # Game styling
├── README.md           # This file
├── CLAUDE.md           # Development documentation
└── js/
    ├── main.js         # Game initialization and loop
    ├── player.js       # Player spaceship controls
    ├── city.js         # City generation
    ├── enemies.js      # Enemy AI
    ├── combat.js       # Combat system
    ├── hud.js          # Heads-up display
    └── environment.js  # Streets, cars, people
```

## Tech Stack

- **Three.js** (r128) - 3D rendering engine (loaded via CDN)
- **Vanilla JavaScript** (ES6 modules)
- **HTML5/CSS3**

## Performance Tips

- Lower the number of enemies in `main.js` if experiencing lag
- Reduce particle counts in the explosion system
- Disable shadows for better performance on low-end devices

## Credits

Built with Three.js - https://threejs.org/

## License

MIT License - Feel free to use and modify!
