// Power-Up System Module
import { WORLD_SIZE } from './main.js';

// Power-up types
export const PowerUpType = {
    HEALTH: 'health',
    SHIELD: 'shield',
    RAPID_FIRE: 'rapid_fire',
    SPREAD_SHOT: 'spread_shot',
    DAMAGE_BOOST: 'damage_boost',
    SPEED_BOOST: 'speed_boost'
};

const POWERUP_CONFIG = {
    [PowerUpType.HEALTH]: {
        color: 0x00ff00,
        emissive: 0x00ff00,
        duration: 0, // Instant effect
        value: 30,
        symbol: '+',
        name: 'HEALTH'
    },
    [PowerUpType.SHIELD]: {
        color: 0x00ffff,
        emissive: 0x00ffff,
        duration: 10,
        value: 50, // Shield HP
        symbol: 'O',
        name: 'SHIELD'
    },
    [PowerUpType.RAPID_FIRE]: {
        color: 0xffff00,
        emissive: 0xffff00,
        duration: 8,
        value: 0.5, // Shoot rate multiplier
        symbol: '»',
        name: 'RAPID FIRE'
    },
    [PowerUpType.SPREAD_SHOT]: {
        color: 0xff00ff,
        emissive: 0xff00ff,
        duration: 10,
        value: 3, // Number of projectiles
        symbol: 'Y',
        name: 'SPREAD SHOT'
    },
    [PowerUpType.DAMAGE_BOOST]: {
        color: 0xff4400,
        emissive: 0xff4400,
        duration: 12,
        value: 2, // Damage multiplier
        symbol: '!',
        name: 'DAMAGE x2'
    },
    [PowerUpType.SPEED_BOOST]: {
        color: 0x44ff88,
        emissive: 0x44ff88,
        duration: 8,
        value: 1.5, // Speed multiplier
        symbol: '^',
        name: 'SPEED BOOST'
    }
};

class PowerUp {
    constructor(scene, position, type) {
        this.scene = scene;
        this.type = type;
        this.config = POWERUP_CONFIG[type];
        this.active = true;
        this.position = position.clone();
        this.lifetime = 0;
        this.maxLifetime = 15; // Despawn after 15 seconds
        this.collisionRadius = 5;
        this.rotationSpeed = 2;
        this.bobSpeed = 3;
        this.bobAmount = 2;
        this.baseY = position.y;
        
        this.mesh = this.createMesh();
        this.scene.add(this.mesh);
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Outer glow sphere
        const glowGeo = new THREE.SphereGeometry(4, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: this.config.color,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);
        this.glowMesh = glow;
        
        // Inner shape based on type
        let innerGeo;
        switch (this.type) {
            case PowerUpType.HEALTH:
                // Cross shape for health
                innerGeo = this.createCrossGeometry();
                break;
            case PowerUpType.SHIELD:
                // Octahedron for shield
                innerGeo = new THREE.OctahedronGeometry(2);
                break;
            case PowerUpType.RAPID_FIRE:
                // Double cone for rapid fire
                innerGeo = new THREE.ConeGeometry(1.5, 3, 6);
                break;
            case PowerUpType.SPREAD_SHOT:
                // Tetrahedron for spread
                innerGeo = new THREE.TetrahedronGeometry(2.5);
                break;
            case PowerUpType.DAMAGE_BOOST:
                // Box for damage
                innerGeo = new THREE.BoxGeometry(2.5, 2.5, 2.5);
                break;
            case PowerUpType.SPEED_BOOST:
                // Icosahedron for speed
                innerGeo = new THREE.IcosahedronGeometry(2);
                break;
            default:
                innerGeo = new THREE.SphereGeometry(2, 8, 8);
        }
        
        const innerMat = new THREE.MeshStandardMaterial({
            color: this.config.color,
            emissive: this.config.emissive,
            emissiveIntensity: 0.8,
            metalness: 0.3,
            roughness: 0.2
        });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        group.add(inner);
        this.innerMesh = inner;
        
        // Wireframe
        const wireMat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });
        const wireGeo = new THREE.EdgesGeometry(innerGeo);
        const wire = new THREE.LineSegments(wireGeo, wireMat);
        group.add(wire);
        
        // Point light
        const light = new THREE.PointLight(this.config.color, 1, 20);
        group.add(light);
        this.light = light;
        
        group.position.copy(this.position);
        return group;
    }
    
    createCrossGeometry() {
        const shape = new THREE.Shape();
        const w = 0.6;
        const l = 1.5;
        
        shape.moveTo(-w, l);
        shape.lineTo(w, l);
        shape.lineTo(w, w);
        shape.lineTo(l, w);
        shape.lineTo(l, -w);
        shape.lineTo(w, -w);
        shape.lineTo(w, -l);
        shape.lineTo(-w, -l);
        shape.lineTo(-w, -w);
        shape.lineTo(-l, -w);
        shape.lineTo(-l, w);
        shape.lineTo(-w, w);
        shape.closePath();
        
        return new THREE.ExtrudeGeometry(shape, {
            depth: 1,
            bevelEnabled: false
        });
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.lifetime += deltaTime;
        
        // Despawn after max lifetime
        if (this.lifetime >= this.maxLifetime) {
            this.destroy();
            return;
        }
        
        // Rotation
        this.innerMesh.rotation.y += this.rotationSpeed * deltaTime;
        this.innerMesh.rotation.x += this.rotationSpeed * 0.5 * deltaTime;
        
        // Bobbing motion
        this.mesh.position.y = this.baseY + Math.sin(this.lifetime * this.bobSpeed) * this.bobAmount;
        
        // Pulsing glow
        const pulse = 0.15 + Math.sin(this.lifetime * 5) * 0.1;
        this.glowMesh.material.opacity = pulse;
        this.light.intensity = 0.5 + Math.sin(this.lifetime * 5) * 0.3;
        
        // Flash when about to despawn
        if (this.lifetime > this.maxLifetime - 3) {
            const flash = Math.sin(this.lifetime * 15) > 0;
            this.mesh.visible = flash;
        }
    }
    
    collect() {
        this.active = false;
        this.scene.remove(this.mesh);
        return {
            type: this.type,
            config: this.config
        };
    }
    
    destroy() {
        this.active = false;
        this.scene.remove(this.mesh);
        
        if (this.mesh) {
            this.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
    }
    
    getPosition() {
        return this.position;
    }
}

