/* Procedural audio. No assets: pads, church bells, celesta, a gramophone waltz,
   wind/rain/fire/vinyl textures, and one-shot SFX. Everything routes through
   master compressor; most things get a touch of generated convolver reverb. */

let AC = null;

const Audio = {
  master: null, comp: null, reverb: null, revGain: null,
  muted: false, volume: 0.85,
  pad: null, waltz: null, channels: {}, heartbeat: null,
  _started: false,

  init() {
    if (this._started) {
      if (AC && AC.state === 'suspended') AC.resume();
      return;
    }
    this._started = true;
    this.volume = clamp01(Save.data.settings.volume ?? 0.85);
    AC = new (window.AudioContext || window.webkitAudioContext)();
    this.comp = AC.createDynamicsCompressor();
    this.comp.threshold.value = -18; this.comp.knee.value = 24;
    this.comp.ratio.value = 5; this.comp.attack.value = 0.004; this.comp.release.value = 0.32;
    this.master = AC.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume * 0.5;
    this.comp.connect(this.master); this.master.connect(AC.destination);

    /* generated impulse response — a stone chapel */
    const sr = AC.sampleRate, len = (sr * 3.2) | 0;
    const ir = AC.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const n = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.6);
        last = last * 0.62 + n * 0.38;            // soften highs
        d[i] = last * (i < 220 ? i / 220 : 1);
      }
    }
    this.reverb = AC.createConvolver(); this.reverb.buffer = ir;
    this.revGain = AC.createGain(); this.revGain.gain.value = 0.55;
    this.reverb.connect(this.revGain); this.revGain.connect(this.comp);

    this.pad = new Pad();
    this.waltz = new Waltz();
    this.channels = {
      wind: makeNoiseChannel('bandpass', 320, 0.45, 0.55),
      rain: makeNoiseChannel('bandpass', 1900, 0.4, 0.3),
      air:  makeNoiseChannel('bandpass', 620, 1.2, 0.5),   // breath / brush / gusts
      choir: new Choir(),
    };
    this.vinyl = new Vinyl();
  },

  out(dry = 1, wet = 0.3) {
    /* returns a gain node wired to master + reverb send */
    const g = AC.createGain();
    g.connect(this.comp);
    if (wet > 0) { const s = AC.createGain(); s.gain.value = wet; g.connect(s); s.connect(this.reverb); }
    g.gain.value = dry;
    return g;
  },

  setVolume(v) {
    this.volume = clamp01(v);
    if (this.master && !this.muted) this.master.gain.setTargetAtTime(this.volume * 0.5, AC.currentTime, 0.1);
    Save.data.settings.volume = this.volume; Save.write();
  },
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume * 0.5, AC.currentTime, 0.05);
    UI.flashNote(this.muted ? 'sound off — M' : 'sound on');
  },

  update(dt) {
    if (!AC) return;
    this.pad.update(dt);
    this.waltz.update(dt);
    if (this.heartbeat) this.heartbeat.update(dt);
  },

  /* ---------------- one-shots ---------------- */

  bell(note, vel = 0.5, decayMul = 1) {
    if (!AC) return;
    const f = noteFreq(note), t = AC.currentTime;
    const out = this.out(1, 0.5);
    const partials = [[0.5, 0.4, 7], [1, 1, 5.5], [1.19, 0.5, 4], [1.56, 0.32, 3.4], [2, 0.55, 3], [2.66, 0.2, 2.2], [3.01, 0.12, 1.6]];
    for (const [ratio, amp, dec] of partials) {
      const o = AC.createOscillator(); o.type = 'sine';
      o.frequency.value = f * ratio * (1 + rand(-0.0015, 0.0015));
      const g = AC.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel * amp * 0.16, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dec * decayMul);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + dec * decayMul + 0.1);
    }
    blip(out, f * 4, 0.02 * vel, 0.018, 'noise');
  },

  celesta(note, vel = 0.4) {
    if (!AC) return;
    const f = noteFreq(note), t = AC.currentTime;
    const out = this.out(1, 0.55);
    for (const [ratio, amp] of [[1, 1], [4, 0.22], [9.2, 0.06]]) {
      const o = AC.createOscillator(); o.type = 'sine';
      o.frequency.value = f * ratio * (1 + rand(-0.002, 0.002));
      const g = AC.createGain();
      g.gain.setValueAtTime(vel * amp * 0.22, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + 2.4);
    }
  },

  pluck(note, vel = 0.5) {
    if (!AC) return;
    const f = noteFreq(note) * (1 + rand(-0.004, 0.004)), t = AC.currentTime;
    const out = this.out(0.9, 0.35);
    const o = AC.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    const g = AC.createGain();
    g.gain.setValueAtTime(vel * 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = f * 4;
    o.connect(lp); lp.connect(g); g.connect(out);
    o.start(t); o.stop(t + 1);
  },

  knock(vel = 0.7) {
    if (!AC) return;
    const t = AC.currentTime, out = this.out(1, 0.3);
    const o = AC.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(190 * (1 + rand(-0.08, 0.08)), t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.07);
    const g = AC.createGain();
    g.gain.setValueAtTime(vel * 0.7, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.14);
    blip(out, 900, vel * 0.25, 0.025, 'noise');
  },

  thunder(intensity = 0.7) {
    if (!AC) return;
    const t = AC.currentTime, out = this.out(1, 0.5);
    const dur = rand(1.6, 2.8);
    const src = noiseBurst(dur);
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(rand(300, 520), t);
    lp.frequency.exponentialRampToValueAtTime(60, t + dur);
    const g = AC.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(intensity * 0.8, t + rand(0.02, 0.12));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(lp); lp.connect(g); g.connect(out); src.start(t);
    const o = AC.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(55, t); o.frequency.exponentialRampToValueAtTime(28, t + dur * 0.8);
    const g2 = AC.createGain();
    g2.gain.setValueAtTime(intensity * 0.5, t);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.8);
    o.connect(g2); g2.connect(out); o.start(t); o.stop(t + dur);
  },

  step(vel = 0.18) {
    if (!AC) return;
    const out = this.out(0.8, 0.12);
    blip(out, rand(1400, 2400), vel, 0.05, 'noise');
    blip(out, rand(120, 160), vel * 0.7, 0.045, 'sine');
  },

  swish(vel = 0.2) {
    if (!AC) return;
    const t = AC.currentTime, out = this.out(0.9, 0.3);
    const src = noiseBurst(0.5);
    const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.7;
    bp.frequency.setValueAtTime(600, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + 0.3);
    const g = AC.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    src.connect(bp); bp.connect(g); g.connect(out); src.start(t);
  },

  shimmer(vel = 0.3, base = 1200) {
    /* a sprinkle of tiny rising sine grains — grace/light appearing */
    if (!AC) return;
    const out = this.out(0.8, 0.6);
    const n = 6 + (Math.random() * 5 | 0);
    for (let i = 0; i < n; i++) {
      const t = AC.currentTime + i * rand(0.03, 0.07);
      const f = base * Math.pow(2, rand(0, 1.6));
      const o = AC.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = AC.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel * rand(0.04, 0.1), t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + rand(0.4, 1.1));
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 1.3);
    }
  },

  heartbeatStart(bpm = 52, level = 0.35) {
    if (!AC) return;
    this.heartbeat = {
      t: 0, bpm, level,
      update(dt) {
        this.t -= dt;
        if (this.t <= 0) {
          this.t = 60 / this.bpm;
          thump(this.level); setTimeout(() => thump(this.level * 0.6), 200);
        }
      },
    };
  },
  heartbeatStop() { this.heartbeat = null; },

  motif(opts = {}) {
    /* the "Jezu, ufam Tobie" theme — six tones, rising */
    if (!AC) return;
    const notes = opts.final
      ? [['D4', 0], ['F4', 0.75], ['E4', 1.5], ['G4', 2.25], ['F4', 3.0], ['A4', 3.75], ['D5', 5.0]]
      : [['D4', 0], ['F4', 0.75], ['E4', 1.5], ['G4', 2.25], ['F4', 3.0], ['A4', 3.75]];
    const inst = opts.bell ? (n, v) => this.bell(n, v, 0.8) : (n, v) => this.celesta(n, v);
    notes.forEach(([n, dt], i) => {
      setTimeout(() => inst(n, opts.vel || 0.4), dt * (opts.slow ? 1300 : 900));
    });
  },
};

