// Combat System Module
import { textureManager } from './textures.js';

const PROJECTILE_POOL_SIZE = 150;

class Projectile {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        
        this.speed = 500;
        this.damage = 10;
        this.lifetime = 0;
        this.maxLifetime = 3; // seconds
        this.owner = 'player'; // 'player' or 'enemy'
        
        // Create mesh (starts invisible)
        this.mesh = this.createMesh();
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Get projectile texture
        const projectileTexture = textureManager.get('projectile');
        
        // Core projectile - glowing energy ball
        const coreGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);
        this.coreMesh = core;
        
        // Outer glow sprite
        const glowMat = new THREE.SpriteMaterial({
            map: projectileTexture,
            color: 0xffff00,
            transparent: true,
            blending: THREE.AdditiveBlending,
            opacity: 0.8
        });
        const glow = new THREE.Sprite(glowMat);
        glow.scale.set(3, 3, 1);
        group.add(glow);
        this.glowSprite = glow;
        
        // Trail effect - elongated streak
        const trailGeo = new THREE.PlaneGeometry(0.5, 4);
        trailGeo.translate(0, 2, 0);
        trailGeo.rotateX(Math.PI / 2);
        const trailMat = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const trail = new THREE.Mesh(trailGeo, trailMat);
        group.add(trail);
        this.trailMesh = trail;
        
        // Point light for illumination
        const light = new THREE.PointLight(0xffff00, 1, 15);
        group.add(light);
        this.pointLight = light;
        
        return group;
    }
    
    fire(position, direction, owner, damage = 10, color = null) {
        this.active = true;
        this.position.copy(position);
        this.direction.copy(direction).normalize();
        this.velocity.copy(this.direction).multiplyScalar(this.speed);
        this.owner = owner;
        this.lifetime = 0;
        this.damage = damage;
        
        // Set color based on owner or custom color
        let projectileColor;
        if (color) {
            projectileColor = color;
        } else {
            projectileColor = owner === 'player' ? 0x00ffff : 0xff4400;
        }
        
        // Update all mesh colors
        if (this.coreMesh) {
            this.coreMesh.material.color.setHex(projectileColor);
        }
        if (this.glowSprite) {
            this.glowSprite.material.color.setHex(projectileColor);
        }
        if (this.trailMesh) {
            this.trailMesh.material.color.setHex(projectileColor);
        }
        if (this.pointLight) {
            this.pointLight.color.setHex(projectileColor);
        }
        
        // Set damage based on owner if not specified
        if (!damage) {
            this.damage = owner === 'player' ? 10 : 15;
        }
        
        // Offset starting position slightly forward
        this.position.add(this.direction.clone().multiplyScalar(5));
        
        this.mesh.visible = true;
        this.mesh.position.copy(this.position);
        this.mesh.lookAt(this.position.clone().add(this.direction));
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        // Update lifetime
        this.lifetime += deltaTime;
        if (this.lifetime >= this.maxLifetime) {
            this.deactivate();
            return;
        }
        
        // Move projectile
        const movement = this.velocity.clone().multiplyScalar(deltaTime);
        this.position.add(movement);
        
        // Update mesh
        this.mesh.position.copy(this.position);
    }
    
    deactivate() {
        this.active = false;
        this.mesh.visible = false;
    }
}

export class CombatSystem {
    constructor(scene) {
        this.scene = scene;
        this.projectilePool = [];
        
        // Initialize projectile pool
        for (let i = 0; i < PROJECTILE_POOL_SIZE; i++) {
            this.projectilePool.push(new Projectile(scene));
        }
    }
    
    createProjectile(position, direction, owner, damage = 10, color = null) {
        // Find an inactive projectile in the pool
        for (const projectile of this.projectilePool) {
            if (!projectile.active) {
                projectile.fire(position, direction, owner, damage, color);
                return projectile;
            }
        }
        
        // Pool exhausted - could expand or ignore
        console.warn('Projectile pool exhausted');
        return null;
    }
    
    update(deltaTime) {
        for (const projectile of this.projectilePool) {
            projectile.update(deltaTime);
        }
    }
    
    getProjectiles() {
        return this.projectilePool.filter(p => p.active);
    }
    
    clear() {
        for (const projectile of this.projectilePool) {
            projectile.deactivate();
        }
    }
}

// Explosion effect for destroyed enemies
export class ExplosionManager {
    constructor(scene) {
        this.scene = scene;
        this.explosions = [];
    }
    
    createExplosion(position) {
        const explosion = new Explosion(this.scene, position);
        this.explosions.push(explosion);
    }
    
    update(deltaTime) {
        for (const explosion of this.explosions) {
            explosion.update(deltaTime);
        }
        
        // Remove finished explosions
        this.explosions = this.explosions.filter(e => e.active);
    }
}