export class PowerUpManager {
    constructor(scene) {
        this.scene = scene;
        this.powerUps = [];
        this.spawnTimer = 0;
        this.spawnInterval = 8; // Spawn every 8 seconds
        this.maxPowerUps = 5;
    }
    
    update(deltaTime, playerPos) {
        // Update existing power-ups
        for (const powerUp of this.powerUps) {
            powerUp.update(deltaTime);
        }
        
        // Remove inactive power-ups
        this.powerUps = this.powerUps.filter(p => p.active);
        
        // Spawn new power-ups
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval && this.powerUps.length < this.maxPowerUps) {
            this.spawnRandomPowerUp(playerPos);
            this.spawnTimer = 0;
        }
    }
    
    spawnRandomPowerUp(playerPos) {
        // Choose random type with weighted probabilities
        const types = Object.values(PowerUpType);
        const weights = [0.25, 0.15, 0.2, 0.15, 0.15, 0.1]; // Health more common
        
        let random = Math.random();
        let typeIndex = 0;
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                typeIndex = i;
                break;
            }
        }
        
        // Find spawn position - near player but not too close
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 200;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        
        // Add player position offset
        let spawnX = (playerPos?.x || 0) + x;
        let spawnZ = (playerPos?.z || 0) + z;
        
        // Clamp to world bounds
        const halfWorld = WORLD_SIZE / 2 - 100;
        spawnX = Math.max(-halfWorld, Math.min(halfWorld, spawnX));
        spawnZ = Math.max(-halfWorld, Math.min(halfWorld, spawnZ));
        
        const position = new THREE.Vector3(spawnX, 30 + Math.random() * 50, spawnZ);
        
        const powerUp = new PowerUp(this.scene, position, types[typeIndex]);
        this.powerUps.push(powerUp);
    }
    
    // Spawn power-up at specific location (e.g., when enemy dies)
    spawnAtPosition(position, forceType = null) {
        if (this.powerUps.length >= this.maxPowerUps) return;
        
        // 30% chance to spawn power-up on enemy death
        if (Math.random() > 0.3) return;
        
        const types = Object.values(PowerUpType);
        const type = forceType || types[Math.floor(Math.random() * types.length)];
        
        const spawnPos = position.clone();
        spawnPos.y = Math.max(30, spawnPos.y);
        
        const powerUp = new PowerUp(this.scene, spawnPos, type);
        this.powerUps.push(powerUp);
    }
    
    checkCollection(playerPos, playerRadius) {
        const collected = [];
        
        for (const powerUp of this.powerUps) {
            if (!powerUp.active) continue;
            
            const dist = playerPos.distanceTo(powerUp.getPosition());
            if (dist < playerRadius + powerUp.collisionRadius) {
                collected.push(powerUp.collect());
            }
        }
        
        return collected;
    }
    
    getPowerUps() {
        return this.powerUps;
    }
    
    clear() {
        for (const powerUp of this.powerUps) {
            powerUp.destroy();
        }
        this.powerUps = [];
    }
}
