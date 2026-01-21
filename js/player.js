// Player Spaceship Module - Arcade Flight Controls
import { WORLD_SIZE } from './main.js';
import { PowerUpType } from './powerups.js';

// Weapon types
export const WeaponType = {
    LASER: 'laser',
    SPREAD: 'spread',
    RAPID: 'rapid',
    HEAVY: 'heavy'
};

const WEAPON_CONFIG = {
    [WeaponType.LASER]: {
        name: 'LASER',
        shootRate: 0.15,
        damage: 10,
        projectiles: 1,
        spread: 0,
        color: 0x00ffff
    },
    [WeaponType.SPREAD]: {
        name: 'SPREAD',
        shootRate: 0.25,
        damage: 7,
        projectiles: 3,
        spread: 0.15,
        color: 0xff00ff
    },
    [WeaponType.RAPID]: {
        name: 'RAPID',
        shootRate: 0.06,
        damage: 5,
        projectiles: 1,
        spread: 0.05,
        color: 0xffff00
    },
    [WeaponType.HEAVY]: {
        name: 'HEAVY',
        shootRate: 0.4,
        damage: 30,
        projectiles: 1,
        spread: 0,
        color: 0xff4400
    }
};

export class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // Transform
        this.position = new THREE.Vector3(0, 150, 400);
        this.velocity = new THREE.Vector3();
        this.quaternion = new THREE.Quaternion();
        
        // Flight physics - arcade style
        this.throttle = 0.5;
        this.pitch = 0;
        this.yaw = Math.PI;
        this.roll = 0;
        
        // Speed settings
        this.minSpeed = 60;
        this.cruiseSpeed = 140;
        this.maxSpeed = 280;
        this.boostSpeed = 450;
        this.baseMaxSpeed = 280;
        this.baseBoostSpeed = 450;
        
        // Control sensitivity
        this.pitchSpeed = 1.8;
        this.yawSpeed = 1.5;
        this.rollSpeed = 2.5;
        this.throttleSpeed = 0.8;
        
        // Combat
        this.health = 100;
        this.maxHealth = 100;
        this.shootCooldown = 0;
        this.shootRate = 0.15;
        this.baseShootRate = 0.15;
        this.baseDamage = 10;
        this.damageMultiplier = 1;
        this.collisionRadius = 5;
        
        // Weapons system
        this.weapons = [WeaponType.LASER];
        this.currentWeaponIndex = 0;
        this.currentWeapon = WEAPON_CONFIG[WeaponType.LASER];
        
        // Shield system
        this.shield = 0;
        this.maxShield = 50;
        this.shieldActive = false;
        this.shieldMesh = null;
        
        // Power-up effects
        this.activeEffects = {};
        this.speedMultiplier = 1;
        
        // Camera
        this.cameraOffset = new THREE.Vector3(0, 5, 22);
        this.cameraLookAhead = 35;
        this.cameraLerp = 0.07;
        this.cameraCurrent = new THREE.Vector3();
        this.cameraShake = 0;
        
        // Engine trails
        this.engineTrails = [];
        this.trailPositions = [];
        
        // Create ship
        this.mesh = this.createShipMesh();
        this.scene.add(this.mesh);
        this.createEngineTrails();
        this.createShieldMesh();
        
        // Reusable vectors
        this._forward = new THREE.Vector3();
        this._right = new THREE.Vector3();
        this._up = new THREE.Vector3();
        this._tempVec = new THREE.Vector3();
        this._euler = new THREE.Euler(0, 0, 0, 'YXZ');
    }
    
    createShieldMesh() {
        const shieldGeo = new THREE.SphereGeometry(8, 24, 24);
        const shieldMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            wireframe: true
        });
        this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        this.mesh.add(this.shieldMesh);
    }
    
    createShipMesh() {
        const group = new THREE.Group();
        
        // Premium materials
        const hullMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a8ccc,
            emissive: 0x0a3344,
            emissiveIntensity: 0.2,
            metalness: 0.85,
            roughness: 0.15
        });
        
        const darkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0a1a2a,
            metalness: 0.9,
            roughness: 0.3
        });
        
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.9
        });
        
        const cockpitMaterial = new THREE.MeshStandardMaterial({
            color: 0x88eeff,
            emissive: 0x00aacc,
            emissiveIntensity: 0.4,
            metalness: 0.1,
            roughness: 0.05,
            transparent: true,
            opacity: 0.85
        });
        
        // Main fuselage
        const fuselageGeo = new THREE.CylinderGeometry(1.5, 2.5, 14, 8);
        fuselageGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(fuselageGeo, hullMaterial);
        fuselage.castShadow = true;
        group.add(fuselage);
        
        // Nose cone
        const noseGeo = new THREE.ConeGeometry(1.5, 6, 8);
        noseGeo.rotateX(Math.PI / 2);
        noseGeo.translate(0, 0, -10);
        const nose = new THREE.Mesh(noseGeo, hullMaterial);
        nose.castShadow = true;
        group.add(nose);
        
        // Cockpit canopy
        const canopyGeo = new THREE.SphereGeometry(1.6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        canopyGeo.scale(1, 0.5, 1.5);
        canopyGeo.translate(0, 1.3, -4);
        const canopy = new THREE.Mesh(canopyGeo, cockpitMaterial);
        group.add(canopy);
        
        // Wings
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(-12, -2);
        wingShape.lineTo(-10, 0);
        wingShape.lineTo(-8, 0);
        wingShape.lineTo(0, 1);
        wingShape.closePath();
        
        const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.3, bevelEnabled: false });
        wingGeo.rotateX(-Math.PI / 2);
        wingGeo.translate(0, 0, 0);
        const leftWing = new THREE.Mesh(wingGeo, hullMaterial);
        leftWing.castShadow = true;
        group.add(leftWing);
        
        const rightWingGeo = wingGeo.clone();
        rightWingGeo.scale(-1, 1, 1);
        const rightWing = new THREE.Mesh(rightWingGeo, hullMaterial);
        rightWing.castShadow = true;
        group.add(rightWing);
        
        // Wing tip lights
        const tipGeo = new THREE.SphereGeometry(0.35, 8, 8);
        const leftTip = new THREE.Mesh(tipGeo, new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
        leftTip.position.set(-12, 0, -1);
        group.add(leftTip);
        
        const rightTip = new THREE.Mesh(tipGeo.clone(), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        rightTip.position.set(12, 0, -1);
        group.add(rightTip);
        
        // Tail section
        const tailGeo = new THREE.BoxGeometry(0.3, 4, 3);
        tailGeo.translate(0, 2, 5);
        const tail = new THREE.Mesh(tailGeo, darkMaterial);
        group.add(tail);
        
        // Horizontal stabilizers
        const hStabGeo = new THREE.BoxGeometry(6, 0.2, 2);
        hStabGeo.translate(0, 0.5, 6);
        const hStab = new THREE.Mesh(hStabGeo, hullMaterial);
        group.add(hStab);
        
        // Engine pods
        const engineGeo = new THREE.CylinderGeometry(0.9, 1.1, 5, 8);
        engineGeo.rotateX(Math.PI / 2);
        
        const leftEngine = new THREE.Mesh(engineGeo, darkMaterial);
        leftEngine.position.set(-3.5, -0.5, 3);
        group.add(leftEngine);
        
        const rightEngine = new THREE.Mesh(engineGeo.clone(), darkMaterial);
        rightEngine.position.set(3.5, -0.5, 3);
        group.add(rightEngine);
        
        // Engine glows
        const glowGeo = new THREE.CircleGeometry(0.9, 12);
        glowGeo.rotateX(Math.PI);
        
        this.leftEngineGlow = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({ 
            color: 0x00ffaa, transparent: true, opacity: 0.9 
        }));
        this.leftEngineGlow.position.set(-3.5, -0.5, 5.6);
        group.add(this.leftEngineGlow);
        
        this.rightEngineGlow = new THREE.Mesh(glowGeo.clone(), new THREE.MeshBasicMaterial({ 
            color: 0x00ffaa, transparent: true, opacity: 0.9 
        }));
        this.rightEngineGlow.position.set(3.5, -0.5, 5.6);
        group.add(this.rightEngineGlow);
        
        // Wireframe overlay
        const wireframeMat = new THREE.LineBasicMaterial({ 
            color: 0x00ffff, transparent: true, opacity: 0.3 
        });
        const edges = new THREE.EdgesGeometry(fuselageGeo, 30);
        group.add(new THREE.LineSegments(edges, wireframeMat));
        
        return group;
    }
    
    createEngineTrails() {
        const trailMat = new THREE.LineBasicMaterial({
            color: 0x00ffaa,
            transparent: true,
            opacity: 0.5
        });
        
        for (let e = 0; e < 2; e++) {
            const positions = new Float32Array(60 * 3);
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const trail = new THREE.Line(geometry, trailMat.clone());
            this.scene.add(trail);
            this.engineTrails.push(trail);
            this.trailPositions.push([]);
        }
    }
    
    reset() {
        this.position.set(0, 150, 400);
        this.velocity.set(0, 0, -this.cruiseSpeed);
        this.pitch = 0;
        this.yaw = Math.PI;
        this.roll = 0;
        this.throttle = 0.5;
        this.health = this.maxHealth;
        this.shootCooldown = 0;
        this.cameraShake = 0;
        
        // Reset weapons
        this.weapons = [WeaponType.LASER];
        this.currentWeaponIndex = 0;
        this.currentWeapon = WEAPON_CONFIG[WeaponType.LASER];
        
        // Reset shield
        this.shield = 0;
        this.shieldActive = false;
        if (this.shieldMesh) {
            this.shieldMesh.material.opacity = 0;
        }
        
        // Reset power-up effects
        this.activeEffects = {};
        this.damageMultiplier = 1;
        this.speedMultiplier = 1;
        this.shootRate = this.baseShootRate;
        this.maxSpeed = this.baseMaxSpeed;
        this.boostSpeed = this.baseBoostSpeed;
        
        this._euler.set(this.pitch, this.yaw, this.roll, 'YXZ');
        this.quaternion.setFromEuler(this._euler);
        this.cameraCurrent.copy(this.position).add(new THREE.Vector3(0, 10, 30));
        
        for (const arr of this.trailPositions) arr.length = 0;
        
        this.mesh.position.copy(this.position);
        this.mesh.quaternion.copy(this.quaternion);
    }
    
    update(deltaTime, keys, mouse) {
        if (this.shootCooldown > 0) this.shootCooldown -= deltaTime;
        
        // Update power-up effect timers
        this.updatePowerUpEffects(deltaTime);
        
        const input = this.getInput(keys, mouse);
        this.applyFlightControls(deltaTime, input);
        
        // Weapon switching with 1-4 keys
        if (keys['Digit1'] && this.weapons.includes(WeaponType.LASER)) this.switchWeapon(0);
        if (keys['Digit2'] && this.weapons.includes(WeaponType.SPREAD)) this.switchWeapon(this.weapons.indexOf(WeaponType.SPREAD));
        if (keys['Digit3'] && this.weapons.includes(WeaponType.RAPID)) this.switchWeapon(this.weapons.indexOf(WeaponType.RAPID));
        if (keys['Digit4'] && this.weapons.includes(WeaponType.HEAVY)) this.switchWeapon(this.weapons.indexOf(WeaponType.HEAVY));
        
        this._euler.set(this.pitch, this.yaw, this.roll, 'YXZ');
        this.quaternion.setFromEuler(this._euler);
        
        this._forward.set(0, 0, -1).applyQuaternion(this.quaternion);
        this._right.set(1, 0, 0).applyQuaternion(this.quaternion);
        this._up.set(0, 1, 0).applyQuaternion(this.quaternion);
        
        const isBoosting = input.boost;
        let targetSpeed = this.minSpeed + (this.maxSpeed * this.speedMultiplier - this.minSpeed) * this.throttle;
        if (isBoosting) targetSpeed = this.boostSpeed * this.speedMultiplier;
        
        this.velocity.copy(this._forward).multiplyScalar(targetSpeed);
        
        this._tempVec.copy(this.velocity).multiplyScalar(deltaTime);
        this.position.add(this._tempVec);
        
        this.clampToWorld();
        
        this.mesh.position.copy(this.position);
        this.mesh.quaternion.copy(this.quaternion);
        
        this.updateEngineEffects(deltaTime, targetSpeed, isBoosting);
        this.updateShield(deltaTime);
        this.updateCamera(deltaTime, isBoosting);
        
        this.cameraShake *= 0.9;
    }
    
    updatePowerUpEffects(deltaTime) {
        const expiredEffects = [];
        
        for (const [effect, data] of Object.entries(this.activeEffects)) {
            data.remaining -= deltaTime;
            if (data.remaining <= 0) {
                expiredEffects.push(effect);
            }
        }
        
        // Remove expired effects
        for (const effect of expiredEffects) {
            this.removeEffect(effect);
        }
    }
    
    removeEffect(effect) {
        delete this.activeEffects[effect];
        
        switch (effect) {
            case 'rapid_fire':
                this.shootRate = this.currentWeapon.shootRate;
                break;
            case 'damage_boost':
                this.damageMultiplier = 1;
                break;
            case 'speed_boost':
                this.speedMultiplier = 1;
                break;
            case 'spread_shot':
                // Return to normal weapon
                break;
        }
    }
    
    updateShield(deltaTime) {
        if (this.shield > 0) {
            this.shieldActive = true;
            // Pulsing shield effect
            const pulse = 0.2 + Math.sin(Date.now() * 0.01) * 0.1;
            this.shieldMesh.material.opacity = pulse;
            this.shieldMesh.rotation.y += deltaTime * 2;
            this.shieldMesh.rotation.x += deltaTime;
        } else {
            this.shieldActive = false;
            this.shieldMesh.material.opacity = 0;
        }
    }
    
    switchWeapon(index) {
        if (index < 0 || index >= this.weapons.length) return;
        if (index === this.currentWeaponIndex) return;
        
        this.currentWeaponIndex = index;
        this.currentWeapon = WEAPON_CONFIG[this.weapons[index]];
        this.shootRate = this.currentWeapon.shootRate;
        
        // Keep rapid fire effect if active
        if (this.activeEffects['rapid_fire']) {
            this.shootRate *= this.activeEffects['rapid_fire'].value;
        }
        
        return true; // Return true if weapon was switched (for audio)
    }
    
    addWeapon(weaponType) {
        if (!this.weapons.includes(weaponType)) {
            this.weapons.push(weaponType);
        }
    }
    
    applyPowerUp(type, config) {
        switch (type) {
            case PowerUpType.HEALTH:
                this.health = Math.min(this.health + config.value, this.maxHealth);
                break;
                
            case PowerUpType.SHIELD:
                this.shield = Math.min(this.shield + config.value, this.maxShield);
                break;
                
            case PowerUpType.RAPID_FIRE:
                this.activeEffects['rapid_fire'] = { 
                    remaining: config.duration, 
                    value: config.value 
                };
                this.shootRate = this.currentWeapon.shootRate * config.value;
                break;
                
            case PowerUpType.SPREAD_SHOT:
                this.activeEffects['spread_shot'] = { 
                    remaining: config.duration, 
                    value: config.value 
                };
                // Temporarily unlock spread weapon
                if (!this.weapons.includes(WeaponType.SPREAD)) {
                    this.addWeapon(WeaponType.SPREAD);
                    this.switchWeapon(this.weapons.indexOf(WeaponType.SPREAD));
                }
                break;
                
            case PowerUpType.DAMAGE_BOOST:
                this.activeEffects['damage_boost'] = { 
                    remaining: config.duration, 
                    value: config.value 
                };
                this.damageMultiplier = config.value;
                break;
                
            case PowerUpType.SPEED_BOOST:
                this.activeEffects['speed_boost'] = { 
                    remaining: config.duration, 
                    value: config.value 
                };
                this.speedMultiplier = config.value;
                break;
        }
    }
    
    getWeaponInfo() {
        return {
            name: this.currentWeapon.name,
            color: this.currentWeapon.color,
            projectiles: this.activeEffects['spread_shot'] ? 
                this.activeEffects['spread_shot'].value : this.currentWeapon.projectiles,
            spread: this.currentWeapon.spread,
            damage: this.currentWeapon.damage * this.damageMultiplier
        };
    }
    
    getActiveEffects() {
        return this.activeEffects;
    }
    
    getInput(keys, mouse) {
        return {
            pitchUp: keys['KeyW'] || keys['ArrowUp'],
            pitchDown: keys['KeyS'] || keys['ArrowDown'],
            yawLeft: keys['KeyA'] || keys['ArrowLeft'],
            yawRight: keys['KeyD'] || keys['ArrowRight'],
            rollLeft: keys['KeyQ'],
            rollRight: keys['KeyE'],
            boost: keys['ShiftLeft'] || keys['ShiftRight'],
            brake: keys['ControlLeft'] || keys['ControlRight'] || keys['KeyC'],
            mouseX: mouse.x,
            mouseY: mouse.y
        };
    }
    
    applyFlightControls(deltaTime, input) {
        // Mouse for fine pitch/yaw control
        const mousePitch = input.mouseY * 0.0015;
        const mouseYaw = -input.mouseX * 0.0015;
        
        // W = pitch UP (nose goes up), S = pitch DOWN
        let pitchInput = 0;
        if (input.pitchUp) pitchInput = 1;
        if (input.pitchDown) pitchInput = -1;
        pitchInput += mousePitch;
        
        this.pitch += pitchInput * this.pitchSpeed * deltaTime;
        this.pitch = THREE.MathUtils.clamp(this.pitch, -Math.PI / 2.5, Math.PI / 2.5);
        
        // Auto-level pitch
        if (Math.abs(pitchInput) < 0.1) {
            this.pitch *= 0.96;
        }
        
        // A = yaw LEFT, D = yaw RIGHT
        let yawInput = 0;
        if (input.yawLeft) yawInput = 1;
        if (input.yawRight) yawInput = -1;
        yawInput += mouseYaw;
        
        // Coordinated turn - roll affects yaw
        yawInput += this.roll * 0.4;
        this.yaw += yawInput * this.yawSpeed * deltaTime;
        
        // Q/E = manual roll, also auto-roll into turns
        let rollInput = 0;
        if (input.rollLeft) rollInput = 1;
        if (input.rollRight) rollInput = -1;
        
        // Auto-bank when turning
        if (input.yawLeft) rollInput += 0.6;
        if (input.yawRight) rollInput -= 0.6;
        
        this.roll += rollInput * this.rollSpeed * deltaTime;
        this.roll = THREE.MathUtils.clamp(this.roll, -Math.PI / 2, Math.PI / 2);
        
        // Auto-level roll
        if (Math.abs(rollInput) < 0.1) {
            this.roll *= 0.93;
        }
        
        // Throttle
        if (input.boost) {
            this.throttle = Math.min(this.throttle + this.throttleSpeed * deltaTime * 2, 1);
        } else if (input.brake) {
            this.throttle = Math.max(this.throttle - this.throttleSpeed * deltaTime * 2, 0);
        } else {
            // Drift toward cruise
            const cruiseThrottle = 0.5;
            this.throttle += (cruiseThrottle - this.throttle) * 0.02;
        }
    }
    
    updateEngineEffects(deltaTime, speed, boosting) {
        const intensity = boosting ? 1.5 : (speed / this.maxSpeed);
        const pulse = 0.8 + Math.sin(Date.now() * 0.015) * 0.2;
        const glowColor = boosting ? 0x00ffff : 0x00ffaa;
        
        [this.leftEngineGlow, this.rightEngineGlow].forEach(glow => {
            if (glow) {
                glow.material.opacity = intensity * pulse;
                glow.material.color.setHex(glowColor);
                glow.scale.setScalar(0.8 + intensity * 0.5);
            }
        });
        
        // Engine trails
        const engineOffsets = [
            new THREE.Vector3(-3.5, -0.5, 5.6),
            new THREE.Vector3(3.5, -0.5, 5.6)
        ];
        
        for (let i = 0; i < 2; i++) {
            const worldPos = engineOffsets[i].clone().applyQuaternion(this.quaternion).add(this.position);
            this.trailPositions[i].unshift(worldPos);
            if (this.trailPositions[i].length > 60) this.trailPositions[i].pop();
            
            const posArray = this.engineTrails[i].geometry.attributes.position.array;
            for (let j = 0; j < this.trailPositions[i].length; j++) {
                const p = this.trailPositions[i][j];
                posArray[j * 3] = p.x;
                posArray[j * 3 + 1] = p.y;
                posArray[j * 3 + 2] = p.z;
            }
            this.engineTrails[i].geometry.attributes.position.needsUpdate = true;
            this.engineTrails[i].geometry.setDrawRange(0, this.trailPositions[i].length);
            this.engineTrails[i].material.opacity = intensity * 0.5;
            this.engineTrails[i].material.color.setHex(glowColor);
        }
    }
    
    clampToWorld() {
        const halfWorld = WORLD_SIZE / 2 - 50;
        const edgePush = 100;
        
        if (Math.abs(this.position.x) > halfWorld - edgePush) {
            this.yaw += Math.sign(this.position.x) * 0.02;
        }
        if (Math.abs(this.position.z) > halfWorld - edgePush) {
            this.yaw += Math.sign(this.position.z) * 0.02;
        }
        
        this.position.x = THREE.MathUtils.clamp(this.position.x, -halfWorld, halfWorld);
        this.position.z = THREE.MathUtils.clamp(this.position.z, -halfWorld, halfWorld);
        this.position.y = THREE.MathUtils.clamp(this.position.y, 10, 500);
    }
    
    updateCamera(deltaTime, boosting) {
        const offset = this.cameraOffset.clone();
        if (boosting) {
            offset.z += 10;
            offset.y += 3;
        }
        
        const targetPos = offset.applyQuaternion(this.quaternion).add(this.position);
        
        if (this.cameraShake > 0.1) {
            targetPos.x += (Math.random() - 0.5) * this.cameraShake;
            targetPos.y += (Math.random() - 0.5) * this.cameraShake;
        }
        
        this.cameraCurrent.lerp(targetPos, this.cameraLerp);
        this.camera.position.copy(this.cameraCurrent);
        
        const lookTarget = this._forward.clone().multiplyScalar(this.cameraLookAhead).add(this.position);
        this.camera.lookAt(lookTarget);
    }
    
    canShoot() { return this.shootCooldown <= 0; }
    onShoot() { this.shootCooldown = this.shootRate; this.cameraShake = 0.5; }
    getPosition() { return this.position.clone(); }
    getDirection() { return this._forward.clone(); }
    getRightVector() { return this._right.clone(); }
    getSpeed() { return this.velocity.length(); }
    getShield() { return this.shield; }
    hasShield() { return this.shield > 0; }
    
    takeDamage(amount) {
        // Shield absorbs damage first
        if (this.shield > 0) {
            const shieldDamage = Math.min(this.shield, amount);
            this.shield -= shieldDamage;
            amount -= shieldDamage;
            
            // Shield hit effect
            if (this.shieldMesh) {
                this.shieldMesh.material.color.setHex(0xff0000);
                setTimeout(() => {
                    this.shieldMesh.material.color.setHex(0x00ffff);
                }, 100);
            }
        }
        
        if (amount > 0) {
            this.health -= amount;
            if (this.health < 0) this.health = 0;
        }
        
        this.cameraShake = 2;
        
        this.mesh.traverse(child => {
            if (child.material && child.material.emissive) {
                const orig = child.material.emissive.getHex();
                child.material.emissive.setHex(0xff0000);
                setTimeout(() => child.material.emissive.setHex(orig), 100);
            }
        });
    }
    
    onBuildingCollision(building) {
        const center = new THREE.Vector3();
        building.bbox.getCenter(center);
        const pushDir = this.position.clone().sub(center);
        pushDir.y = Math.max(pushDir.y, 1);
        pushDir.normalize();
        this.position.add(pushDir.multiplyScalar(15));
        this.takeDamage(3);
    }
}
