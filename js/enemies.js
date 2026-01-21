// Enemy AI Module
import { WORLD_SIZE, MAX_ENEMIES } from './main.js';

// Enemy AI States
const EnemyState = {
    PATROL: 'patrol',
    CHASE: 'chase',
    ATTACK: 'attack',
    EVADE: 'evade'
};

class Enemy {
    constructor(scene, position) {
        this.scene = scene;
        this.active = true;
        
        // Transform
        this.position = position.clone();
        this.velocity = new THREE.Vector3();
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.quaternion = new THREE.Quaternion();
        
        // AI State
        this.state = EnemyState.PATROL;
        this.targetPosition = null;
        this.patrolWaypoints = this.generatePatrolWaypoints();
        this.currentWaypointIndex = 0;
        
        // Stats
        this.health = 25;
        this.maxHealth = 25;
        this.speed = 80;
        this.turnSpeed = 2;
        this.detectionRange = 300;
        this.attackRange = 150;
        this.shootCooldown = 0;
        this.shootRate = 1.5; // Seconds between shots
        this.collisionRadius = 4;
        
        // Create mesh
        this.mesh = this.createMesh();
        this.scene.add(this.mesh);
        
        // Reusable vectors
        this._direction = new THREE.Vector3();
        this._toTarget = new THREE.Vector3();
        this._tempVec = new THREE.Vector3();
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        const material = new THREE.LineBasicMaterial({ 
            color: 0xff0044,
            linewidth: 2
        });
        
        // Main body - aggressive angular shape
        const bodyGeometry = new THREE.OctahedronGeometry(3);
        bodyGeometry.scale(1, 0.5, 2);
        const bodyEdges = new THREE.EdgesGeometry(bodyGeometry);
        const body = new THREE.LineSegments(bodyEdges, material);
        group.add(body);
        
        // Wings - swept back
        const wingGeometry = new THREE.BufferGeometry();
        const wingVertices = new Float32Array([
            // Left wing
            -1, 0, 0,
            -5, 0, 2,
            -4, 0, 3,
            -1, 0, 1,
            // Right wing  
            1, 0, 0,
            5, 0, 2,
            4, 0, 3,
            1, 0, 1
        ]);
        wingGeometry.setAttribute('position', new THREE.BufferAttribute(wingVertices, 3));
        wingGeometry.setIndex([0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4]);
        const wings = new THREE.LineSegments(wingGeometry, material);
        group.add(wings);
        
        // Cockpit
        const cockpitGeometry = new THREE.SphereGeometry(1, 4, 3);
        cockpitGeometry.translate(0, 0.3, -1);
        const cockpitEdges = new THREE.EdgesGeometry(cockpitGeometry);
        const cockpit = new THREE.LineSegments(cockpitEdges, material);
        group.add(cockpit);
        
        // Engine trails
        const engineMaterial = new THREE.LineBasicMaterial({ color: 0xff4400 });
        const engineGeometry = new THREE.ConeGeometry(0.5, 2, 4);
        engineGeometry.rotateX(-Math.PI / 2);
        engineGeometry.translate(0, 0, 4);
        const engineEdges = new THREE.EdgesGeometry(engineGeometry);
        const engine = new THREE.LineSegments(engineEdges, engineMaterial);
        group.add(engine);
        
        return group;
    }
    
    generatePatrolWaypoints() {
        const waypoints = [];
        const numWaypoints = 4;
        const patrolRadius = 100 + Math.random() * 200;
        const centerX = this.position.x;
        const centerZ = this.position.z;
        
        for (let i = 0; i < numWaypoints; i++) {
            const angle = (i / numWaypoints) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * patrolRadius;
            const z = centerZ + Math.sin(angle) * patrolRadius;
            const y = 30 + Math.random() * 50;
            waypoints.push(new THREE.Vector3(x, y, z));
        }
        
        return waypoints;
    }
    
