function env(ctx, t, a = 0.01, d = 0.12, vol = 0.12) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  return g;
}

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.music = null;
    this.track = "none";
  }

  unlock() {
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  beep(freq, type = "square", dur = 0.12, vol = 0.08, slide = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    const g = env(this.ctx, t, 0.005, dur, vol);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noise(dur = 0.08, vol = 0.05, freq = 800) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = freq;
    const g = env(this.ctx, t, 0.001, dur, vol);
    src.connect(f).connect(g).connect(this.ctx.destination);
    src.start(t);
  }

  sfx(name) {
    switch (name) {
      case "hit":
        this.beep(180, "square", 0.09, 0.07, -80);
        this.noise(0.07, 0.04, 900);
        break;
      case "strong":
        this.beep(120, "sawtooth", 0.16, 0.09, -70);
        this.noise(0.12, 0.06, 400);
        break;
      case "special":
        this.beep(520, "triangle", 0.18, 0.07, 200);
        break;
      case "jump":
        this.beep(420, "square", 0.1, 0.05, 180);
        break;
      case "land":
        this.noise(0.05, 0.04, 220);
        break;
      case "ko":
        this.beep(90, "sawtooth", 0.45, 0.1, -50);
        this.noise(0.3, 0.08, 180);
        break;
      case "shield":
        this.beep(700, "triangle", 0.06, 0.04);
        break;
      case "select":
        this.beep(660, "square", 0.07, 0.05);
        break;
      case "confirm":
        this.beep(520, "square", 0.08, 0.05);
        this.beep(780, "square", 0.1, 0.04);
        break;
      case "ui":
        this.beep(440, "square", 0.05, 0.04);
        break;
      case "whoosh":
        this.noise(0.1, 0.04, 1400);
        break;
      default:
        break;
    }
  }

  playMusic(track) {
    try {
      this.unlock();
      if (this.track === track) return;
      this.stopMusic();
      this.track = track;
      if (!this.ctx || this.muted) return;
      if (track === "menu") this.loopArp([262, 330, 392, 523, 392, 330], 0.22, "triangle", 0.03);
      if (track === "battle") this.loopArp([196, 247, 294, 370, 294, 247, 220, 247], 0.18, "square", 0.025);
    } catch {
      this.track = track;
    }
  }

  loopArp(notes, step, type, vol) {
    const ctx = this.ctx;
    const master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);
    let i = 0;
    const tick = () => {
      if (this.track === "none" || !this.ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = notes[i % notes.length];
      const g = ctx.createGain();
      g.gain.setValueAtTime(1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + step * 0.9);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + step);
      i++;
      this.music = setTimeout(tick, step * 1000);
    };
    tick();
  }

  stopMusic() {
    this.track = "none";
    if (this.music) clearTimeout(this.music);
    this.music = null;
  }
}