/* ---------------- helpers ---------------- */

const NOTE_IDX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function noteFreq(n) {
  if (typeof n === 'number') return n;
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
  if (!m) return 440;
  let semi = NOTE_IDX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * Math.pow(2, (semi - 9) / 12 + (parseInt(m[3]) - 4));
}

let _noiseBuf = null;
function noiseBuffer() {
  if (_noiseBuf) return _noiseBuf;
  const sr = AC.sampleRate, len = sr * 2;
  _noiseBuf = AC.createBuffer(1, len, sr);
  const d = _noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return _noiseBuf;
}
function noiseBurst(dur) {
  /* caller must start(t); stop is scheduled on first start via the wrapper */
  const src = AC.createBufferSource();
  src.buffer = noiseBuffer(); src.loop = true;
  const dur_ = dur;
  const origStart = src.start.bind(src);
  src.start = t => { origStart(t); src.stop((t || AC.currentTime) + dur_ + 0.15); };
  return src;
}
function blip(out, freq, vel, dur, type = 'sine') {
  const t = AC.currentTime;
  let src, g = AC.createGain();
  if (type === 'noise') {
    src = noiseBurst(dur + 0.05);
    const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 1;
    src.connect(bp); bp.connect(g);
  } else {
    src = AC.createOscillator(); src.type = type; src.frequency.value = freq;
    src.connect(g);
  }
  g.gain.setValueAtTime(vel, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(out);
  src.start(t);
  if (type !== 'noise') src.stop(t + dur + 0.05);
}
function thump(level) {
  if (!AC) return;
  const t = AC.currentTime, out = Audio.out(0.9, 0.05);
  const o = AC.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(58, t);
  o.frequency.exponentialRampToValueAtTime(36, t + 0.12);
  const g = AC.createGain();
  g.gain.setValueAtTime(level, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.2);
}

/* continuous filtered-noise channel (wind / rain / breath / brush) */
function makeNoiseChannel(type, freq, q, maxGain) {
  const src = AC.createBufferSource();
  src.buffer = noiseBuffer(); src.loop = true;
  const f = AC.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = AC.createGain(); g.gain.value = 0;
  const out = Audio.out(1, 0.18);
  src.connect(f); f.connect(g); g.connect(out); src.start();
  return {
    filter: f, gain: g, max: maxGain,
    set(level, fq, time = 0.4) {
      g.gain.setTargetAtTime(clamp01(level) * maxGain, AC.currentTime, time);
      if (fq) f.frequency.setTargetAtTime(fq, AC.currentTime, time);
    },
  };
}

/* vinyl hiss + pops, for the gramophone */
class Vinyl {
  constructor() {
    const sr = AC.sampleRate, len = (sr * 3) | 0;
    const buf = AC.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * 0.012;                 // hiss
      if (Math.random() < 0.00015) {                          // pops
        const a = rand(0.25, 0.8);
        for (let j = 0; j < 90 && i + j < len; j++) d[i + j] += a * (1 - j / 90) * (Math.random() * 2 - 1);
      }
    }
    this.src = AC.createBufferSource(); this.src.buffer = buf; this.src.loop = true;
    this.gain = AC.createGain();
    this.gain.gain.value = 0;
    this.src.connect(this.gain); this.gain.connect(Audio.comp);
    this.src.start();
  }
  set(level) { this.gain.gain.setTargetAtTime(level, AC.currentTime, 0.5); }
}