    update(deltaTime, player, combatSystem, buildings, audioSystem) {
        if (!this.active) return;
        
        // Update shoot cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
        
        const playerPos = player.getPosition();
        const distanceToPlayer = this.position.distanceTo(playerPos);
        
        // State machine
        this.updateState(distanceToPlayer);
        
        // Execute behavior based on state
        switch (this.state) {
            case EnemyState.PATROL:
                this.patrol(deltaTime);
                break;
            case EnemyState.CHASE:
                this.chase(deltaTime, playerPos);
                break;
            case EnemyState.ATTACK:
                this.attack(deltaTime, playerPos, combatSystem, audioSystem);
                break;
            case EnemyState.EVADE:
                this.evade(deltaTime, buildings);
                break;
        }
        
        // Apply velocity
        this._tempVec.copy(this.velocity).multiplyScalar(deltaTime);
        this.position.add(this._tempVec);
        
        // Clamp to world bounds
        this.clampToWorld();
        
        // Update mesh
        this.mesh.position.copy(this.position);
        this.mesh.quaternion.copy(this.quaternion);
    }
    
    updateState(distanceToPlayer) {
        if (distanceToPlayer < this.attackRange) {
            this.state = EnemyState.ATTACK;
        } else if (distanceToPlayer < this.detectionRange) {
            this.state = EnemyState.CHASE;
        } else {
            this.state = EnemyState.PATROL;
        }
    }
    
    patrol(deltaTime) {
        const waypoint = this.patrolWaypoints[this.currentWaypointIndex];
        const distanceToWaypoint = this.position.distanceTo(waypoint);
        
        if (distanceToWaypoint < 10) {
            // Move to next waypoint
            this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.patrolWaypoints.length;
        }
        
        this.moveToward(waypoint, this.speed * 0.5, deltaTime);
    }
    
    chase(deltaTime, playerPos) {
        // Predict player position slightly
        const predictedPos = playerPos.clone();
        this.moveToward(predictedPos, this.speed, deltaTime);
    }
    
    attack(deltaTime, playerPos, combatSystem, audioSystem) {
        // Slow down and aim at player
        this.moveToward(playerPos, this.speed * 0.3, deltaTime);
        
        // Shoot if cooldown allows
        if (this.shootCooldown <= 0) {
            this.shoot(playerPos, combatSystem);
            this.shootCooldown = this.shootRate;
            if (audioSystem) {
                audioSystem.playShoot(false);
            }
        }
    }
    
    evade(deltaTime, buildings) {
        // Find direction away from nearest building
        let nearestBuilding = null;
        let nearestDist = Infinity;
        
        for (const building of buildings) {
            const center = new THREE.Vector3();
            building.bbox.getCenter(center);
            const dist = this.position.distanceTo(center);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestBuilding = building;
            }
        }
        
        if (nearestBuilding) {
            const center = new THREE.Vector3();
            nearestBuilding.bbox.getCenter(center);
            const awayDir = this.position.clone().sub(center).normalize();
            const evadeTarget = this.position.clone().add(awayDir.multiplyScalar(50));
            this.moveToward(evadeTarget, this.speed, deltaTime);
        }
    }
    
    moveToward(target, speed, deltaTime) {
        this._toTarget.copy(target).sub(this.position);
        const distance = this._toTarget.length();
        
        if (distance > 1) {
            this._toTarget.normalize();
            
            // Smooth rotation toward target
            const targetRotY = Math.atan2(this._toTarget.x, this._toTarget.z);
            const targetRotX = -Math.asin(this._toTarget.y);
            
            // Lerp rotation
            this.rotation.y += (targetRotY - this.rotation.y) * this.turnSpeed * deltaTime;
            this.rotation.x += (targetRotX - this.rotation.x) * this.turnSpeed * deltaTime;
            
            this.quaternion.setFromEuler(this.rotation);
            
            // Set velocity in facing direction
            this._direction.set(0, 0, 1).applyQuaternion(this.quaternion);
            this.velocity.copy(this._direction).multiplyScalar(speed);
        } else {
            this.velocity.multiplyScalar(0.9);
        }
    }
    
    shoot(targetPos, combatSystem) {
        const direction = targetPos.clone().sub(this.position).normalize();
        
        // Add some inaccuracy
        direction.x += (Math.random() - 0.5) * 0.1;
        direction.y += (Math.random() - 0.5) * 0.1;
        direction.z += (Math.random() - 0.5) * 0.1;
        direction.normalize();
        
        combatSystem.createProjectile(this.position.clone(), direction, 'enemy');
    }
    
    clampToWorld() {
        const halfWorld = WORLD_SIZE / 2 - 50;
        
        this.position.x = Math.max(-halfWorld, Math.min(halfWorld, this.position.x));
        this.position.z = Math.max(-halfWorld, Math.min(halfWorld, this.position.z));
        this.position.y = Math.max(20, Math.min(200, this.position.y));
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        // Flash white
        this.mesh.traverse((child) => {
            if (child.material) {
                const originalColor = child.material.color.getHex();
                child.material.color.setHex(0xffffff);
                setTimeout(() => {
                    child.material.color.setHex(originalColor);
                }, 50);
            }
        });
        
        if (this.health <= 0) {
            this.destroy();
        }
    }
    
    destroy() {
        this.active = false;
        this.scene.remove(this.mesh);
        
        // Dispose geometry and materials
        this.mesh.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }
    
    getPosition() {
        return this.position.clone();
    }
}

