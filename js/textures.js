// Texture Generation Module - Procedural textures for game objects

export class TextureManager {
    constructor() {
        this.textures = {};
        this.generateAllTextures();
    }
    
    generateAllTextures() {
        // Ship textures
        this.textures.shipHull = this.createShipHullTexture();
        this.textures.shipDetail = this.createShipDetailTexture();
        this.textures.cockpit = this.createCockpitTexture();
        this.textures.engineGlow = this.createEngineGlowTexture();
        
        // Enemy textures
        this.textures.enemyHull = this.createEnemyHullTexture();
        this.textures.enemyGlow = this.createEnemyGlowTexture();
        
        // Environment textures
        this.textures.metal = this.createMetalTexture();
        this.textures.sciFiPanel = this.createSciFiPanelTexture();
        this.textures.neonSign = this.createNeonSignTexture();
        this.textures.hologram = this.createHologramTexture();
        
        // Effect textures
        this.textures.shield = this.createShieldTexture();
        this.textures.explosion = this.createExplosionTexture();
        this.textures.projectile = this.createProjectileTexture();
    }
    
    createShipHullTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Base metallic blue
        const gradient = ctx.createLinearGradient(0, 0, 512, 512);
        gradient.addColorStop(0, '#1a5a8a');
        gradient.addColorStop(0.5, '#2a8acc');
        gradient.addColorStop(1, '#1a4a6a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        // Panel lines
        ctx.strokeStyle = '#0a2a3a';
        ctx.lineWidth = 2;
        
        // Horizontal panel lines
        for (let y = 0; y < 512; y += 64) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(512, y);
            ctx.stroke();
        }
        
