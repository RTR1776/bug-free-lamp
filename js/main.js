// Vector Space - Main Game Module
import { Player } from './player.js';
import { CityGenerator } from './city.js';
import { EnemyManager } from './enemies.js';
import { CombatSystem } from './combat.js';
import { HUD } from './hud.js';
import { Environment } from './environment.js';

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
        this.environment = null;
        this.particleSystem = null;
        
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
        
        // Generate the city first
        this.cityGenerator.generate();
        
        // Then add environment (streets, cars, people)
        this.environment = new Environment(this.scene);
        
        // Initialize particle system
        this.initParticleSystem();
        
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
        this.renderer.setClearColor(0x87CEEB); // Sky blue background
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Enable tone mapping for realistic HDR-like rendering
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    
    setupScene() {
        this.scene = new THREE.Scene();

        // Daytime atmospheric fog - light blue haze
        this.scene.fog = new THREE.FogExp2(0xc9e6ff, 0.0004);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            3000
        );
        this.camera.position.set(0, 150, 320);

        // Daytime skybox - blue sky gradient
        const skyGeometry = new THREE.SphereGeometry(1500, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },    // Deep blue at top
                bottomColor: { value: new THREE.Color(0xc9e6ff) }, // Light blue at horizon
                sunColor: { value: new THREE.Color(0xffffee) },    // Sun color
                sunDirection: { value: new THREE.Vector3(0.5, 0.7, 0.3).normalize() },
                offset: { value: 400 },
                exponent: { value: 0.4 }
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
                uniform vec3 sunColor;
                uniform vec3 sunDirection;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    vec3 direction = normalize(vWorldPosition + offset);
                    float h = direction.y;

                    // Sky gradient
                    vec3 skyColor = mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0));

                    // Sun glow
                    float sunDot = max(dot(direction, sunDirection), 0.0);
                    float sunGlow = pow(sunDot, 64.0) * 1.5;  // Sharp sun disc
                    float sunHalo = pow(sunDot, 8.0) * 0.3;   // Soft halo around sun

                    vec3 finalColor = skyColor + sunColor * (sunGlow + sunHalo);

                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);

        // Clouds (simple fluffy cloud layer)
        this.createClouds();

        // World boundary visualization - subtle for daytime
        const boundaryGeometry = new THREE.BoxGeometry(WORLD_SIZE, 200, WORLD_SIZE);
        const boundaryEdges = new THREE.EdgesGeometry(boundaryGeometry);
        const boundaryMaterial = new THREE.LineBasicMaterial({
            color: 0x4488cc,
            transparent: true,
            opacity: 0.15
        });
        const boundaryLines = new THREE.LineSegments(boundaryEdges, boundaryMaterial);
        boundaryLines.position.y = 100;
        this.scene.add(boundaryLines);
    }

    createClouds() {
        // Create simple cloud sprites scattered across the sky
        const cloudGroup = new THREE.Group();

        for (let i = 0; i < 30; i++) {
            const cloudGeometry = new THREE.PlaneGeometry(
                80 + Math.random() * 120,
                40 + Math.random() * 60
            );
            const cloudMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.7 + Math.random() * 0.2,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);

            // Position clouds in a dome above the city
            const angle = Math.random() * Math.PI * 2;
            const radius = 300 + Math.random() * 600;
            cloud.position.set(
                Math.cos(angle) * radius,
                200 + Math.random() * 300,
                Math.sin(angle) * radius
            );
            cloud.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
            cloud.rotation.z = Math.random() * Math.PI;

            cloudGroup.add(cloud);
        }

        this.scene.add(cloudGroup);
        this.clouds = cloudGroup;
    }
    
    setupLighting() {
        // Ambient light - softer for realistic global illumination
        const ambient = new THREE.AmbientLight(0x87CEEB, 0.4);
        this.scene.add(ambient);

        // Hemisphere light - sky blue above, ground brown/green below
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3d5c3d, 0.6);
        this.scene.add(hemiLight);

        // Main directional light (SUNLIGHT) - warm white, strong intensity
        this.sunLight = new THREE.DirectionalLight(0xfffaf0, 2.0);
        this.sunLight.position.set(300, 500, 200);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 4096;
        this.sunLight.shadow.mapSize.height = 4096;
        this.sunLight.shadow.camera.near = 10;
        this.sunLight.shadow.camera.far = 1500;
        this.sunLight.shadow.camera.left = -800;
        this.sunLight.shadow.camera.right = 800;
        this.sunLight.shadow.camera.top = 800;
        this.sunLight.shadow.camera.bottom = -800;
        this.sunLight.shadow.bias = -0.0001;
        this.sunLight.shadow.normalBias = 0.02;
        this.scene.add(this.sunLight);

        // Secondary fill light (bounce light from sky) - subtle blue
        const fillLight = new THREE.DirectionalLight(0x8ec8ff, 0.3);
        fillLight.position.set(-200, 300, -100);
        this.scene.add(fillLight);

        // Subtle rim/back light for depth
        const rimLight = new THREE.DirectionalLight(0xfff5e6, 0.2);
        rimLight.position.set(-100, 200, -300);
        this.scene.add(rimLight);
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
    
    initParticleSystem() {
        // Explosion particle pool
        this.explosionParticles = [];
        this.maxExplosionParticles = 500;
        
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(this.maxExplosionParticles * 3);
        const colors = new Float32Array(this.maxExplosionParticles * 3);
        const sizes = new Float32Array(this.maxExplosionParticles);
        
        for (let i = 0; i < this.maxExplosionParticles; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = -1000; // Hidden below ground
            positions[i * 3 + 2] = 0;
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 0.5;
            colors[i * 3 + 2] = 0;
            sizes[i] = 0;
            
            this.explosionParticles.push({
                active: false,
                velocity: new THREE.Vector3(),
                life: 0,
                maxLife: 1,
                index: i
            });
        }
        
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMat = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.explosionMesh = new THREE.Points(particleGeo, particleMat);
        this.scene.add(this.explosionMesh);
    }
    
    createExplosion(position, color = { r: 1, g: 0.5, b: 0 }, count = 30) {
        const positions = this.explosionMesh.geometry.attributes.position.array;
        const colors = this.explosionMesh.geometry.attributes.color.array;
        const sizes = this.explosionMesh.geometry.attributes.size.array;
        
        let spawned = 0;
        for (const particle of this.explosionParticles) {
            if (!particle.active && spawned < count) {
                particle.active = true;
                particle.life = 0;
                particle.maxLife = 0.5 + Math.random() * 0.5;
                
                const i = particle.index;
                positions[i * 3] = position.x + (Math.random() - 0.5) * 2;
                positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 2;
                positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 2;
                
                particle.velocity.set(
                    (Math.random() - 0.5) * 60,
                    (Math.random() - 0.5) * 60,
                    (Math.random() - 0.5) * 60
                );
                
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
                sizes[i] = 3 + Math.random() * 3;
                
                spawned++;
            }
        }
        
        this.explosionMesh.geometry.attributes.position.needsUpdate = true;
        this.explosionMesh.geometry.attributes.color.needsUpdate = true;
        this.explosionMesh.geometry.attributes.size.needsUpdate = true;
    }
    
    updateParticles(deltaTime) {
        const positions = this.explosionMesh.geometry.attributes.position.array;
        const sizes = this.explosionMesh.geometry.attributes.size.array;
        let needsUpdate = false;
        
        for (const particle of this.explosionParticles) {
            if (particle.active) {
                particle.life += deltaTime;
                
                if (particle.life >= particle.maxLife) {
                    particle.active = false;
                    positions[particle.index * 3 + 1] = -1000;
                    sizes[particle.index] = 0;
                    needsUpdate = true;
                    continue;
                }
                
                const i = particle.index;
                positions[i * 3] += particle.velocity.x * deltaTime;
                positions[i * 3 + 1] += particle.velocity.y * deltaTime;
                positions[i * 3 + 2] += particle.velocity.z * deltaTime;
                
                // Fade out
                const lifeRatio = 1 - (particle.life / particle.maxLife);
                sizes[i] = lifeRatio * (3 + Math.random() * 2);
                
                // Slow down
                particle.velocity.multiplyScalar(0.98);
                
                needsUpdate = true;
            }
        }
        
        if (needsUpdate) {
            this.explosionMesh.geometry.attributes.position.needsUpdate = true;
            this.explosionMesh.geometry.attributes.size.needsUpdate = true;
        }
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
        
        // Update environment (cars, people, etc.)
        this.environment.update(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
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
                            
                            // Small hit effect
                            this.createExplosion(projectile.position, { r: 0, g: 1, b: 1 }, 10);
                            
                            if (!enemy.active) {
                                // Big explosion when destroyed
                                this.createExplosion(enemy.getPosition(), { r: 1, g: 0.5, b: 0 }, 50);
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
                        this.createExplosion(projectile.position, { r: 1, g: 0, b: 0 }, 15);
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