export class EnemyManager {
    constructor(scene, cityGenerator) {
        this.scene = scene;
        this.cityGenerator = cityGenerator;
        this.enemies = [];
        this.spawnCooldown = 0;
        this.spawnRate = 5; // Seconds between spawns
        this.baseSpawnRate = 5;
        
        // Difficulty settings
        this.difficultyLevel = 1;
        this.enemyHealthMultiplier = 1;
        this.enemyDamageMultiplier = 1;
        this.enemySpeedMultiplier = 1;
        this.maxEnemies = MAX_ENEMIES;
    }
    
    setDifficulty(level) {
        this.difficultyLevel = level;
        
        // Scale enemy stats with difficulty
        this.enemyHealthMultiplier = 1 + (level - 1) * 0.2; // +20% health per level
        this.enemyDamageMultiplier = 1 + (level - 1) * 0.15; // +15% damage per level
        this.enemySpeedMultiplier = 1 + (level - 1) * 0.1; // +10% speed per level
        
        // Spawn faster at higher difficulties
        this.spawnRate = Math.max(2, this.baseSpawnRate - (level - 1) * 0.5);
        
        // More enemies at higher difficulties
        this.maxEnemies = Math.min(MAX_ENEMIES + Math.floor(level / 2), 20);
    }
    
    spawnInitialEnemies() {
        const initialCount = 5;
        for (let i = 0; i < initialCount; i++) {
            this.spawnEnemy();
        }
    }
    
    spawnEnemy() {
        if (this.enemies.length >= this.maxEnemies) return;
        
        // Find spawn position away from buildings
        let position = null;
        let attempts = 0;
        
        while (!position && attempts < 20) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 200 + Math.random() * 600;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = 50 + Math.random() * 100;
            
            const testPos = new THREE.Vector3(x, y, z);
            
            // Check if position is clear
            let clear = true;
            for (const building of this.cityGenerator.getBuildings()) {
                if (building.bbox.containsPoint(testPos)) {
                    clear = false;
                    break;
                }
            }
            
            if (clear) {
                position = testPos;
            }
            attempts++;
        }
        
        if (position) {
            const enemy = new Enemy(this.scene, position);
            
            // Apply difficulty scaling
            enemy.maxHealth = Math.floor(enemy.maxHealth * this.enemyHealthMultiplier);
            enemy.health = enemy.maxHealth;
            enemy.speed = enemy.speed * this.enemySpeedMultiplier;
            enemy.shootRate = Math.max(0.5, enemy.shootRate / this.enemyDamageMultiplier);
            
            this.enemies.push(enemy);
        }
    }
    
    update(deltaTime, player, combatSystem, audioSystem) {
        const buildings = this.cityGenerator.getBuildings();
        
        // Update all enemies
        for (const enemy of this.enemies) {
            enemy.update(deltaTime, player, combatSystem, buildings, audioSystem);
        }
        
        // Remove dead enemies
        this.enemies = this.enemies.filter(e => e.active);
        
        // Spawn new enemies
        this.spawnCooldown -= deltaTime;
        if (this.spawnCooldown <= 0 && this.enemies.length < this.maxEnemies) {
            this.spawnEnemy();
            this.spawnCooldown = this.spawnRate;
        }
    }
    
    getEnemies() {
        return this.enemies;
    }
    
    clear() {
        for (const enemy of this.enemies) {
            enemy.destroy();
        }
        this.enemies = [];
    }
}
