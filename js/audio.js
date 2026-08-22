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
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;

    switch (name) {
      case "hit":
        this.beep(210, "square", 0.09, 0.07, -90);
        this.noise(0.06, 0.04, 900);
        break;

      case "strong":
        this.beep(110, "sawtooth", 0.18, 0.1, -60);
        this.noise(0.14, 0.07, 380);
        break;

      case "special":
        this.beep(540, "triangle", 0.18, 0.08, 220);
        break;

      case "lasso_throw":
        // Estalo e chicotada rápida de laço
        this.noise(0.12, 0.06, 1600);
        this.beep(480, "sawtooth", 0.08, 0.05, -280);
        break;

      case "lasso_clash":
        // Som metálico e elétrico do Duelo de Laços
        this.beep(880, "triangle", 0.14, 0.12, -400);
        this.beep(1200, "square", 0.08, 0.08, -600);
        this.noise(0.1, 0.08, 2400);
        break;

      case "lasso_tug":
        // Puxão de corda com tensão
        this.beep(320, "sawtooth", 0.07, 0.09, 140);
        this.noise(0.05, 0.04, 1100);
        break;

      case "horse_whinny":
        // Relincho característico do cavalo sintetizado
        {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = "sawtooth";
          o.frequency.setValueAtTime(450, t);
          o.frequency.linearRampToValueAtTime(750, t + 0.15);
          o.frequency.linearRampToValueAtTime(620, t + 0.35);
          o.frequency.linearRampToValueAtTime(820, t + 0.5);
          o.frequency.exponentialRampToValueAtTime(200, t + 0.7);
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.09, t + 0.1);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.72);
          o.connect(g).connect(this.ctx.destination);
          o.start(t);
          o.stop(t + 0.75);
        }
        break;

      case "horse_gallop":
        // Patas galopando no chão de terra
        this.noise(0.04, 0.06, 320);
        setTimeout(() => this.noise(0.03, 0.05, 360), 70);
        break;

      case "berrante":
        // Chamado clássico de berrante de rodeio
        {
          const freqs = [196, 294, 392, 440];
          freqs.forEach((f, idx) => {
            const startT = t + idx * 0.14;
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = "sawtooth";
            o.frequency.setValueAtTime(f, startT);
            o.frequency.linearRampToValueAtTime(f * 1.05, startT + 0.18);
            g.gain.setValueAtTime(0, startT);
            g.gain.linearRampToValueAtTime(0.08, startT + 0.04);
            g.gain.exponentialRampToValueAtTime(0.0001, startT + 0.3);
            o.connect(g).connect(this.ctx.destination);
            o.start(startT);
            o.stop(startT + 0.32);
          });
        }
        break;

      case "eight_seconds_horn":
        // Buzina de 8 segundos de rodeio
        {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = "sawtooth";
          o.frequency.setValueAtTime(440, t);
          o.frequency.setValueAtTime(554, t + 0.18);
          o.frequency.setValueAtTime(659, t + 0.36);
          g.gain.setValueAtTime(0.12, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
          o.connect(g).connect(this.ctx.destination);
          o.start(t);
          o.stop(t + 0.9);
        }
        break;

      case "cheer":
        // Torcida de rodeio aplaudindo e vibrando
        this.noise(0.45, 0.08, 1200);
        setTimeout(() => this.noise(0.35, 0.06, 950), 120);
        break;

      case "thunder":
        // Trovão estrondoso
        this.beep(80, "sawtooth", 0.3, 0.12, -40);
        this.noise(0.6, 0.11, 240);
        break;

      case "super_ready":
        // Barra de especial 100% cheia
        this.beep(523, "triangle", 0.09, 0.07);
        setTimeout(() => this.beep(659, "triangle", 0.09, 0.07), 80);
        setTimeout(() => this.beep(784, "triangle", 0.14, 0.09), 160);
        break;

      case "super_activate":
        // Ativação do Super Ataque da Aurora
        this.beep(260, "sawtooth", 0.35, 0.14, 400);
        this.beep(520, "triangle", 0.35, 0.12, 600);
        this.noise(0.25, 0.09, 1800);
        break;

      case "jump":
        this.beep(380, "square", 0.09, 0.05, 200);
        break;

      case "land":
        this.noise(0.05, 0.04, 240);
        break;

      case "ko":
        this.beep(85, "sawtooth", 0.5, 0.12, -45);
        this.noise(0.35, 0.09, 160);
        break;

      case "shield":
        this.beep(720, "triangle", 0.07, 0.05);
        break;

      case "select":
        this.beep(660, "square", 0.06, 0.05);
        break;

      case "confirm":
        this.beep(520, "square", 0.07, 0.05);
        this.beep(780, "square", 0.09, 0.05);
        break;

      case "ui":
        this.beep(440, "square", 0.04, 0.04);
        break;

      case "whoosh":
        this.noise(0.09, 0.04, 1400);
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

      if (track === "menu") {
        // Melodia sertaneja country alegre e acolhedora em chiptune
        const notes = [294, 370, 440, 587, 440, 370, 294, 370, 330, 415, 494, 659, 494, 415, 330, 415];
        this.loopArp(notes, 0.18, "triangle", 0.035);
      } else if (track === "rodeo" || track === "battle") {
        // Trilha animada de rodeio e combate épico
        const notes = [
          196, 247, 294, 392, 294, 247,
          220, 262, 330, 440, 330, 262,
          185, 233, 277, 370, 277, 233,
          196, 294, 392, 587, 392, 294,
        ];
        this.loopArp(notes, 0.14, "square", 0.026);
      } else if (track === "boss") {
        // Tema tenso e épico de chefe
        const notes = [147, 175, 220, 294, 220, 175, 131, 156, 196, 262, 196, 156, 123, 147, 185, 247];
        this.loopArp(notes, 0.12, "sawtooth", 0.024);
      } else if (track === "duel") {
        // Trilha de tensão rápida do Duelo de Laço
        const notes = [440, 494, 523, 587, 659, 587, 523, 494];
        this.loopArp(notes, 0.08, "square", 0.028);
      }
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
      g.gain.exponentialRampToValueAtTime(0.001, t + step * 0.88);
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
