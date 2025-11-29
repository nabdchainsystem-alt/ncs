export class SoundManager {
    ctx: AudioContext | null = null;
    masterGain: GainNode | null = null;
    engineOsc: OscillatorNode | null = null;
    engineGain: GainNode | null = null;
    isMuted: boolean = false;

    constructor() {
        try {
            // @ts-ignore
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3; // Lower volume
            this.masterGain.connect(this.ctx.destination);
        } catch (e) {
            console.error('Web Audio API not supported', e);
        }
    }

    init() {
        if (this.ctx?.state === 'suspended') {
            this.ctx.resume();
        }
    }

    startEngine() {
        if (!this.ctx || !this.masterGain) return;

        // Engine hum - Filtered noise for jet sound
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds buffer
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200; // Low rumble

        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.value = 0.05; // Very quiet

        noise.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.masterGain);

        noise.start();
        this.engineOsc = noise as any; // Hack to store it
        // Store filter to modulate pitch (cutoff)
        (this.engineOsc as any).filter = filter;
    }

    updateEnginePitch(speedRatio: number) {
        if (!this.engineOsc) return;
        // Modulate filter cutoff for "revving" effect
        const filter = (this.engineOsc as any).filter as BiquadFilterNode;
        if (filter) {
            const targetFreq = 200 + (speedRatio * 400); // 200Hz to 600Hz
            filter.frequency.setTargetAtTime(targetFreq, this.ctx!.currentTime, 0.1);
        }
    }

    stopEngine() {
        if (this.engineOsc) {
            this.engineOsc.stop();
            this.engineOsc.disconnect();
            this.engineOsc = null;
        }
    }

    playShoot() {
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playExplosion() {
        if (!this.ctx || !this.masterGain) return;

        // Noise buffer for explosion
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
    }

    playRefuel() {
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
}
