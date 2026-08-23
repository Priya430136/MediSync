// Dedicated Text-To-Speech (TTS) & Audio Dispatcher for MediSync Driver App

export interface DriverTTSConfig {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
  rate: number; // 0.5 to 2.0
  pitch: number; // 0.5 to 1.5
  voiceURI: string | null;
  chimeEnabled: boolean;
}

const STORAGE_KEY = 'medisync_driver_tts_config';

const DEFAULT_CONFIG: DriverTTSConfig = {
  enabled: true,
  volume: 1.0,
  rate: 1.05,
  pitch: 1.0,
  voiceURI: null,
  chimeEnabled: true,
};

let currentAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!currentAudioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        currentAudioCtx = new AudioContextClass();
      }
    }
    if (currentAudioCtx && currentAudioCtx.state === 'suspended') {
      currentAudioCtx.resume().catch(() => {});
    }
    return currentAudioCtx;
  } catch (e) {
    console.warn('[DriverTTS] Web Audio Context initialization error:', e);
    return null;
  }
}

// Play a distinct 2-tone paramedic/radio dispatch chime
export function playDispatchChime(toneType: 'alert' | 'confirm' | 'complete' = 'alert'): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return resolve();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (toneType === 'alert') {
        // High-low emergency dispatcher tone (880Hz -> 1046Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (toneType === 'confirm') {
        // Upbeat confirmation tone (523Hz -> 659Hz)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.26);
      } else {
        // Trip completion cadence (587Hz -> 880Hz -> 1174Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.09);
        osc.frequency.setValueAtTime(1174.66, now + 0.18);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.36);
      }

      setTimeout(resolve, 200);
    } catch {
      resolve();
    }
  });
}

class DriverTTSManager {
  private config: DriverTTSConfig = DEFAULT_CONFIG;
  private listeners: Array<() => void> = [];
  private speechQueue: Array<{ text: string; options?: any }> = [];
  private isSpeaking = false;
  private currentUtteranceText = '';
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.loadConfig();
    this.initVoices();
  }

  private loadConfig() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch {
      this.config = DEFAULT_CONFIG;
    }
  }

  public saveConfig(newConfig: Partial<DriverTTSConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      } catch (err) {
        console.debug('[DriverTTS] Could not persist config to localStorage:', err);
      }
    }
    this.notify();
  }

  public getConfig(): DriverTTSConfig {
    return { ...this.config };
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getStatus() {
    return {
      isSpeaking: this.isSpeaking,
      currentText: this.currentUtteranceText,
      voices: this.availableVoices,
      config: this.config,
    };
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      this.availableVoices = window.speechSynthesis.getVoices().filter((v) =>
        v.lang.startsWith('en') || v.lang.startsWith('hi') || v.lang.includes('IN')
      );
      if (this.availableVoices.length === 0) {
        this.availableVoices = window.speechSynthesis.getVoices();
      }
      this.notify();
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }

  public unlockAudio() {
    getAudioContext();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Empty short utterance to unlock mobile speech synth
      try {
        const u = new SpeechSynthesisUtterance('');
        u.volume = 0;
        window.speechSynthesis.speak(u);
      } catch (err) {
        console.debug('[DriverTTS] Audio unlock utterance note:', err);
      }
    }
  }

  public async speak(
    text: string,
    options?: {
      priority?: 'high' | 'normal';
      toneType?: 'alert' | 'confirm' | 'complete';
      force?: boolean;
    }
  ): Promise<void> {
    if (!text) return;
    if (!this.config.enabled && !options?.force) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.log('[DriverTTS fallback log]:', text);
      return;
    }

    if (options?.priority === 'high') {
      // Cancel previous speech for high priority alerts
      window.speechSynthesis.cancel();
      this.speechQueue = [];
    }

    if (this.config.chimeEnabled) {
      await playDispatchChime(options?.toneType || 'alert');
    }

    return new Promise((resolve) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = this.config.volume;
        utterance.rate = this.config.rate;
        utterance.pitch = this.config.pitch;

        // Select chosen voice or natural English voice
        if (this.config.voiceURI) {
          const matched = this.availableVoices.find((v) => v.voiceURI === this.config.voiceURI);
          if (matched) utterance.voice = matched;
        } else {
          const preferred = this.availableVoices.find(
            (v) => (v.lang === 'en-IN' || v.lang === 'en-US' || v.lang.startsWith('en')) && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Guy'))
          ) || this.availableVoices[0];
          if (preferred) utterance.voice = preferred;
        }

        utterance.onstart = () => {
          this.isSpeaking = true;
          this.currentUtteranceText = text;
          this.notify();
        };

        utterance.onend = () => {
          this.isSpeaking = false;
          this.currentUtteranceText = '';
          this.notify();
          resolve();
        };

        utterance.onerror = (e) => {
          console.warn('[DriverTTS] Speech error or canceled:', e);
          this.isSpeaking = false;
          this.currentUtteranceText = '';
          this.notify();
          resolve();
        };

        // Workaround for Chrome speech synthesis bug pausing long utterances
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('[DriverTTS] Speech Synthesis execution error:', err);
        this.isSpeaking = false;
        this.currentUtteranceText = '';
        this.notify();
        resolve();
      }
    });
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtteranceText = '';
    this.notify();
  }
}

export const driverTTS = new DriverTTSManager();
