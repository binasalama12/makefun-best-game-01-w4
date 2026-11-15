// Tiny WebAudio synth: no audio files, every sound is an oscillator phrase.
// The context is created lazily on the first user gesture (browser policy).

export function createAudio() {
  let context = null;
  let muted = false;

  function ensureContext() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return context;
    }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    context = new AudioCtor();
    return context;
  }

  function tone({ freqStart, freqEnd = freqStart, duration = 0.12, type = 'square', volume = 0.16, delay = 0 }) {
    if (muted) return;
    const ctx = ensureContext();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), t0 + duration);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  return {
    unlock() {
      ensureContext();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    playJump() {
      tone({ freqStart: 280, freqEnd: 620, duration: 0.14, type: 'square', volume: 0.12 });
    },
    playDoubleJump() {
      tone({ freqStart: 420, freqEnd: 940, duration: 0.16, type: 'square', volume: 0.12 });
      tone({ freqStart: 840, freqEnd: 1250, duration: 0.12, type: 'triangle', volume: 0.1, delay: 0.03 });
    },
    playEmber() {
      tone({ freqStart: 990, freqEnd: 990, duration: 0.07, type: 'sine', volume: 0.16 });
      tone({ freqStart: 1480, freqEnd: 1480, duration: 0.1, type: 'sine', volume: 0.14, delay: 0.055 });
    },
    playClang() {
      tone({ freqStart: 220, freqEnd: 90, duration: 0.22, type: 'sawtooth', volume: 0.2 });
      tone({ freqStart: 1240, freqEnd: 700, duration: 0.1, type: 'square', volume: 0.08 });
      tone({ freqStart: 90, freqEnd: 55, duration: 0.3, type: 'triangle', volume: 0.18, delay: 0.02 });
    },
    playGate() {
      [523, 659, 784, 1047].forEach((freq, i) =>
        tone({ freqStart: freq, duration: 0.16, type: 'triangle', volume: 0.15, delay: i * 0.09 }));
    },
    playGameOver() {
      [392, 330, 262, 196].forEach((freq, i) =>
        tone({ freqStart: freq, freqEnd: freq * 0.94, duration: 0.24, type: 'triangle', volume: 0.15, delay: i * 0.16 }));
    },
  };
}
