// Audio System Module - Procedural sound effects using Web Audio API

export class AudioSystem {
    constructor() {
        this.context = null;
        this.masterVolume = null;
        this.enabled = true;
        this.initialized = false;
        
        // Sound pools for frequently played sounds
        this.soundPools = {};
        
        // Music
        this.musicGain = null;
        this.musicPlaying = false;
    }
    
    init() {
        if (this.initialized) return;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterVolume = this.context.createGain();
            this.masterVolume.gain.value = 0.5;
            this.masterVolume.connect(this.context.destination);
            
            // Music channel
            this.musicGain = this.context.createGain();
            this.musicGain.gain.value = 0.3;
            this.musicGain.connect(this.masterVolume);
            
            this.initialized = true;
            console.log('Audio system initialized');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.enabled = false;
        }
    }
    
    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }
    
    // Laser/projectile shot sound
    playShoot(isPlayer = true) {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterVolume);
        
        if (isPlayer) {
            // Player laser: high-pitched sweeping
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1200, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.15);
            gain.gain.setValueAtTime(0.15, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.15);
        } else {
            // Enemy laser: lower, more aggressive
            osc.type = 'square';
            osc.frequency.setValueAtTime(400, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.2);
            gain.gain.setValueAtTime(0.1, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.2);
        }
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.2);
    }
    
    // Explosion sound
    playExplosion(size = 1) {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        
        // White noise burst
        const bufferSize = this.context.sampleRate * 0.5;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
        }
        
        const noise = this.context.createBufferSource();
        noise.buffer = buffer;
        
        // Low-pass filter for rumble
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000 * size, this.context.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.4);
        
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(0.3 * size, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.5);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterVolume);
        
        noise.start();
        
        // Add a bass thump
        const osc = this.context.createOscillator();
        const oscGain = this.context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80 * size, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.context.currentTime + 0.3);
        oscGain.gain.setValueAtTime(0.4 * size, this.context.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.3);
        
        osc.connect(oscGain);
        oscGain.connect(this.masterVolume);
        osc.start();
        osc.stop(this.context.currentTime + 0.4);
    }
    
    // Hit sound (enemy or player taking damage)
    playHit(isPlayer = false) {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterVolume);
        
        if (isPlayer) {
            // Player hit: alarming sound
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, this.context.currentTime);
            osc.frequency.setValueAtTime(150, this.context.currentTime + 0.05);
            osc.frequency.setValueAtTime(200, this.context.currentTime + 0.1);
            gain.gain.setValueAtTime(0.2, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.15);
        } else {
            // Enemy hit: satisfying ping
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.1);
            gain.gain.setValueAtTime(0.15, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.1);
        }
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.2);
    }
    
    // Power-up collect sound
    playPowerUp() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        
        // Ascending arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        notes.forEach((freq, i) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = this.context.currentTime + i * 0.08;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
            
            osc.connect(gain);
            gain.connect(this.masterVolume);
            
            osc.start(startTime);
            osc.stop(startTime + 0.25);
        });
    }
    
    // Shield activation/deactivation
    playShield(activate = true) {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.masterVolume);
        
        if (activate) {
            osc.frequency.setValueAtTime(200, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, this.context.currentTime + 0.2);
            gain.gain.setValueAtTime(0.15, this.context.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, this.context.currentTime + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.4);
        } else {
            osc.frequency.setValueAtTime(600, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.2);
            gain.gain.setValueAtTime(0.15, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.2);
        }
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.5);
    }
    
    // Weapon switch sound
    playWeaponSwitch() {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, this.context.currentTime);
        osc.frequency.setValueAtTime(600, this.context.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.1, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.masterVolume);
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.15);
    }
    
    // Combo/multiplier increase sound
    playCombo(level) {
        if (!this.enabled || !this.initialized) return;
        this.resume();
        
        const baseFreq = 400 + level * 100;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, this.context.currentTime);
        osc.frequency.setValueAtTime(baseFreq * 1.5, this.context.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.12, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(this.masterVolume);
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.2);
    }
    
    // Engine hum (continuous)
    startEngine() {
        if (!this.enabled || !this.initialized || this.engineOsc) return;
        this.resume();
        
        this.engineOsc = this.context.createOscillator();
        this.engineGain = this.context.createGain();
        this.engineFilter = this.context.createBiquadFilter();
        
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.value = 55;
        
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.value = 200;
        
        this.engineGain.gain.value = 0.05;
        
        this.engineOsc.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.masterVolume);
        
        this.engineOsc.start();
    }
    
    updateEngine(speed, boosting) {
        if (!this.engineOsc) return;
        
        const baseFreq = 55 + speed * 0.2;
        this.engineOsc.frequency.setTargetAtTime(
            boosting ? baseFreq * 1.5 : baseFreq,
            this.context.currentTime,
            0.1
        );
        
        const targetGain = boosting ? 0.1 : 0.05;
        this.engineGain.gain.setTargetAtTime(targetGain, this.context.currentTime, 0.1);
    }
    
    stopEngine() {
        if (this.engineOsc) {
            this.engineOsc.stop();
            this.engineOsc = null;
        }
    }
    
    // Background ambient music (procedural)
    startMusic() {
        if (!this.enabled || !this.initialized || this.musicPlaying) return;
        this.resume();
        
        this.musicPlaying = true;
        this.playMusicLoop();
    }
    
    playMusicLoop() {
        if (!this.musicPlaying) return;
        
        // Create a simple ambient pad
        const duration = 4;
        const notes = [110, 138.59, 164.81, 220]; // A2, C#3, E3, A3 (A major chord)
        
        notes.forEach((freq, i) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            const filter = this.context.createBiquadFilter();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            filter.type = 'lowpass';
            filter.frequency.value = 500;
            
            // Slow attack and release
            gain.gain.setValueAtTime(0, this.context.currentTime);
            gain.gain.linearRampToValueAtTime(0.08, this.context.currentTime + 1);
            gain.gain.linearRampToValueAtTime(0.08, this.context.currentTime + duration - 1);
            gain.gain.linearRampToValueAtTime(0, this.context.currentTime + duration);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start(this.context.currentTime);
            osc.stop(this.context.currentTime + duration);
        });
        
        // Schedule next loop
        setTimeout(() => this.playMusicLoop(), duration * 1000 - 500);
    }
    
    stopMusic() {
        this.musicPlaying = false;
    }
    
    setMasterVolume(volume) {
        if (this.masterVolume) {
            this.masterVolume.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        if (this.masterVolume) {
            this.masterVolume.gain.value = this.enabled ? 0.5 : 0;
        }
        return this.enabled;
    }
}

// Singleton instance
export const audioSystem = new AudioSystem();
