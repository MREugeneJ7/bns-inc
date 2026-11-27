import { getMaster } from "./audio";
import type { Segment } from "./morse";
import type { SoundProfile } from "./rave";

export type RaveSettings = {
  profile: SoundProfile;
  bpm: number;
  toneHz: number;
  soundOn: boolean;
  beatOn: boolean;
  badTrip: boolean;
};

const FLOOR = 0.0001;
const NOTES = [0, 3, 7, 10, 7, 3, 12, 10];
/** Minor seconds, tritones, and minor sixths for an eerie, haunted tonality. */
const TETRIC_NOTES = [0, 1, 4, 6, 7, 8, 11, 6];

type Mods = {
  filter: GainNode;
  vibrato: GainNode;
  drift: GainNode;
  warble: GainNode;
  pan: GainNode | null;
};

/** A short lookahead keeps the music on the audio clock, not the UI frame rate. */
export class RaveAudio {
  readonly analyser: AnalyserNode;
  private output: GainNode;
  private tripFilter: BiquadFilterNode;
  private drums: GainNode;
  private lead: GainNode;
  private panner: StereoPannerNode | null = null;
  private delay: DelayNode;
  private feedback: GainNode;
  private wet: GainNode;
  /** Sums the pitch LFOs; every synth voice listens to it on its detune. */
  private detuneBus: GainNode;
  private droneGain: GainNode;
  private droneFilter: BiquadFilterNode;
  private droneOscs: OscillatorNode[] = [];
  private mods: Mods;
  private lfos: OscillatorNode[] = [];
  private noise: AudioBuffer;
  private sources = new Set<AudioScheduledSourceNode>();
  private timer: number | null = null;
  private pulses: Segment[];
  private pulse = 0;
  private step = 0;
  private disposed = false;
  private offset = 0;
  private startAt = 0;
  private trip = 0;

  constructor(
    private ac: AudioContext,
    private settings: RaveSettings,
    segments: Segment[],
    private total: number,
  ) {
    this.pulses = segments.filter((s) => s.on);

    this.output = ac.createGain();
    this.output.gain.value = settings.soundOn ? 0.8 : 0;
    this.tripFilter = ac.createBiquadFilter();
    this.tripFilter.type = "lowpass";
    this.tripFilter.frequency.value = settings.badTrip ? 3600 : 20000;
    this.tripFilter.Q.value = settings.badTrip ? 2.4 : 0.7;
    this.analyser = ac.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.78;
    this.output.connect(this.tripFilter);
    this.tripFilter.connect(this.analyser);
    this.analyser.connect(getMaster());

    this.drums = ac.createGain();
    this.drums.gain.value = settings.beatOn ? 0.7 : 0;
    this.drums.connect(this.output);

    this.lead = ac.createGain();
    this.lead.gain.value = 0.5;
    if (typeof ac.createStereoPanner === "function") {
      this.panner = ac.createStereoPanner();
      this.lead.connect(this.panner);
      this.panner.connect(this.output);
    } else {
      this.lead.connect(this.output);
    }

    this.delay = ac.createDelay(1);
    this.feedback = ac.createGain();
    this.feedback.gain.value = settings.badTrip ? 0.52 : 0.22;
    this.wet = ac.createGain();
    this.wet.gain.value = this.wetBase();
    this.delay.delayTime.value = (60 / settings.bpm) * 0.75;
    this.lead.connect(this.delay);
    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay);
    this.delay.connect(this.wet);
    this.wet.connect(this.output);

    this.detuneBus = ac.createGain();
    this.detuneBus.gain.value = 1;

