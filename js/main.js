// Vector Space - Main Game Module
import { Player } from './player.js';
import { CityGenerator } from './city.js';
import { EnemyManager } from './enemies.js';
import { CombatSystem } from './combat.js';
import { HUD } from './hud.js';

// Game Constants
export const WORLD_SIZE = 2000;
export const BUILDING_COUNT = 100;
export const MAX_ENEMIES = 10;

// Game States
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'gameover'
};

class Game {
    constructor() {
        this.state = GameState.MENU;
        this.score = 0;
        this.enemiesDestroyed = 0;
        
        // Three.js core
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // Game systems
        this.player = null;
        this.cityGenerator = null;
        this.enemyManager = null;
        this.combatSystem = null;
        this.hud = null;
        
        // Timing
        this.clock = new THREE.Clock();
        this.deltaTime = 0;
        
        // Input state
        this.keys = {};
        this.mouse = { x: 0, y: 0, locked: false };
        
        this.init();
    }
    
    init() {
        this.setupRenderer();
        this.setupScene();
        this.setupLighting();
        this.setupEventListeners();
        this.setupUI();
        
        // Initialize game systems
        this.cityGenerator = new CityGenerator(this.scene);
        this.player = new Player(this.scene, this.camera);
        this.enemyManager = new EnemyManager(this.scene, this.cityGenerator);
        this.combatSystem = new CombatSystem(this.scene);
        this.hud = new HUD();
        
        // Generate the city
        this.cityGenerator.generate();
        
        // Start render loop
        this.animate();
    }
    
