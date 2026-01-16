// Player Spaceship Module
import { WORLD_SIZE } from './main.js';

export class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // Physics properties
        this.position = new THREE.Vector3(0, 150, 300);
        this.velocity = new THREE.Vector3();
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.quaternion = new THREE.Quaternion();
        
        // Movement settings
        this.maxSpeed = 200;
        this.acceleration = 150;
        this.deceleration = 50;
        this.boostMultiplier = 2;
        this.mouseSensitivity = 0.002;
        this.rollSpeed = 2;
        
        // Combat
        this.health = 100;
        this.maxHealth = 100;
        this.shootCooldown = 0;
        this.shootRate = 0.15; // seconds between shots
        this.collisionRadius = 5;
        
        // Third-person camera settings
        this.cameraDistance = 20;
        this.cameraHeight = 6;
        this.cameraYaw = 0;   // Horizontal orbit angle
        this.cameraPitch = 0.2; // Vertical angle (slight look down)
        this.cameraLerpSpeed = 0.08;
        this.cameraTargetPos = new THREE.Vector3();
        this.cameraCurrentPos = new THREE.Vector3();
        
        // Ship rotation (separate from camera)
        this.shipYaw = Math.PI; // Face toward city initially
        this.shipPitch = 0;
        this.shipRoll = 0;
        
        // Create the ship mesh
        this.mesh = this.createShipMesh();
        this.scene.add(this.mesh);
        
        // Reusable vectors for calculations
        this._forward = new THREE.Vector3();
        this._right = new THREE.Vector3();
        this._up = new THREE.Vector3();
        this._tempVec = new THREE.Vector3();
        this._cameraForward = new THREE.Vector3();
    }
    
    createShipMesh() {
        const group = new THREE.Group();
        
        // Materials
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00aacc,
            emissive: 0x003344,
            emissiveIntensity: 0.3,
            metalness: 0.7,
            roughness: 0.3
        });
        
        const accentMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
            metalness: 0.9,
            roughness: 0.2
        });
        
        const engineMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff88
        });
        
        const wireMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6
        });
        
        // Main body - elongated shape
        const bodyGeometry = new THREE.ConeGeometry(2.5, 10, 6);
        bodyGeometry.rotateX(Math.PI / 2);
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        group.add(body);
        
        // Body wireframe
        const bodyEdges = new THREE.EdgesGeometry(bodyGeometry);
        const bodyWire = new THREE.LineSegments(bodyEdges, wireMaterial);
        group.add(bodyWire);
        
        // Cockpit
        const cockpitGeometry = new THREE.SphereGeometry(1.5, 8, 6);
        cockpitGeometry.translate(0, 0.5, -2);
        const cockpitMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ddff,
            emissive: 0x0066aa,
            emissiveIntensity: 0.4,
            metalness: 0.2,
            roughness: 0.1,
            transparent: true,
            opacity: 0.8
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        group.add(cockpit);
        
        // Left wing
        const wingGeometry = new THREE.BoxGeometry(8, 0.3, 3);
        wingGeometry.translate(-5, 0, 1);
        const leftWing = new THREE.Mesh(wingGeometry, bodyMaterial);
        leftWing.castShadow = true;
        group.add(leftWing);
        
        // Wing accent strip
        const wingAccentGeo = new THREE.BoxGeometry(7, 0.35, 0.5);
        wingAccentGeo.translate(-5, 0.1, 1);
        const leftWingAccent = new THREE.Mesh(wingAccentGeo, accentMaterial);
        group.add(leftWingAccent);
        
        // Right wing
        const rightWingGeometry = wingGeometry.clone();
        rightWingGeometry.translate(10, 0, 0);
        const rightWing = new THREE.Mesh(rightWingGeometry, bodyMaterial);
        rightWing.castShadow = true;
        group.add(rightWing);
        
        const rightWingAccentGeo = wingAccentGeo.clone();
        rightWingAccentGeo.translate(10, 0, 0);
        const rightWingAccent = new THREE.Mesh(rightWingAccentGeo, accentMaterial);
        group.add(rightWingAccent);
        
        // Wing wireframes
        const wingEdges = new THREE.EdgesGeometry(wingGeometry);
        group.add(new THREE.LineSegments(wingEdges, wireMaterial));
        const rightWingEdges = new THREE.EdgesGeometry(rightWingGeometry);
        group.add(new THREE.LineSegments(rightWingEdges, wireMaterial));
        
        // Tail fin
        const finGeometry = new THREE.BoxGeometry(0.3, 3, 2);
        finGeometry.translate(0, 1.5, 3);
        const fin = new THREE.Mesh(finGeometry, bodyMaterial);
        fin.castShadow = true;
        group.add(fin);
        
        // Engine glow (rear)
        const engineGeometry = new THREE.CylinderGeometry(1, 1.5, 2, 6);
        engineGeometry.rotateX(Math.PI / 2);
        engineGeometry.translate(0, 0, 5);
        const engine = new THREE.Mesh(engineGeometry, engineMaterial);
        group.add(engine);
        
        // Engine flame effect
        const flameGeometry = new THREE.ConeGeometry(0.8, 3, 6);
        flameGeometry.rotateX(-Math.PI / 2);
        flameGeometry.translate(0, 0, 7);
        const flameMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffaa,
            transparent: true,
            opacity: 0.7
        });
        this.engineFlame = new THREE.Mesh(flameGeometry, flameMaterial);
        group.add(this.engineFlame);
        
        return group;
    }
    
    reset() {
        this.position.set(0, 150, 300);
        this.velocity.set(0, 0, 0);
        this.shipYaw = Math.PI; // Face toward city
        this.shipPitch = 0;
        this.shipRoll = 0;
        this.cameraYaw = 0;
        this.cameraPitch = 0.2;
        this.rotation.set(0, Math.PI, 0);
        this.quaternion.setFromEuler(this.rotation);
        this.health = this.maxHealth;
        this.shootCooldown = 0;
        
        // Reset camera position immediately
        this.cameraCurrentPos.copy(this.position).add(new THREE.Vector3(0, this.cameraHeight, this.cameraDistance));
        
        this.mesh.position.copy(this.position);
        this.mesh.quaternion.copy(this.quaternion);
    }
    
    update(deltaTime, keys, mouse) {
        // Update shoot cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
        
        // Handle camera orbit from mouse (right-click or always)
        this.handleCameraOrbit(mouse);
        
        // Handle ship rotation with keys
        this.handleShipRotation(deltaTime, keys);
        
        // Update ship quaternion
        this.rotation.set(this.shipPitch, this.shipYaw, this.shipRoll, 'YXZ');
        this.quaternion.setFromEuler(this.rotation);
        
        // Calculate direction vectors based on ship orientation
        this._forward.set(0, 0, -1).applyQuaternion(this.quaternion);
        this._right.set(1, 0, 0).applyQuaternion(this.quaternion);
        this._up.set(0, 1, 0).applyQuaternion(this.quaternion);
        
        // Handle movement input
        this.handleMovement(deltaTime, keys);
        
        // Apply velocity to position
        this._tempVec.copy(this.velocity).multiplyScalar(deltaTime);
        this.position.add(this._tempVec);
        
        // World boundaries
        this.clampToWorld();
        
        // Update mesh transform
        this.mesh.position.copy(this.position);
        this.mesh.quaternion.copy(this.quaternion);
        
        // Update camera to follow player
        this.updateCamera(deltaTime);
    }
    
    handleCameraOrbit(mouse) {
        // Mouse controls camera orbit around ship
        this.cameraYaw -= mouse.x * this.mouseSensitivity * 0.5;
        this.cameraPitch -= mouse.y * this.mouseSensitivity * 0.3;
        
        // Clamp pitch to prevent flipping
        this.cameraPitch = Math.max(-0.5, Math.min(0.8, this.cameraPitch));
    }
    
    handleShipRotation(deltaTime, keys) {
        const turnSpeed = 2.0;
        
        // Turn ship with A/D or Arrow keys
        if (keys['KeyA'] || keys['ArrowLeft']) {
            this.shipYaw += turnSpeed * deltaTime;
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
            this.shipYaw -= turnSpeed * deltaTime;
        }
        
        // Pitch with W/S modifies ship pitch for climbing/diving
        if (keys['ArrowUp']) {
            this.shipPitch = Math.min(this.shipPitch + turnSpeed * 0.5 * deltaTime, 0.6);
        } else if (keys['ArrowDown']) {
            this.shipPitch = Math.max(this.shipPitch - turnSpeed * 0.5 * deltaTime, -0.6);
        } else {
            // Auto-level pitch
            this.shipPitch *= 0.95;
        }
        
        // Roll with Q/E
        if (keys['KeyQ']) {
            this.shipRoll += this.rollSpeed * deltaTime;
        }
        if (keys['KeyE']) {
            this.shipRoll -= this.rollSpeed * deltaTime;
        }
        
        // Auto-level roll
        if (!keys['KeyQ'] && !keys['KeyE']) {
            this.shipRoll *= 0.95;
        }
    }
    
    handleMovement(deltaTime, keys) {
        const isBoosting = keys['ShiftLeft'] || keys['ShiftRight'];
        const currentMaxSpeed = isBoosting ? this.maxSpeed * this.boostMultiplier : this.maxSpeed;
        const accel = this.acceleration * (isBoosting ? this.boostMultiplier : 1);
        
        let inputDetected = false;
        
        // Forward/backward - W always moves forward in ship direction
        if (keys['KeyW']) {
            this._tempVec.copy(this._forward).multiplyScalar(accel * deltaTime);
            this.velocity.add(this._tempVec);
            inputDetected = true;
        }
        if (keys['KeyS']) {
            this._tempVec.copy(this._forward).multiplyScalar(-accel * 0.5 * deltaTime);
            this.velocity.add(this._tempVec);
            inputDetected = true;
        }
        
        // Space to ascend, C to descend (world up/down)
        if (keys['Space']) {
            this.velocity.y += accel * 0.7 * deltaTime;
            inputDetected = true;
        }
        if (keys['KeyC']) {
            this.velocity.y -= accel * 0.7 * deltaTime;
            inputDetected = true;
        }
        
        // Apply deceleration when no input
        if (!inputDetected) {
            const speed = this.velocity.length();
            if (speed > 0.1) {
                const decelAmount = Math.min(this.deceleration * deltaTime, speed);
                this.velocity.normalize().multiplyScalar(speed - decelAmount);
            } else {
                this.velocity.set(0, 0, 0);
            }
        }
        
        // Clamp to max speed
        const speed = this.velocity.length();
        if (speed > currentMaxSpeed) {
            this.velocity.normalize().multiplyScalar(currentMaxSpeed);
        }
    }
    
    clampToWorld() {
        const halfWorld = WORLD_SIZE / 2 - 20;
        
        this.position.x = Math.max(-halfWorld, Math.min(halfWorld, this.position.x));
        this.position.z = Math.max(-halfWorld, Math.min(halfWorld, this.position.z));
        this.position.y = Math.max(5, Math.min(400, this.position.y));
    }
    
    updateCamera(deltaTime) {
        // Calculate camera position orbiting around ship
        const horizontalDist = this.cameraDistance * Math.cos(this.cameraPitch);
        const verticalOffset = this.cameraDistance * Math.sin(this.cameraPitch) + this.cameraHeight;
        
        // Camera orbit is relative to ship's yaw
        const totalYaw = this.shipYaw + this.cameraYaw + Math.PI; // +PI to be behind
        
        this.cameraTargetPos.set(
            this.position.x + Math.sin(totalYaw) * horizontalDist,
            this.position.y + verticalOffset,
            this.position.z + Math.cos(totalYaw) * horizontalDist
        );
        
        // Smooth camera follow
        this.cameraCurrentPos.lerp(this.cameraTargetPos, this.cameraLerpSpeed);
        this.camera.position.copy(this.cameraCurrentPos);
        
        // Camera always looks at ship (slightly ahead of it)
        const lookTarget = this.position.clone();
        lookTarget.add(this._forward.clone().multiplyScalar(5));
        this.camera.lookAt(lookTarget);
    }
    
    canShoot() {
        return this.shootCooldown <= 0;
    }
    
    onShoot() {
        this.shootCooldown = this.shootRate;
    }
    
    getPosition() {
        return this.position.clone();
    }
    
    getDirection() {
        return this._forward.clone();
    }
    
    getSpeed() {
        return this.velocity.length();
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        
        // Flash the ship red briefly
        this.mesh.traverse((child) => {
            if (child.material) {
                const originalColor = child.material.color.getHex();
                child.material.color.setHex(0xff0000);
                setTimeout(() => {
                    child.material.color.setHex(originalColor);
                }, 100);
            }
        });
    }
    
    onBuildingCollision(building) {
        // Push player away from building more aggressively
        const buildingCenter = new THREE.Vector3();
        building.bbox.getCenter(buildingCenter);
        
        const pushDir = this.position.clone().sub(buildingCenter);
        pushDir.y = Math.max(pushDir.y, 0.5); // Bias upward to escape
        pushDir.normalize();
        
        // Strong push to escape building
        this.position.add(pushDir.multiplyScalar(10));
        
        // Reduce velocity and reverse slightly
        this.velocity.multiplyScalar(-0.2);
        
        // Take damage from collision
        this.takeDamage(2);
    }
}
