// Combat System Module

const PROJECTILE_POOL_SIZE = 100;

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
        const geometry = new THREE.SphereGeometry(0.3, 4, 3);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ 
            color: 0xffff00
        });
        const mesh = new THREE.LineSegments(edges, material);
        
        // Add a trail effect
        const trailGeometry = new THREE.BufferGeometry();
        const trailVertices = new Float32Array([
            0, 0, 0,
            0, 0, 3
        ]);
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailVertices, 3));
        const trailMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.5
        });
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        mesh.add(trail);
        
        return mesh;
    }
    
    fire(position, direction, owner) {
        this.active = true;
        this.position.copy(position);
        this.direction.copy(direction).normalize();
        this.velocity.copy(this.direction).multiplyScalar(this.speed);
        this.owner = owner;
        this.lifetime = 0;
        
        // Set color based on owner
        const color = owner === 'player' ? 0x00ffff : 0xff4400;
        this.mesh.traverse((child) => {
            if (child.material) {
                child.material.color.setHex(color);
            }
        });
        
        // Set damage based on owner
        this.damage = owner === 'player' ? 10 : 15;
        
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
    
    createProjectile(position, direction, owner) {
        // Find an inactive projectile in the pool
        for (const projectile of this.projectilePool) {
            if (!projectile.active) {
                projectile.fire(position, direction, owner);
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
        this.maxLifetime = 0.5;
        
        this.particles = [];
        this.createParticles();
    }
    
    createParticles() {
        const material = new THREE.LineBasicMaterial({ 
            color: 0xff4400,
            transparent: true,
            opacity: 1
        });
        
        const numParticles = 12;
        for (let i = 0; i < numParticles; i++) {
            const geometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([0, 0, 0, 1, 0, 0]);
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            
            const line = new THREE.Line(geometry, material.clone());
            line.position.copy(this.position);
            
            // Random direction
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
    }
    
    update(deltaTime) {
        this.lifetime += deltaTime;
        
        if (this.lifetime >= this.maxLifetime) {
            this.destroy();
            return;
        }
        
        const progress = this.lifetime / this.maxLifetime;
        
        for (const particle of this.particles) {
            // Move particle outward
            particle.mesh.position.add(
                particle.direction.clone().multiplyScalar(particle.speed * deltaTime)
            );
            
            // Fade out
            if (particle.mesh.material) {
                particle.mesh.material.opacity = 1 - progress;
            }
        }
    }
    
    destroy() {
        this.active = false;
        
        for (const particle of this.particles) {
            this.scene.remove(particle.mesh);
            particle.mesh.geometry.dispose();
            particle.mesh.material.dispose();
        }
        
        this.particles = [];
    }
}