    setupRenderer() {
        const canvas = document.getElementById('game-canvas');
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000816);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        
        // Add fog for depth and atmosphere
        this.scene.fog = new THREE.FogExp2(0x000816, 0.0008);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            3000
        );
        this.camera.position.set(0, 150, 320);
        
        // Skybox - simple gradient background
        const skyGeometry = new THREE.SphereGeometry(1500, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x000816) },
                bottomColor: { value: new THREE.Color(0x001133) },
                offset: { value: 400 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
        
        // Stars
        const starsGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        for (let i = 0; i < 2000; i++) {
            const r = 1400;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            starPositions.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta) * 0.5 + 200, // Bias upward
                r * Math.cos(phi)
            );
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        const starsMaterial = new THREE.PointsMaterial({ 
            color: 0xffffff, 
            size: 2,
            transparent: true,
            opacity: 0.8
        });
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
        
        // World boundary visualization
        const boundaryGeometry = new THREE.BoxGeometry(WORLD_SIZE, 200, WORLD_SIZE);
        const boundaryEdges = new THREE.EdgesGeometry(boundaryGeometry);
        const boundaryMaterial = new THREE.LineBasicMaterial({ 
            color: 0x003366,
            transparent: true,
            opacity: 0.3
        });
        const boundaryLines = new THREE.LineSegments(boundaryEdges, boundaryMaterial);
        boundaryLines.position.y = 100;
        this.scene.add(boundaryLines);
    }
    
    setupLighting() {
        // Ambient light for base visibility
        const ambient = new THREE.AmbientLight(0x334455, 0.4);
        this.scene.add(ambient);
        
        // Hemisphere light for sky/ground color variation
        const hemiLight = new THREE.HemisphereLight(0x4488cc, 0x002211, 0.4);
        this.scene.add(hemiLight);
        
        // Main directional light (moonlight)
        const moonLight = new THREE.DirectionalLight(0x6688bb, 0.6);
        moonLight.position.set(200, 400, 100);
        moonLight.castShadow = true;
        moonLight.shadow.mapSize.width = 2048;
        moonLight.shadow.mapSize.height = 2048;
        moonLight.shadow.camera.near = 10;
        moonLight.shadow.camera.far = 1000;
        moonLight.shadow.camera.left = -500;
        moonLight.shadow.camera.right = 500;
        moonLight.shadow.camera.top = 500;
        moonLight.shadow.camera.bottom = -500;
        this.scene.add(moonLight);
        
        // Point lights for city glow
        const cityLight1 = new THREE.PointLight(0x00ffff, 0.5, 400);
        cityLight1.position.set(0, 50, 0);
        this.scene.add(cityLight1);
        
        const cityLight2 = new THREE.PointLight(0xff4400, 0.3, 300);
        cityLight2.position.set(100, 30, -100);
        this.scene.add(cityLight2);
    }
    
    setupEventListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Prevent default for game keys
            if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse movement
        window.addEventListener('mousemove', (e) => {
            if (this.mouse.locked) {
                this.mouse.x += e.movementX;
                this.mouse.y += e.movementY;
            }
        });
        
        // Pointer lock
        document.addEventListener('pointerlockchange', () => {
            this.mouse.locked = document.pointerLockElement === document.body;
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Mouse click for shooting
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0 && this.state === GameState.PLAYING) {
                this.playerShoot();
            }
        });
    }
    
    setupUI() {
        const startButton = document.getElementById('start-button');
        const restartButton = document.getElementById('restart-button');
        
        startButton.addEventListener('click', () => this.startGame());
        restartButton.addEventListener('click', () => this.restartGame());
    }
    
    startGame() {
        this.state = GameState.PLAYING;
        this.score = 0;
        this.enemiesDestroyed = 0;
        
        // Hide menu, show HUD
        document.getElementById('menu-screen').classList.add('hidden');
        document.getElementById('hud').classList.add('active');
        
        // Lock pointer
        document.body.requestPointerLock();
        
        // Reset player
        this.player.reset();
        
        // Spawn initial enemies
        this.enemyManager.spawnInitialEnemies();
    }
    
    restartGame() {
        // Hide game over screen
        document.getElementById('gameover-screen').classList.add('hidden');
        
        // Clear enemies and projectiles
        this.enemyManager.clear();
        this.combatSystem.clear();
        
        // Start fresh
        this.startGame();
    }
    
    gameOver() {
        this.state = GameState.GAME_OVER;
        
        // Exit pointer lock
        document.exitPointerLock();
        
        // Update and show game over screen
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('enemies-destroyed').textContent = this.enemiesDestroyed;
        document.getElementById('hud').classList.remove('active');
        document.getElementById('gameover-screen').classList.remove('hidden');
    }
    
    playerShoot() {
        if (this.player.canShoot()) {
            const projectile = this.combatSystem.createProjectile(
                this.player.getPosition(),
                this.player.getDirection(),
                'player'
            );
            this.player.onShoot();
        }
    }
    
    addScore(points) {
        this.score += points;
        this.enemiesDestroyed++;
    }
    
    update(deltaTime) {
        if (this.state !== GameState.PLAYING) return;
        
        // Update player
        this.player.update(deltaTime, this.keys, this.mouse);
        
        // Reset mouse delta after processing
        this.mouse.x = 0;
        this.mouse.y = 0;
        
        // Update enemies
        this.enemyManager.update(deltaTime, this.player, this.combatSystem);
        
        // Update projectiles and check collisions
        this.combatSystem.update(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Update HUD
        this.hud.update(this.player, this.score, this.enemyManager.getEnemies());
        
        // Check player death
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }
    
    checkCollisions() {
        const playerPos = this.player.getPosition();
        const playerRadius = this.player.collisionRadius;
        
        // Player vs buildings
        const buildings = this.cityGenerator.getBuildings();
        for (const building of buildings) {
            if (this.checkBoxSphereCollision(building.bbox, playerPos, playerRadius)) {
                this.player.onBuildingCollision(building);
            }
        }
        
        // Projectiles vs enemies
        const projectiles = this.combatSystem.getProjectiles();
        const enemies = this.enemyManager.getEnemies();
        
        for (const projectile of projectiles) {
            if (projectile.owner === 'player') {
                // Check against enemies
                for (const enemy of enemies) {
                    if (projectile.active && enemy.active) {
                        const dist = projectile.position.distanceTo(enemy.getPosition());
                        if (dist < enemy.collisionRadius) {
                            enemy.takeDamage(projectile.damage);
                            projectile.active = false;
                            
                            if (!enemy.active) {
                                this.addScore(100);
                            }
                        }
                    }
                }
            } else {
                // Enemy projectile vs player
                if (projectile.active) {
                    const dist = projectile.position.distanceTo(playerPos);
                    if (dist < playerRadius) {
                        this.player.takeDamage(projectile.damage);
                        projectile.active = false;
                    }
                }
            }
            
            // Projectiles vs buildings
            if (projectile.active) {
                for (const building of buildings) {
                    if (this.checkPointInBox(projectile.position, building.bbox)) {
                        projectile.active = false;
                        break;
                    }
                }
            }
        }
    }
    
    checkBoxSphereCollision(box, sphereCenter, sphereRadius) {
        // Find closest point on box to sphere center
        const closest = new THREE.Vector3(
            Math.max(box.min.x, Math.min(sphereCenter.x, box.max.x)),
            Math.max(box.min.y, Math.min(sphereCenter.y, box.max.y)),
            Math.max(box.min.z, Math.min(sphereCenter.z, box.max.z))
        );
        
        const distance = closest.distanceTo(sphereCenter);
        return distance < sphereRadius;
    }
    
    checkPointInBox(point, box) {
        return (
            point.x >= box.min.x && point.x <= box.max.x &&
            point.y >= box.min.y && point.y <= box.max.y &&
            point.z >= box.min.z && point.z <= box.max.z
        );
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.deltaTime = this.clock.getDelta();
        
        // Cap delta time to prevent huge jumps
        if (this.deltaTime > 0.1) this.deltaTime = 0.1;
        
        this.update(this.deltaTime);
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    window.game = new Game();
});