    // Sub-harmonic horror drone for bad trips
    this.droneFilter = ac.createBiquadFilter();
    this.droneFilter.type = "lowpass";
    this.droneFilter.frequency.value = 155;
    this.droneFilter.Q.value = 3.2;
    this.droneGain = ac.createGain();
    this.droneGain.gain.value = settings.badTrip ? 0.16 : 0;
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.output);

    const droneBase = Math.max(36, settings.toneHz / 8);
    [
      { type: "sawtooth" as OscillatorType, freq: droneBase, detune: -9 },
      { type: "triangle" as OscillatorType, freq: droneBase * 2 ** (6 / 12), detune: 11 },
    ].forEach(({ type, freq, detune }) => {
      const osc = ac.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(this.droneFilter);
      osc.start();
      this.droneOscs.push(osc);
    });

    this.mods = {
      filter: this.lfo(0.23, this.tripFilter.frequency),
      vibrato: this.lfo(5.3, this.detuneBus),
      drift: this.lfo(0.07, this.detuneBus),
      warble: this.lfo(0.37, this.delay.delayTime),
      pan: this.panner ? this.lfo(0.19, this.panner.pan) : null,
    };

    this.noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  private lfo(frequency: number, target: AudioParam | AudioNode) {
    const osc = this.ac.createOscillator();
    osc.type = "sine";
    osc.frequency.value = frequency;
    const depth = this.ac.createGain();
    depth.gain.value = 0;
    osc.connect(depth);
    if (target instanceof AudioParam) depth.connect(target);
    else depth.connect(target);
    osc.start();
    this.lfos.push(osc);
    return depth;
  }

  private wetBase() {
    if (this.settings.badTrip) return 0.36;
    return this.settings.profile === "trance" ? 0.24 : 0.08;
  }

  update(settings: RaveSettings) {
    this.settings = settings;
    const now = this.ac.currentTime;
    this.output.gain.setTargetAtTime(settings.soundOn ? 0.8 : 0, now, 0.01);
    this.drums.gain.setTargetAtTime(settings.beatOn ? 0.7 : 0, now, 0.01);
    this.droneGain.gain.setTargetAtTime(settings.badTrip ? 0.16 : 0, now, 0.08);
    const droneBase = Math.max(36, settings.toneHz / 8);
    if (this.droneOscs[0]) {
      this.droneOscs[0].frequency.setTargetAtTime(droneBase, now, 0.05);
    }
    if (this.droneOscs[1]) {
      this.droneOscs[1].frequency.setTargetAtTime(
        droneBase * 2 ** (6 / 12),
        now,
        0.05,
      );
    }
    this.setTrip(this.trip, false);
  }

  /** 0 = sober, 1 = full Dalí (or deeper horror when badTrip is active). */
  setTrip(trip: number, immediate = false) {
    if (this.disposed) return;
    this.trip = trip;
    const bad = this.settings.badTrip;
    const effective = bad ? Math.max(trip, 0.58) : trip;
    const now = this.ac.currentTime;
    const k = immediate ? 0.005 : 0.35;
    const eased = effective * effective;
    this.tripFilter.frequency.setTargetAtTime(
      bad ? 4200 - effective * 2600 : 20000 - effective * 15000,
      now,
      k,
    );
    this.tripFilter.Q.setTargetAtTime(
      (bad ? 2.4 : 0.7) + effective * 4.5,
      now,
      k,
    );
    this.mods.filter.gain.setTargetAtTime(
      eased * (bad ? 1600 : 3800),
      now,
      k,
    );
    this.mods.vibrato.gain.setTargetAtTime(
      eased * (bad ? 42 : 30),
      now,
      k,
    );
    this.mods.drift.gain.setTargetAtTime(
      effective * (bad ? 95 : 70),
      now,
      k,
    );
    this.mods.warble.gain.setTargetAtTime(
      effective * (bad ? 0.009 : 0.005),
      now,
      k,
    );
    this.mods.pan?.gain.setTargetAtTime(effective * 0.85, now, k);
    this.feedback.gain.setTargetAtTime(
      (bad ? 0.46 : 0.22) + effective * 0.28,
      now,
      k,
    );
    this.wet.gain.setTargetAtTime(this.wetBase() + effective * 0.24, now, k);
  }

  start(offset: number, at: number) {
    this.offset = offset;
    this.startAt = at;
    this.pulse = this.pulses.findIndex((s) => s.start + s.dur > offset);
    if (this.pulse < 0) this.pulse = this.pulses.length;
    this.step = Math.ceil(offset / (60000 / this.settings.bpm / 4));
    this.schedule();
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  private track(
    source: AudioScheduledSourceNode,
    end: number,
    nodes: AudioNode[] = [],
    detune?: AudioParam,
  ) {
    this.sources.add(source);
    source.onended = () => {
      this.sources.delete(source);
      source.disconnect();
      nodes.forEach((node) => node.disconnect());
      if (detune) {
        try {
          this.detuneBus.disconnect(detune);
        } catch {
          /* Already disconnected. */
        }
      }
    };
    source.stop(end);
  }

  private voice(type: OscillatorType, frequency: number, at: number) {
    const osc = this.ac.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, at);
    this.detuneBus.connect(osc.detune);
    return osc;
  }

  private schedule() {
    if (this.disposed) return;
    const ahead = this.ac.currentTime + 0.16;
    const timeOf = (ms: number) => this.startAt + (ms - this.offset) / 1000;

    while (this.pulse < this.pulses.length) {
      const segment = this.pulses[this.pulse];
      const at = timeOf(Math.max(segment.start, this.offset));
      if (at > ahead) break;
      const end = timeOf(segment.start + segment.dur);
      if (end > this.ac.currentTime + 0.006) {
        const start = Math.max(at, this.ac.currentTime + 0.002);
        if (end > start + 0.006)
          this.synth(start, end - start, this.pulse, segment.kind === "dah");
      }
      this.pulse++;
    }

    const stepMs = 60000 / this.settings.bpm / 4;
    while (this.step * stepMs < this.total) {
      const at = timeOf(this.step * stepMs);
      if (at > ahead) break;
      if (at >= this.ac.currentTime - 0.01) {
        const t = Math.max(at, this.ac.currentTime + 0.002);
        if (this.step % 4 === 0) this.kick(t);
        if (this.step % 2 === 0) this.hat(t, this.step % 4 === 2);
        if (this.step % 16 === 4 || this.step % 16 === 12) this.clap(t);
        const acid = this.settings.profile === "acid";
        if (acid ? this.step % 2 === 1 : this.step % 4 === 2)
          this.bass(t, this.step);
        if (this.settings.badTrip) {
          if (this.step % 4 === 3 && Math.random() < 0.45)
            this.horrorChime(t, this.step);
        } else if (
          this.trip > 0.5 &&
          this.step % 2 === 1 &&
          Math.random() < (this.trip - 0.5) * 1.2
        ) {
          this.sparkle(t, this.step);
        }
      }
      this.step++;
    }
  }

  private synth(at: number, length: number, index: number, long: boolean) {
    const { profile, toneHz, badTrip } = this.settings;
    const filter = this.ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = badTrip
      ? 6.5
      : profile === "acid"
        ? 11
        : profile === "warehouse"
          ? 1.8
          : 0.6;
    if (badTrip) {
      filter.frequency.setValueAtTime(340, at);
      filter.frequency.exponentialRampToValueAtTime(
        1850,
        at + Math.min(0.04, length / 2.5),
      );
      filter.frequency.exponentialRampToValueAtTime(220, at + length);
    } else {
      filter.frequency.setValueAtTime(profile === "acid" ? 850 : 3500, at);
      filter.frequency.exponentialRampToValueAtTime(
        6500,
        at + Math.min(0.025, length / 3),
      );
      filter.frequency.exponentialRampToValueAtTime(
        profile === "acid" ? 500 : 1800,
        at + length,
      );
    }

    const envelope = this.ac.createGain();
    envelope.gain.setValueAtTime(FLOOR, at);
    envelope.gain.linearRampToValueAtTime(
      badTrip ? 0.26 : profile === "acid" ? 0.18 : 0.32,
      at + Math.min(0.008, length / 4),
    );
    envelope.gain.setValueAtTime(
      badTrip ? 0.22 : profile === "acid" ? 0.16 : 0.25,
      at + length * 0.8,
    );
    envelope.gain.linearRampToValueAtTime(0, at + length);
    filter.connect(envelope);
    envelope.connect(this.lead);

    const scale = badTrip ? TETRIC_NOTES : NOTES;
    const semitone =
      scale[index % scale.length] -
      (badTrip ? 6 : 0) -
      (long && (profile === "warehouse" || badTrip) ? 12 : 0);
    const freq = toneHz * 2 ** (semitone / 12);

    if (badTrip) {
      // Dissonant minor-second organ/theremin pair with downward pitch sag
      const voices: { type: OscillatorType; ratio: number; detune: number }[] = [
        { type: "sawtooth", ratio: 1, detune: -14 },
        { type: "triangle", ratio: 2 ** (1 / 12), detune: 17 },
      ];
      voices.forEach((v, i) => {
        const osc = this.voice(v.type, freq * v.ratio, at);
        osc.detune.value = v.detune;
        if (long) {
          osc.frequency.exponentialRampToValueAtTime(
            Math.max(40, freq * v.ratio * 0.92),
            at + length,
          );
        }
        osc.connect(filter);
        osc.start(at);
        this.track(
          osc,
          at + length + 0.01,
          i === voices.length - 1 ? [filter, envelope] : [],
          osc.detune,
        );
      });
      return;
    }

    const detunes = profile === "trance" ? [-12, 0, 12] : [0];
    detunes.forEach((detune, i) => {
      const osc = this.voice(
        profile === "warehouse" ? "square" : "sawtooth",
        freq,
        at,
      );
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(at);
      this.track(
        osc,
        at + length + 0.01,
        i === detunes.length - 1 ? [filter, envelope] : [],
        osc.detune,
      );
    });
  }

  /** Eerie detuned music-box chime that droops downward in pitch. */
  private horrorChime(at: number, step: number) {
    const note = TETRIC_NOTES[(step * 3) % TETRIC_NOTES.length];
    const freq = this.settings.toneHz * 1.5 * 2 ** (note / 12);
    const osc = this.voice("sine", freq, at);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.89, at + 0.42);
    const gain = this.ac.createGain();
    gain.gain.setValueAtTime(FLOOR, at);
    gain.gain.linearRampToValueAtTime(0.085, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(FLOOR, at + 0.44);
    osc.connect(gain);
    gain.connect(this.lead);
    osc.start(at);
    this.track(osc, at + 0.46, [gain], osc.detune);
  }

  /** Little glassy notes that start appearing once things get weird. */
  private sparkle(at: number, step: number) {
    const freq =
      this.settings.toneHz * 2 * 2 ** (NOTES[(step * 3) % NOTES.length] / 12);
    const osc = this.voice("sine", freq, at);
    const gain = this.ac.createGain();
    gain.gain.setValueAtTime(FLOOR, at);
    gain.gain.linearRampToValueAtTime(0.07, at + 0.004);
    gain.gain.exponentialRampToValueAtTime(FLOOR, at + 0.28);
    osc.connect(gain);
    gain.connect(this.lead);
    osc.start(at);
    this.track(osc, at + 0.3, [gain], osc.detune);
  }

  private kick(at: number) {
    const bad = this.settings.badTrip;
    const osc = this.ac.createOscillator();
    const gain = this.ac.createGain();
    osc.frequency.setValueAtTime(
      bad ? 118 : this.settings.profile === "warehouse" ? 175 : 145,
      at,
    );
    osc.frequency.exponentialRampToValueAtTime(bad ? 31 : 46, at + (bad ? 0.16 : 0.11));
    gain.gain.setValueAtTime(bad ? 0.95 : 0.85, at);
    gain.gain.exponentialRampToValueAtTime(FLOOR, at + (bad ? 0.42 : 0.32));
    osc.connect(gain);
    gain.connect(this.drums);
    osc.start(at);
    this.track(osc, at + (bad ? 0.45 : 0.34), [gain]);
  }

  private noiseHit(
    at: number,
    length: number,
    frequency: number,
    volume: number,
    type: BiquadFilterType,
  ) {
    const source = this.ac.createBufferSource();
    source.buffer = this.noise;
    const filter = this.ac.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    const gain = this.ac.createGain();
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(FLOOR, at + length);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.drums);
    source.start(at);
    this.track(source, at + length + 0.01, [filter, gain]);
  }

  private hat(at: number, open: boolean) {
    const bad = this.settings.badTrip;
    this.noiseHit(
      at,
      open ? (bad ? 0.18 : 0.13) : 0.035,
      bad ? 3400 : 7800,
      open ? (bad ? 0.08 : 0.12) : bad ? 0.05 : 0.075,
      "highpass",
    );
  }

  private clap(at: number) {
    const bad = this.settings.badTrip;
    this.noiseHit(at, bad ? 0.18 : 0.12, bad ? 920 : 1600, 0.23, "bandpass");
    this.noiseHit(
      at + 0.022,
      bad ? 0.14 : 0.08,
      bad ? 1280 : 2200,
      0.16,
      "bandpass",
    );
  }

  private bass(at: number, step: number) {
    const { profile, toneHz, bpm, badTrip } = this.settings;
    const length =
      (60 / bpm) * (badTrip ? 0.55 : profile === "acid" ? 0.25 : 0.45);
    const scale = badTrip ? TETRIC_NOTES : NOTES;
    const note = scale[Math.floor(step / 2) % scale.length];
    const osc = this.voice(
      badTrip ? "sawtooth" : profile === "warehouse" ? "triangle" : "sawtooth",
      (toneHz / (badTrip ? 12 : 8)) * 2 ** (note / 12),
      at,
    );
    const filter = this.ac.createBiquadFilter();
    const gain = this.ac.createGain();
    filter.type = "lowpass";
    filter.Q.value = badTrip ? 7.5 : profile === "acid" ? 13 : 1;
    filter.frequency.setValueAtTime(
      badTrip ? 460 : profile === "acid" ? 2500 : 700,
      at,
    );
    filter.frequency.exponentialRampToValueAtTime(badTrip ? 65 : 100, at + length);
    gain.gain.setValueAtTime(FLOOR, at);
    gain.gain.linearRampToValueAtTime(
      badTrip ? 0.36 : profile === "acid" ? 0.2 : 0.32,
      at + 0.005,
    );
    gain.gain.exponentialRampToValueAtTime(FLOOR, at + length);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.drums);
    osc.start(at);
    this.track(osc, at + length + 0.02, [filter, gain], osc.detune);
  }

  stop() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.timer !== null) window.clearInterval(this.timer);
    const now = this.ac.currentTime;
    this.output.gain.cancelScheduledValues(now);
    this.output.gain.setTargetAtTime(0, now, 0.005);
    this.sources.forEach((source) => {
      try {
        source.stop(now + 0.02);
      } catch {
        /* Already ended. */
      }
    });
    window.setTimeout(() => {
      this.lfos.forEach((lfo) => {
        try {
          lfo.stop();
        } catch {
          /* Already stopped. */
        }
        lfo.disconnect();
      });
      this.droneOscs.forEach((osc) => {
        try {
          osc.stop();
        } catch {
          /* Already stopped. */
        }
        osc.disconnect();
      });
      [
        this.output,
        this.tripFilter,
        this.drums,
        this.lead,
        this.delay,
        this.feedback,
        this.wet,
        this.detuneBus,
        this.droneGain,
        this.droneFilter,
        this.analyser,
        ...Object.values(this.mods).filter((node): node is GainNode => !!node),
        ...(this.panner ? [this.panner] : []),
      ].forEach((node) => node.disconnect());
      this.sources.clear();
    }, 50);
  }
}
