/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio API Synthesizer for Retro Game Style sound FX
// Let's use standard AudioContext lazily initialized to bypass browser blocks
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playWeddingBell() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Low bell chime
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(293.66, now + 1.5); // D4
    
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880.00, now); // A5
    osc2.frequency.exponentialRampToValueAtTime(440.00, now + 1.2); // A4
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.02);
    osc2.stop(now + 2.02);
  } catch (e) {
    console.warn("Audio Context blocked or failed:", e);
  }
}

export function playSquishedSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Squish synth: Noise combined with pitching down triangle
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(1000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.12);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    const tone = ctx.createOscillator();
    tone.type = "sawtooth";
    tone.frequency.setValueAtTime(250, now);
    tone.frequency.exponentialRampToValueAtTime(40, now + 0.12);
    
    const toneGain = ctx.createGain();
    toneGain.gain.setValueAtTime(0.15, now);
    toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    tone.connect(toneGain);
    toneGain.connect(ctx.destination);
    
    noise.start(now);
    tone.start(now);
    noise.stop(now + 0.2);
    tone.stop(now + 0.2);
  } catch (e) {
    console.warn(e);
  }
}

export function playHoldLockSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Robotic physical locking chime
    const score = [440, 554, 659, 880]; // A major arpeggio
    score.forEach((f, index) => {
      const time = now + index * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "square";
      osc.frequency.setValueAtTime(f, time);
      
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + 0.25);
    });
  } catch (e) {
    console.warn(e);
  }
}

export function playCheerSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Wave of cheers
    const freqs = [330, 392, 523, 659];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(f * 1.2, now + 0.5);
      
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.65);
    });
  } catch (e) {
    console.warn(e);
  }
}

export function playShockSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Drama chord
    const chord = [110, 116, 123]; // Dissonant bass
    chord.forEach(f => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f, now);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.85);
    });
  } catch (e) {
    console.warn(e);
  }
}