/* slow hymn pad — chords crossfade; filter breathes */
class Pad {
  constructor() {
    this.voices = []; this.level = 0; this.targetLevel = 0;
    this.bus = AC.createGain(); this.bus.gain.value = 0;
    const wet = AC.createGain(); wet.gain.value = 0.45;
    this.bus.connect(Audio.comp); this.bus.connect(wet); wet.connect(Audio.reverb);
    this.lfoT = 0;
    this.progression = null; this.progT = 0; this.progI = 0; this.holdBeats = 11;
    this.bright = 900;
  }
  set(chords, opts = {}) {
    /* chords: array of note arrays. null to fade out. */
    this.progression = chords; this.progI = 0; this.progT = 0;
    this.targetLevel = opts.level !== undefined ? opts.level : 0.5;
    this.holdBeats = opts.hold || 11;
    this.bright = opts.bright || 900;
    if (chords) this._chord(chords[0]);
    else for (const v of this.voices) this._releaseVoice(v);
  }
  _chord(notes) {
    const t = AC.currentTime;
    for (const v of this.voices) this._releaseVoice(v);
    const voice = { oscs: [], gain: AC.createGain(), filter: AC.createBiquadFilter() };
    voice.filter.type = 'lowpass'; voice.filter.frequency.value = this.bright; voice.filter.Q.value = 0.4;
    voice.gain.gain.setValueAtTime(0, t);
    voice.gain.gain.linearRampToValueAtTime(0.16, t + 3.2);
    voice.filter.connect(voice.gain); voice.gain.connect(this.bus);
    notes.forEach((n, i) => {
      const f = noteFreq(n);
      for (const det of [-5, 6]) {
        const o = AC.createOscillator(); o.type = 'triangle';
        o.frequency.value = f; o.detune.value = det + rand(-2, 2);
        const g = AC.createGain(); g.gain.value = 1 / (notes.length * 1.6);
        o.connect(g); g.connect(voice.filter); o.start(t);
        voice.oscs.push(o);
      }
      if (i === 0) {       // sub root
        const o = AC.createOscillator(); o.type = 'sine'; o.frequency.value = f / 2;
        const g = AC.createGain(); g.gain.value = 0.22;
        o.connect(g); g.connect(voice.filter); o.start(t);
        voice.oscs.push(o);
      }
    });
    this.voices.push(voice);
  }
  _releaseVoice(v) {
    if (v.dead) return; v.dead = true;
    const t = AC.currentTime;
    v.gain.gain.cancelScheduledValues(t);
    v.gain.gain.setValueAtTime(v.gain.gain.value, t);
    v.gain.gain.linearRampToValueAtTime(0, t + 3.5);
    for (const o of v.oscs) o.stop(t + 3.7);
    setTimeout(() => { const i = this.voices.indexOf(v); if (i >= 0) this.voices.splice(i, 1); }, 4000);
  }
  update(dt) {
    this.level = damp(this.level, this.targetLevel, 1.2, dt);
    this.bus.gain.value = this.level;
    this.lfoT += dt;
    const f = this.bright * (1 + 0.25 * Math.sin(this.lfoT * 0.45));
    for (const v of this.voices) if (!v.dead) v.filter.frequency.value = f;
    if (this.progression && this.progression.length > 1) {
      this.progT += dt;
      if (this.progT > this.holdBeats) {
        this.progT = 0;
        this.progI = (this.progI + 1) % this.progression.length;
        this._chord(this.progression[this.progI]);
      }
    }
  }
}

