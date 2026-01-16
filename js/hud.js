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
        
        // Radar settings
        this.radarRange = 500; // Units visible on radar
        this.radarSize = 150;
        this.radarCenter = this.radarSize / 2;
    }
    
    update(player, score, enemies) {
        this.updateHealth(player.health, player.maxHealth);
        this.updateScore(score);
        this.updateSpeed(player.getSpeed());
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
