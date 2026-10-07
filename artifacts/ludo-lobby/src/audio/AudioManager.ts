export type SoundEffect =
  | 'button_click' | 'button_hover' | 'menu_open' | 'menu_close'
  | 'dice_pickup' | 'dice_shake' | 'dice_roll' | 'dice_land'
  | 'token_select' | 'token_step' | 'token_land' | 'token_enter_board' | 'token_enter_home'
  | 'capture' | 'safe_cell' | 'extra_turn' | 'invalid_move'
  | 'turn_start' | 'countdown'
  | 'victory' | 'defeat' | 'reward';

type AudioPrefs = { sfx: boolean; music: boolean; sfxVolume: number; musicVolume: number };

const defaultPrefs: AudioPrefs = { sfx: true, music: true, sfxVolume: 42, musicVolume: 18 };
// [frequency_hz, duration_s, waveform]
const tones: Record<SoundEffect, [number, number, OscillatorType]> = {
  // UI
  button_click:    [420, 0.045, 'sine'],
  button_hover:    [500, 0.025, 'sine'],
  menu_open:       [560, 0.09,  'sine'],
  menu_close:      [360, 0.08,  'sine'],
  // Dice
  dice_pickup:     [280, 0.06,  'triangle'],
  dice_shake:      [160, 0.10,  'triangle'],
  dice_roll:       [190, 0.13,  'triangle'],
  dice_land:       [640, 0.11,  'sine'],
  // Token movement
  token_select:    [510, 0.07,  'sine'],
  token_step:      [320, 0.035, 'triangle'],
  token_land:      [580, 0.08,  'sine'],
  token_enter_board: [680, 0.14, 'sine'],
  token_enter_home:  [760, 0.18, 'sine'],
  // Gameplay
  capture:         [250, 0.18,  'triangle'],
  safe_cell:       [740, 0.12,  'sine'],
  extra_turn:      [820, 0.16,  'sine'],
  invalid_move:    [200, 0.09,  'triangle'],
  turn_start:      [470, 0.10,  'sine'],
  countdown:       [380, 0.09,  'sine'],
  // Game outcome
  victory:         [880, 0.23,  'sine'],
  defeat:          [210, 0.20,  'triangle'],
  reward:          [760, 0.18,  'sine'],
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

  playSfx(name: SoundEffect, pitchMul = 1): void {
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
      const freq = frequency * pitchMul;
      oscillator.frequency.setValueAtTime(freq, this.context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(freq * 0.72, this.context.currentTime + duration);
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

  /** Multi-note victory fanfare: three ascending tones */
  playVictoryFanfare(): void {
    if (!this.prefs.sfx || this.prefs.sfxVolume <= 0 || typeof window === 'undefined') return;
    try {
      const Context = window.AudioContext;
      if (!Context) return;
      this.context ??= new Context();
      if (this.context.state === 'suspended') void this.context.resume();
      const vol = Math.max(0.0001, this.prefs.sfxVolume / 100 * 0.07);
      const notes = [660, 880, 1100];
      notes.forEach((freq, i) => {
        const osc = this.context!.createOscillator();
        const gain = this.context!.createGain();
        const t = this.context!.currentTime + i * 0.18;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        osc.connect(gain);
        gain.connect(this.context!.destination);
        osc.start(t);
        osc.stop(t + 0.22);
      });
    } catch { /* audio optional */ }
  }

  playMusic(_name: string): void {
    // Music assets are not bundled yet; do not create a silent or failing stream.
  }
}

export const audioManager = new AudioManager();