/* distant choir — saws through vowel formants, very low in the mix */
class Choir {
  constructor() {
    this.gain = AC.createGain(); this.gain.gain.value = 0;
    const wet = AC.createGain(); wet.gain.value = 0.7;
    this.gain.connect(Audio.comp); this.gain.connect(wet); wet.connect(Audio.reverb);
    this.built = false;
    this.oscs = [];
    this._stopT = null;
  }
  set(level, notes = ['D3', 'A3', 'D4', 'F4']) {
    if (level > 0) {
      clearTimeout(this._stopT);
      if (!this.built) {
        this.built = true;
        for (const n of notes) {
          const f = noteFreq(n);
          const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
          const vib = AC.createOscillator(); vib.frequency.value = rand(4.2, 5.2);
          const vibG = AC.createGain(); vibG.gain.value = f * 0.006;
          vib.connect(vibG); vibG.connect(o.frequency); vib.start();
          const f1 = AC.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 620; f1.Q.value = 1.4;
          const f2 = AC.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1080; f2.Q.value = 1.8;
          const g = AC.createGain(); g.gain.value = 0.05;
          o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(this.gain);
          o.start();
          this.oscs.push(o, vib);
        }
      }
    } else if (this.built) {
      /* fade out, then free the voices */
      clearTimeout(this._stopT);
      this._stopT = setTimeout(() => {
        for (const o of this.oscs) { try { o.stop(); } catch (e) {} }
        this.oscs = []; this.built = false;
      }, 6000);
    }
    this.gain.gain.setTargetAtTime(level * 0.5, AC.currentTime, 2.2);
  }
}

