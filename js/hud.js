// HUD (Heads-Up Display) Module

export class HUD {
    constructor() {
        // Cache DOM elements
        this.healthFill = document.getElementById('health-fill');
        this.healthText = document.getElementById('health-text');
        this.scoreValue = document.getElementById('score-value');
        this.speedValue = document.getElementById('speed-value');
        this.radarCanvas = document.getElementById('radar-canvas');
        this.radarCtx = this.radarCanvas.getContext('2d');
        
        // Create additional HUD elements
        this.createAdditionalElements();
        
        // Radar settings
        this.radarRange = 500; // Units visible on radar
        this.radarSize = 150;
        this.radarCenter = this.radarSize / 2;
    }
    
    createAdditionalElements() {
        const hud = document.getElementById('hud');
        
        // Shield bar
        const shieldBar = document.createElement('div');
        shieldBar.id = 'shield-bar';
        shieldBar.innerHTML = `
            <div id="shield-fill"></div>
            <span id="shield-text">0</span>
        `;
        hud.appendChild(shieldBar);
        this.shieldFill = shieldBar.querySelector('#shield-fill');
        this.shieldText = shieldBar.querySelector('#shield-text');
        
        // Combo display
        const comboDisplay = document.createElement('div');
        comboDisplay.id = 'combo-display';
        comboDisplay.innerHTML = `
            <div id="combo-multiplier">1x</div>
            <div id="combo-bar"><div id="combo-fill"></div></div>
        `;
        hud.appendChild(comboDisplay);
        this.comboMultiplierEl = comboDisplay.querySelector('#combo-multiplier');
        this.comboFill = comboDisplay.querySelector('#combo-fill');
        
        // Weapon display
        const weaponDisplay = document.createElement('div');
        weaponDisplay.id = 'weapon-display';
        weaponDisplay.innerHTML = `
            <div id="weapon-name">LASER</div>
            <div id="weapon-indicator"></div>
        `;
        hud.appendChild(weaponDisplay);
        this.weaponName = weaponDisplay.querySelector('#weapon-name');
        this.weaponIndicator = weaponDisplay.querySelector('#weapon-indicator');
        
        // Difficulty display
        const difficultyDisplay = document.createElement('div');
        difficultyDisplay.id = 'difficulty-display';
        difficultyDisplay.innerHTML = `LEVEL <span id="difficulty-value">1</span>`;
        hud.appendChild(difficultyDisplay);
        this.difficultyValue = difficultyDisplay.querySelector('#difficulty-value');
        
        // Active effects display
        const effectsDisplay = document.createElement('div');
        effectsDisplay.id = 'effects-display';
        hud.appendChild(effectsDisplay);
        this.effectsDisplay = effectsDisplay;
        
        // Add styles
        this.injectStyles();
    }
    
    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #shield-bar {
                position: absolute;
                top: 50px;
                left: 20px;
                width: 200px;
                height: 16px;
                border: 2px solid #00aaff;
                background: rgba(0, 0, 0, 0.5);
            }
            
            #shield-fill {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #0088ff, #00ffff);
                transition: width 0.3s ease;
            }
            
            #shield-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 10px;
                font-weight: bold;
                text-shadow: 0 0 5px #000;
                color: #00ffff;
            }
            
            #combo-display {
                position: absolute;
                top: 80px;
                right: 20px;
                text-align: right;
            }
            
            #combo-multiplier {
                font-size: 32px;
                font-weight: bold;
                text-shadow: 0 0 15px #ffff00;
                color: #ffff00;
                transition: all 0.2s ease;
            }
            
            #combo-multiplier.high {
                color: #ff4400;
                text-shadow: 0 0 20px #ff4400;
                transform: scale(1.2);
            }
            
            #combo-bar {
                width: 100px;
                height: 4px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid #ffff00;
                margin-top: 5px;
            }
            
            #combo-fill {
                height: 100%;
                width: 100%;
                background: #ffff00;
                transition: width 0.1s linear;
            }
            
            #weapon-display {
                position: absolute;
                bottom: 20px;
                right: 20px;
                text-align: right;
            }
            
            #weapon-name {
                font-size: 18px;
                letter-spacing: 3px;
                text-shadow: 0 0 10px currentColor;
            }
            
            #weapon-indicator {
                width: 100px;
                height: 4px;
                margin-top: 5px;
                background: #00ffff;
                box-shadow: 0 0 10px currentColor;
            }
            
            #difficulty-display {
                position: absolute;
                top: 80px;
                left: 20px;
                font-size: 14px;
                color: #ff8800;
                text-shadow: 0 0 10px #ff8800;
            }
            
            #difficulty-value {
                font-size: 18px;
                font-weight: bold;
            }
            
            #effects-display {
                position: absolute;
                bottom: 180px;
                left: 20px;
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .effect-item {
                font-size: 12px;
                padding: 4px 10px;
                background: rgba(0, 0, 0, 0.7);
                border-left: 3px solid;
                animation: effectPulse 1s infinite;
            }
            
            @keyframes effectPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
        `;
        document.head.appendChild(style);
    }
    
    update(player, score, enemies, comboMultiplier = 1, combo = 0, comboTimePercent = 0, difficultyLevel = 1) {
        this.updateHealth(player.health, player.maxHealth);
        this.updateShield(player.getShield(), player.maxShield);
        this.updateScore(score);
        this.updateSpeed(player.getSpeed());
        this.updateCombo(comboMultiplier, comboTimePercent);
        this.updateWeapon(player.getWeaponInfo());
        this.updateEffects(player.getActiveEffects());
        this.updateDifficulty(difficultyLevel);
        this.updateRadar(player, enemies);
    }
    
    updateHealth(current, max) {
        const percentage = (current / max) * 100;
        this.healthFill.style.width = `${percentage}%`;
        this.healthText.textContent = Math.ceil(current);
        
        // Change color based on health
        if (percentage > 60) {
            this.healthFill.style.background = 'linear-gradient(90deg, #00ff00, #00ffff)';
        } else if (percentage > 30) {
            this.healthFill.style.background = 'linear-gradient(90deg, #ffff00, #ff8800)';
        } else {
            this.healthFill.style.background = 'linear-gradient(90deg, #ff0000, #ff4400)';
        }
    }
    
    updateScore(score) {
        this.scoreValue.textContent = score.toString().padStart(6, '0');
    }
    
    updateShield(current, max) {
        const percentage = (current / max) * 100;
        this.shieldFill.style.width = `${percentage}%`;
        this.shieldText.textContent = Math.ceil(current);
    }
    
    updateCombo(multiplier, timePercent) {
        this.comboMultiplierEl.textContent = `${multiplier}x`;
        this.comboFill.style.width = `${timePercent * 100}%`;
        
        // Visual feedback for high combos
        if (multiplier >= 4) {
            this.comboMultiplierEl.classList.add('high');
        } else {
            this.comboMultiplierEl.classList.remove('high');
        }
    }
    
    updateWeapon(weaponInfo) {
        this.weaponName.textContent = weaponInfo.name;
        this.weaponName.style.color = '#' + weaponInfo.color.toString(16).padStart(6, '0');
        this.weaponIndicator.style.background = '#' + weaponInfo.color.toString(16).padStart(6, '0');
    }
    
    updateEffects(activeEffects) {
        this.effectsDisplay.innerHTML = '';
        
        const effectColors = {
            'rapid_fire': '#ffff00',
            'damage_boost': '#ff4400',
            'speed_boost': '#44ff88',
            'spread_shot': '#ff00ff'
        };
        
        const effectNames = {
            'rapid_fire': 'RAPID FIRE',
            'damage_boost': 'DAMAGE x2',
            'speed_boost': 'SPEED BOOST',
            'spread_shot': 'SPREAD SHOT'
        };
        
        for (const [effect, data] of Object.entries(activeEffects)) {
            const el = document.createElement('div');
            el.className = 'effect-item';
            el.style.borderColor = effectColors[effect] || '#ffffff';
            el.style.color = effectColors[effect] || '#ffffff';
            el.textContent = `${effectNames[effect] || effect} ${Math.ceil(data.remaining)}s`;
            this.effectsDisplay.appendChild(el);
        }
    }
    
    updateDifficulty(level) {
        this.difficultyValue.textContent = level;
    }

    updateSpeed(speed) {
        this.speedValue.textContent = Math.round(speed);
    }
    
    updateRadar(player, enemies) {
        const ctx = this.radarCtx;
        const center = this.radarCenter;
        const size = this.radarSize;
        
        // Clear radar
        ctx.clearRect(0, 0, size, size);
        
        // Draw background rings
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        
        for (let r = 25; r <= 75; r += 25) {
            ctx.beginPath();
            ctx.arc(center, center, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw crosshairs
        ctx.beginPath();
        ctx.moveTo(center, 0);
        ctx.lineTo(center, size);
        ctx.moveTo(0, center);
        ctx.lineTo(size, center);
        ctx.stroke();
        
        // Player position and rotation
        const playerPos = player.getPosition();
        const playerRotY = player.yaw;
        
        // Draw player (center)
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(center, center, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw direction indicator
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(
            center + Math.sin(playerRotY) * 15,
            center - Math.cos(playerRotY) * 15
        );
        ctx.stroke();
        
        // Draw enemies
        for (const enemy of enemies) {
            if (!enemy.active) continue;
            
            const enemyPos = enemy.getPosition();
            
            // Calculate relative position
            const dx = enemyPos.x - playerPos.x;
            const dz = enemyPos.z - playerPos.z;
            
            // Check if within radar range
            const distance = Math.sqrt(dx * dx + dz * dz);
            if (distance > this.radarRange) continue;
            
            // Convert to radar coordinates
            // Rotate based on player facing direction
            const cos = Math.cos(-playerRotY);
            const sin = Math.sin(-playerRotY);
            const rx = dx * cos - dz * sin;
            const rz = dx * sin + dz * cos;
            
            // Scale to radar size
            const scale = (size / 2 - 10) / this.radarRange;
            const radarX = center + rx * scale;
            const radarY = center - rz * scale;
            
            // Draw enemy blip
            ctx.fillStyle = '#ff0044';
            ctx.beginPath();
            ctx.arc(radarX, radarY, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw distance ring for close enemies
            if (distance < 150) {
                ctx.strokeStyle = 'rgba(255, 0, 68, 0.5)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(radarX, radarY, 6, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        // Sweep line animation
        const time = Date.now() / 1000;
        const sweepAngle = (time % 4) * (Math.PI / 2);
        
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(
            center + Math.sin(sweepAngle) * (size / 2 - 5),
            center - Math.cos(sweepAngle) * (size / 2 - 5)
        );
        ctx.stroke();
    }
    
    showMessage(text, duration = 2000) {
        // Create temporary message element
        const message = document.createElement('div');
        message.className = 'hud-message';
        message.textContent = text;
        message.style.cssText = `
            position: absolute;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 32px;
            color: #00ffff;
            text-shadow: 0 0 20px #00ffff;
            letter-spacing: 5px;
            animation: fadeInOut ${duration}ms ease;
            pointer-events: none;
        `;
        
        document.getElementById('hud').appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, duration);
    }
}

// Add animation keyframes dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(1.1); }
    }
`;
document.head.appendChild(style);