        // Vertical panel lines with offsets
        for (let x = 0; x < 512; x += 128) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 512);
            ctx.stroke();
        }
        
        // Rivets
        ctx.fillStyle = '#4a9acc';
        for (let y = 32; y < 512; y += 64) {
            for (let x = 32; x < 512; x += 64) {
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Tech details - small lights/vents
        ctx.fillStyle = '#00ffff';
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            ctx.fillRect(x, y, 8, 3);
        }
        
        // Surface scratches/wear
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 50; i++) {
            ctx.beginPath();
            const x1 = Math.random() * 512;
            const y1 = Math.random() * 512;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 + (Math.random() - 0.5) * 40, y1 + (Math.random() - 0.5) * 40);
            ctx.stroke();
        }
        
        // Specular highlights
        const highlight = ctx.createRadialGradient(150, 150, 0, 150, 150, 300);
        highlight.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlight;
        ctx.fillRect(0, 0, 512, 512);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    createShipDetailTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Dark base
        ctx.fillStyle = '#0a1a2a';
        ctx.fillRect(0, 0, 256, 256);
        
        // Tech grid pattern
        ctx.strokeStyle = '#1a4a6a';
        ctx.lineWidth = 1;
        for (let x = 0; x < 256; x += 16) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 256);
            ctx.stroke();
        }
        for (let y = 0; y < 256; y += 16) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(256, y);
            ctx.stroke();
        }
        
        // Glowing accent lines
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        
        // Horizontal accent
        ctx.beginPath();
        ctx.moveTo(20, 128);
        ctx.lineTo(236, 128);
        ctx.stroke();
        
        // Vent slots
        ctx.fillStyle = '#000';
        for (let y = 60; y < 100; y += 12) {
            ctx.fillRect(80, y, 96, 6);
        }
        for (let y = 160; y < 200; y += 12) {
            ctx.fillRect(80, y, 96, 6);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createCockpitTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Glass gradient
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 180);
        gradient.addColorStop(0, 'rgba(150, 220, 255, 0.9)');
        gradient.addColorStop(0.5, 'rgba(100, 180, 220, 0.7)');
        gradient.addColorStop(1, 'rgba(50, 100, 150, 0.5)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        
        // Reflection streaks
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(50, 50);
        ctx.lineTo(150, 100);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(70, 70);
        ctx.lineTo(130, 100);
        ctx.stroke();
        
        // HUD reflection dots
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        for (let i = 0; i < 20; i++) {
            const x = 80 + Math.random() * 96;
            const y = 80 + Math.random() * 96;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createEngineGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Radial glow
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(100, 255, 200, 1)');
        gradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.8)');
        gradient.addColorStop(0.8, 'rgba(0, 100, 200, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 50, 100, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createEnemyHullTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Dark red/black base
        const gradient = ctx.createLinearGradient(0, 0, 512, 512);
        gradient.addColorStop(0, '#2a0a0a');
        gradient.addColorStop(0.5, '#4a1515');
        gradient.addColorStop(1, '#2a0505');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        // Angular panel pattern
        ctx.strokeStyle = '#5a2020';
        ctx.lineWidth = 3;
        
        // Diagonal lines
        for (let i = -512; i < 1024; i += 64) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 512, 512);
            ctx.stroke();
        }
        
        // Opposite diagonal
        ctx.strokeStyle = '#401010';
        for (let i = -512; i < 1024; i += 64) {
            ctx.beginPath();
            ctx.moveTo(i + 512, 0);
            ctx.lineTo(i, 512);
            ctx.stroke();
        }
        
        // Red warning lights
        ctx.fillStyle = '#ff0044';
        ctx.shadowColor = '#ff0044';
        ctx.shadowBlur = 15;
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Battle damage/scorches
        ctx.shadowBlur = 0;
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const radius = 5 + Math.random() * 15;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
            gradient.addColorStop(0.5, 'rgba(30, 10, 10, 0.4)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    createEnemyGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255, 100, 50, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 50, 0, 0.8)');
        gradient.addColorStop(0.6, 'rgba(200, 0, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(100, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createMetalTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Brushed metal effect
        ctx.fillStyle = '#404550';
        ctx.fillRect(0, 0, 256, 256);
        
        // Horizontal brush strokes
        for (let y = 0; y < 256; y++) {
            const brightness = 60 + Math.random() * 20;
            ctx.strokeStyle = `rgb(${brightness}, ${brightness + 5}, ${brightness + 10})`;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(256, y);
            ctx.stroke();
        }
        
        // Slight color variation patches
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 50);
            gradient.addColorStop(0, 'rgba(100, 110, 120, 0.2)');
            gradient.addColorStop(1, 'rgba(100, 110, 120, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 256, 256);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    createSciFiPanelTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Dark base
        ctx.fillStyle = '#151520';
        ctx.fillRect(0, 0, 256, 256);
        
        // Panel border
        ctx.strokeStyle = '#2a2a3a';
        ctx.lineWidth = 4;
        ctx.strokeRect(8, 8, 240, 240);
        
        // Inner panel
        ctx.fillStyle = '#1a1a25';
        ctx.fillRect(16, 16, 224, 224);
        
        // Tech lines
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 5;
        
        // Circuit-like pattern
        ctx.beginPath();
        ctx.moveTo(30, 128);
        ctx.lineTo(80, 128);
        ctx.lineTo(100, 100);
        ctx.lineTo(150, 100);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(30, 160);
        ctx.lineTo(60, 160);
        ctx.lineTo(80, 180);
        ctx.lineTo(200, 180);
        ctx.stroke();
        
        // Glowing dots at intersections
        ctx.fillStyle = '#00ffff';
        const dots = [[80, 128], [100, 100], [150, 100], [60, 160], [80, 180]];
        dots.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Small indicator lights
        ctx.shadowBlur = 8;
        const colors = ['#00ff00', '#ffff00', '#ff0000', '#00ffff'];
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = colors[i];
            ctx.shadowColor = colors[i];
            ctx.beginPath();
            ctx.arc(200, 40 + i * 20, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createNeonSignTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Dark background
        ctx.fillStyle = '#0a0a15';
        ctx.fillRect(0, 0, 512, 256);
        
        // Neon text effect
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Outer glow
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#ff00ff';
        ctx.fillText('CYBER', 256, 80);
        
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#00ffff';
        ctx.fillText('CITY', 256, 170);
        
        // Inner bright
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('CYBER', 256, 80);
        ctx.fillText('CITY', 256, 170);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createHologramTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Transparent base with scanlines
        ctx.fillStyle = 'rgba(0, 200, 255, 0.1)';
        ctx.fillRect(0, 0, 256, 256);
        
        // Scanlines
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        for (let y = 0; y < 256; y += 4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(256, y);
            ctx.stroke();
        }
        
        // Glitch lines
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 5; i++) {
            const y = Math.random() * 256;
            ctx.fillRect(0, y, 256, 2);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.transparent = true;
        return texture;
    }
    
    createShieldTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Hexagonal pattern
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, 256, 256);
        
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        
        const hexSize = 20;
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                const x = col * hexSize * 1.5 + (row % 2) * hexSize * 0.75;
                const y = row * hexSize * 0.866;
                this.drawHexagon(ctx, x, y, hexSize / 2);
            }
        }
        
        // Center glow
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
        gradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 100, 200, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    drawHexagon(ctx, x, y, size) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60 - 30) * Math.PI / 180;
            const px = x + size * Math.cos(angle);
            const py = y + size * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
    }
    
    createExplosionTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 200, 50, 1)');
        gradient.addColorStop(0.4, 'rgba(255, 100, 0, 0.8)');
        gradient.addColorStop(0.7, 'rgba(200, 50, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(100, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    createProjectileTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(100, 255, 255, 1)');
        gradient.addColorStop(0.6, 'rgba(0, 200, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(0, 100, 200, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    get(name) {
        return this.textures[name];
    }
    
    // Create normal map from texture for better lighting
    createNormalMapFromTexture(texture, strength = 1) {
        // Simplified normal map generation
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Neutral normal (facing out)
        ctx.fillStyle = 'rgb(128, 128, 255)';
        ctx.fillRect(0, 0, 256, 256);
        
        // Add some variation
        for (let y = 0; y < 256; y += 8) {
            for (let x = 0; x < 256; x += 8) {
                const variation = Math.random() * 20 - 10;
                ctx.fillStyle = `rgb(${128 + variation}, ${128 + variation}, 255)`;
                ctx.fillRect(x, y, 8, 8);
            }
        }
        
        return new THREE.CanvasTexture(canvas);
    }
}

// Singleton instance
export const textureManager = new TextureManager();