class Explosion {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position.clone();
        this.active = true;
        this.lifetime = 0;
        this.maxLifetime = 0.8;
        
        this.particles = [];
        this.sprites = [];
        this.createParticles();
    }
    
    createParticles() {
        const explosionTexture = textureManager.get('explosion');
        
        // Central explosion flash
        const flashMat = new THREE.SpriteMaterial({
            map: explosionTexture,
            color: 0xffaa00,
            transparent: true,
            blending: THREE.AdditiveBlending,
            opacity: 1
        });
        const flash = new THREE.Sprite(flashMat);
        flash.position.copy(this.position);
        flash.scale.set(10, 10, 1);
        this.scene.add(flash);
        this.centralFlash = flash;
        
        // Expanding ring
        const ringGeo = new THREE.RingGeometry(1, 2, 16);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(this.position);
        this.scene.add(ring);
        this.ring = ring;
        
        // Particle debris
        const numParticles = 16;
        for (let i = 0; i < numParticles; i++) {
            const spriteMat = new THREE.SpriteMaterial({
                map: explosionTexture,
                color: i < numParticles / 2 ? 0xff4400 : 0xffaa00,
                transparent: true,
                blending: THREE.AdditiveBlending,
                opacity: 1
            });
            
            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.copy(this.position);
            sprite.scale.set(2 + Math.random() * 2, 2 + Math.random() * 2, 1);
            
            // Random direction
            const direction = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();
            
            this.sprites.push({
                sprite: sprite,
                direction: direction,
                speed: 30 + Math.random() * 40,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
            
            this.scene.add(sprite);
        }
        
        // Line debris for extra effect
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0xff4400,
            transparent: true,
            opacity: 1
        });
        
        for (let i = 0; i < 8; i++) {
            const geometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([0, 0, 0, 2, 0, 0]);
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            
            const line = new THREE.Line(geometry, lineMaterial.clone());
            line.position.copy(this.position);
            
            const direction = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();
            
            this.particles.push({
                mesh: line,
                direction: direction,
                speed: 50 + Math.random() * 50
            });
            
            this.scene.add(line);
        }
        
        // Add point light for dramatic effect
        this.light = new THREE.PointLight(0xff6600, 10, 50);
        this.light.position.copy(this.position);
        this.scene.add(this.light);
    }
    
    update(deltaTime) {
        this.lifetime += deltaTime;
        
        if (this.lifetime >= this.maxLifetime) {
            this.destroy();
            return;
        }
        
        const progress = this.lifetime / this.maxLifetime;
        const fadeOut = 1 - progress;
        
        // Animate central flash
        if (this.centralFlash) {
            const flashScale = 10 + progress * 20;
            this.centralFlash.scale.set(flashScale, flashScale, 1);
            this.centralFlash.material.opacity = fadeOut * 0.8;
        }
        
        // Animate ring
        if (this.ring) {
            const ringScale = 1 + progress * 15;
            this.ring.scale.set(ringScale, ringScale, ringScale);
            this.ring.material.opacity = fadeOut * 0.6;
            this.ring.rotation.x = Math.random() * Math.PI;
            this.ring.rotation.y = Math.random() * Math.PI;
        }
        
        // Animate sprite particles
        for (const particle of this.sprites) {
            particle.sprite.position.add(
                particle.direction.clone().multiplyScalar(particle.speed * deltaTime)
            );
            particle.sprite.material.opacity = fadeOut;
            const scale = particle.sprite.scale.x * (1 - deltaTime * 2);
            particle.sprite.scale.set(Math.max(0.5, scale), Math.max(0.5, scale), 1);
        }
        
        // Animate line particles
        for (const particle of this.particles) {
            particle.mesh.position.add(
                particle.direction.clone().multiplyScalar(particle.speed * deltaTime)
            );
            if (particle.mesh.material) {
                particle.mesh.material.opacity = fadeOut;
            }
        }
        
        // Animate light
        if (this.light) {
            this.light.intensity = fadeOut * 10;
        }
    }
    
    destroy() {
        this.active = false;
        
        // Clean up central flash
        if (this.centralFlash) {
            this.scene.remove(this.centralFlash);
            this.centralFlash.material.dispose();
        }
        
        // Clean up ring
        if (this.ring) {
            this.scene.remove(this.ring);
            this.ring.geometry.dispose();
            this.ring.material.dispose();
        }
        
        // Clean up sprites
        for (const particle of this.sprites) {
            this.scene.remove(particle.sprite);
            particle.sprite.material.dispose();
        }
        
        // Clean up line particles
        for (const particle of this.particles) {
            this.scene.remove(particle.mesh);
            particle.mesh.geometry.dispose();
            particle.mesh.material.dispose();
        }
        
        // Clean up light
        if (this.light) {
            this.scene.remove(this.light);
        }
        
        this.particles = [];
        this.sprites = [];
    }
}
