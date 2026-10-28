export class Sound {
  private ctx: AudioContext | null = null;

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    this.ctx = new Ctx();
    return this.ctx;
  }

  unlock(): void {
    const ctx = this.ensure();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  }

  private tone(freq: number, duration: number, opts: { type?: OscillatorType; gain?: number; glideTo?: number; delay?: number } = {}): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.glideTo) osc.frequency.linearRampToValueAtTime(opts.glideTo, t0 + duration);
    const peak = opts.gain ?? 0.12;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  move(): void { this.tone(260, 0.04, { type: 'square', gain: 0.05 }); }
  rotate(): void { this.tone(440, 0.07, { type: 'triangle', gain: 0.08, glideTo: 520 }); }
  lock(): void { this.tone(140, 0.08, { type: 'square', gain: 0.07 }); }
  hardDrop(): void { this.tone(220, 0.1, { type: 'sawtooth', gain: 0.08, glideTo: 90 }); }

  linesCleared(count: number): void {
    const notes = [523.25, 659.25, 784.0, 1046.5];
    for (let i = 0; i < count; i++) this.tone(notes[i] ?? 1046.5, 0.16, { type: 'triangle', gain: 0.1, delay: i * 0.07 });
  }

  levelUp(): void {
    [523.25, 659.25, 880.0].forEach((f, i) => this.tone(f, 0.18, { type: 'sine', gain: 0.1, delay: i * 0.09 }));
  }

  gameOver(): void {
    this.tone(300, 0.5, { type: 'sawtooth', gain: 0.1, glideTo: 60 });
  }

  startPad(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 2);
    master.connect(ctx.destination);
    for (const freq of [110, 164.81]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(master);
      osc.start();
    }
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.1;
    lfoGain.gain.value = 0.009;
    lfo.connect(lfoGain).connect(master.gain);
    lfo.start();
  }
}