/* the gramophone waltz — Łódź, 1924 */
class Waltz {
  constructor() {
    this.playing = false; this.bpm = 92; this.beat = 0; this.nextT = 0;
    this.warp = 0;            // 0 = bright party, 1 = warped/distant (the vision)
    this.level = 0;
    /* gramophone bus: bandpass + soft clip */
    this.bp = AC.createBiquadFilter(); this.bp.type = 'bandpass'; this.bp.frequency.value = 1000; this.bp.Q.value = 0.55;
    this.shaper = AC.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 1.8); }
    this.shaper.curve = curve;
    this.gain = AC.createGain(); this.gain.gain.value = 0;
    const wet = AC.createGain(); wet.gain.value = 0.3;
    this.bp.connect(this.shaper); this.shaper.connect(this.gain);
    this.gain.connect(Audio.comp); this.gain.connect(wet); wet.connect(Audio.reverb);

    /* 16 bars: [bar, beatInBar, dur(beats), note] — D minor waltz */
    this.melody = [
      [0, 0, 2, 'D5'], [0, 2, 1, 'F5'], [1, 0, 3, 'A5'],
      [2, 0, 2, 'Bb5'], [2, 2, 1, 'A5'], [3, 0, 3, 'G5'],
      [4, 0, 2, 'C#5'], [4, 2, 1, 'E5'], [5, 0, 2, 'G5'], [5, 2, 1, 'F5'],
      [6, 0, 2, 'F5'], [6, 2, 1, 'E5'], [7, 0, 1.5, 'E5'], [7, 1.5, 1.5, 'C#5'],
      [8, 0, 2, 'D5'], [8, 2, 1, 'F5'], [9, 0, 2, 'A5'], [9, 2, 1, 'C6'],
      [10, 0, 3, 'Bb5'], [11, 0, 2, 'G5'], [11, 2, 1, 'A5'],
      [12, 0, 2, 'F5'], [12, 2, 1, 'D5'], [13, 0, 2, 'E5'], [13, 2, 1, 'C#5'],
      [14, 0, 3, 'D5'], [15, 0, 3, 'A4'],
    ];
    this.harmony = ['Dm', 'Dm', 'Gm', 'Gm', 'A', 'A', 'Dm', 'A', 'Dm', 'F', 'Gm', 'Gm', 'Dm', 'A', 'Dm', 'A'];
    this.chordNotes = { Dm: ['D4', 'F4', 'A4'], Gm: ['G3', 'Bb3', 'D4'], A: ['A3', 'C#4', 'E4'], F: ['F3', 'A3', 'C4'] };
    this.bassNotes = { Dm: 'D2', Gm: 'G2', A: 'A2', F: 'F2' };
  }
  start(level = 0.5) {
    this.playing = true; this.level = level; this.beat = 0;
    this.nextT = AC.currentTime + 0.1;
    this.gain.gain.setTargetAtTime(level, AC.currentTime, 1.5);
    Audio.vinyl.set(0.5);
  }
  stop(fade = 2) {
    this.playing = false;
    this.gain.gain.setTargetAtTime(0, AC.currentTime, fade / 3);
    Audio.vinyl.set(0);
  }
  setWarp(w) { this.warp = clamp01(w); }
  setLevel(l, time = 1) { this.level = l; if (this.playing) this.gain.gain.setTargetAtTime(l, AC.currentTime, time / 3); }
  update() {
    if (!this.playing) return;
    const spb = 60 / (this.bpm * (1 - this.warp * 0.24));      // warp slows the record
    if (this.nextT < AC.currentTime) this.nextT = AC.currentTime;  // never schedule into the past
    while (this.nextT < AC.currentTime + 0.18) {
      this._scheduleBeat(this.beat, this.nextT, spb);
      this.beat++; this.nextT += spb;
    }
    this.bp.frequency.value = 1000 - this.warp * 520;
  }
  _scheduleBeat(beat, t, spb) {
    const bar = ((beat / 3) | 0) % 16, inBar = beat % 3;
    const ch = this.harmony[bar];
    const detune = 1 - this.warp * rand(0.01, 0.05);            // warped pitch droop
    if (inBar === 0) this._tone(noteFreq(this.bassNotes[ch]) * detune, t, spb * 0.92, 'triangle', 0.5);
    else for (const n of this.chordNotes[ch]) this._tone(noteFreq(n) * detune, t, spb * 0.34, 'square', 0.085);
    for (const [b, bb, dur, note] of this.melody) {
      if (b === bar && bb === inBar) this._tone(noteFreq(note) * detune, t, spb * dur * 0.95, 'square', 0.16, true);
    }
  }
  _tone(f, t, dur, type, vel, vib = false) {
    const o = AC.createOscillator(); o.type = type; o.frequency.value = f;
    if (vib) {
      const v = AC.createOscillator(); v.frequency.value = 5.4;
      const vg = AC.createGain(); vg.gain.value = f * 0.004;
      v.connect(vg); vg.connect(o.frequency); v.start(t); v.stop(t + dur + 0.1);
    }
    const g = AC.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.015);
    g.gain.setTargetAtTime(0, t + dur * 0.7, dur * 0.12);
    o.connect(g); g.connect(this.bp);
    o.start(t); o.stop(t + dur + 0.3);
  }
}
