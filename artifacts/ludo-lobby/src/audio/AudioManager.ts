export type SoundEffect =
  | 'button_click' | 'menu_open' | 'menu_close'
  | 'dice_roll' | 'dice_land' | 'token_select' | 'token_step'
  | 'token_enter_board' | 'capture' | 'safe_cell' | 'extra_turn'
  | 'turn_start' | 'victory' | 'defeat' | 'reward';

type AudioPrefs = { sfx: boolean; music: boolean; sfxVolume: number; musicVolume: number };

const defaultPrefs: AudioPrefs = { sfx: true, music: true, sfxVolume: 42, musicVolume: 18 };
const tones: Record<SoundEffect, [number, number, OscillatorType]> = {
  button_click: [420, 0.045, 'sine'],
  menu_open: [560, 0.09, 'sine'],
  menu_close: [360, 0.08, 'sine'],
  dice_roll: [190, 0.13, 'triangle'],
  dice_land: [640, 0.11, 'sine'],
  token_select: [510, 0.07, 'sine'],
  token_step: [320, 0.035, 'triangle'],
  token_enter_board: [680, 0.14, 'sine'],
  capture: [250, 0.18, 'triangle'],
  safe_cell: [740, 0.12, 'sine'],
  extra_turn: [820, 0.16, 'sine'],
  turn_start: [470, 0.1, 'sine'],
  victory: [880, 0.23, 'sine'],
  defeat: [210, 0.2, 'triangle'],
  reward: [760, 0.18, 'sine'],
};

class AudioManager {
  private context: AudioContext | null = null;
  private prefs: AudioPrefs = { ...defaultPrefs };

  constructor() {
    try {
      const saved = window.localStorage.getItem('ludo.audio');
      if (saved) this.prefs = { ...defaultPrefs, ...JSON.parse(saved) as Partial<AudioPrefs> };
    } catch {
      this.prefs = { ...defaultPrefs };
    }
  }

  private save(): void {
    try { window.localStorage.setItem('ludo.audio', JSON.stringify(this.prefs)); } catch { /* no-op */ }
  }

  getSettings(): AudioPrefs { return { ...this.prefs }; }

  setSfxVolume(value: number): void {
    this.prefs.sfxVolume = Math.max(0, Math.min(100, value));
    this.save();
  }

  setMusicVolume(value: number): void {
    this.prefs.musicVolume = Math.max(0, Math.min(100, value));
    this.save();
  }

  muteSfx(): void { this.prefs.sfx = false; this.save(); }
  muteMusic(): void { this.prefs.music = false; this.save(); }
  setSfxEnabled(value: boolean): void { this.prefs.sfx = value; this.save(); }
  setMusicEnabled(value: boolean): void { this.prefs.music = value; this.save(); }

  playSfx(name: SoundEffect): void {
    if (!this.prefs.sfx || this.prefs.sfxVolume <= 0 || typeof window === 'undefined') return;
    try {
      const Context = window.AudioContext;
      if (!Context) return;
      this.context ??= new Context();
      if (this.context.state === 'suspended') void this.context.resume();
      const [frequency, duration, waveform] = tones[name];
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.72, this.context.currentTime + duration);
      gain.gain.setValueAtTime(Math.max(0.0001, this.prefs.sfxVolume / 100 * 0.07), this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start();
      oscillator.stop(this.context.currentTime + duration);
    } catch {
      // Audio is optional; visuals and rules continue if the browser blocks it.
    }
  }

  playMusic(_name: string): void {
    // Music assets are not bundled yet; do not create a silent or failing stream.
  }
}

export const audioManager = new AudioManager();

