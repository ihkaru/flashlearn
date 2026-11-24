const SOUND_PREF_KEY = 'fl_sound_enabled_v1';

export type MilestoneTier = 'streak' | 'milestone' | 'redemption';

export interface LearningMilestone {
  id: number;
  tier: MilestoneTier;
  title: string;
  subtitle: string;
}

// C5 Major Pentatonic + C6 (all safely < 2 kHz to prevent auditory fatigue)
const PENTATONIC_HZ = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  gainPeak: number,
  type: OscillatorType = 'sine',
  endFreq?: number
) {
  const now = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);
  }
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(gainPeak, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function triggerHaptic(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore on unsupported browsers
    }
  }
}

function loadSoundPreference(): boolean {
  if (typeof localStorage === 'undefined') return false; // Muted by default (2026 a11y standard)
  return localStorage.getItem(SOUND_PREF_KEY) === '1';
}

class LearningFeedbackEngine {
  soundEnabled = $state<boolean>(loadSoundPreference());
  activeToast = $state<LearningMilestone | null>(null);
  private toastSeq = 0;
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SOUND_PREF_KEY, this.soundEnabled ? '1' : '0');
    }
    if (this.soundEnabled) {
      const ctx = getAudioContext();
      if (ctx) playTone(ctx, 659.25, 0, 0.16, 0.12, 'triangle');
    }
    return this.soundEnabled;
  }

  showMilestone(tier: MilestoneTier, title: string, subtitle: string, durationMs = 2000) {
    if (this.clearTimer) clearTimeout(this.clearTimer);
    this.toastSeq += 1;
    this.activeToast = { id: this.toastSeq, tier, title, subtitle };
    this.clearTimer = setTimeout(() => {
      this.activeToast = null;
    }, durationMs);
  }

  onCorrect(streak: number, calibrated = false) {
    if (this.soundEnabled) {
      const ctx = getAudioContext();
      if (ctx) {
        const idx = Math.min(Math.max(0, streak - 1), PENTATONIC_HZ.length - 1);
        const freq = PENTATONIC_HZ[idx];
        if (streak >= 10 && streak % 5 === 0) {
          // Ascending Major-7th arpeggio for major streaks (10x, 15x, ...)
          [523.25, 659.25, 783.99, 987.77].forEach((f, i) =>
            playTone(ctx, f, i * 0.055, 0.22, 0.12, 'triangle')
          );
        } else if (streak >= 5) {
          // Warm two-note major third harmony
          playTone(ctx, freq, 0, 0.24, 0.14, 'triangle');
          playTone(ctx, freq * 1.25, 0.025, 0.22, 0.09, 'sine');
        } else {
          playTone(ctx, freq, 0, 0.19, 0.13, streak >= 3 ? 'triangle' : 'sine');
        }
      }
    }

    if (streak === 3) {
      this.showMilestone('streak', '3x Tepat Beruntun', 'Ritme pemahaman terjaga');
    } else if (streak === 5) {
      triggerHaptic(18);
      this.showMilestone(
        'milestone',
        calibrated ? '5x Kalibrasi Tajam!' : '5x Beruntun!',
        calibrated ? 'Yakin dan benar 5 kali berturut-turut' : 'Momentum fokus sangat kuat',
        2300
      );
    } else if (streak >= 10 && streak % 5 === 0) {
      triggerHaptic([15, 30, 22]);
      this.showMilestone(
        'milestone',
        `${streak}x Tak Terhentikan!`,
        'Penguasaan konsep sangat konsisten',
        2500
      );
    }
  }

  onRedemption() {
    if (this.soundEnabled) {
      const ctx = getAudioContext();
      if (ctx) {
        playTone(ctx, 392.0, 0, 0.14, 0.11, 'sine');
        playTone(ctx, 587.33, 0.07, 0.22, 0.13, 'triangle');
      }
    }
    triggerHaptic(14);
    this.showMilestone('redemption', 'Konsep Terkunci!', 'Berhasil menaklukkan kartu yang sebelumnya diulang', 2000);
  }

  onMiss() {
    if (this.soundEnabled) {
      const ctx = getAudioContext();
      if (ctx) {
        playTone(ctx, 195, 0, 0.14, 0.08, 'sine', 140);
      }
    }
  }

  onCelebration(title: string, subtitle: string) {
    if (this.soundEnabled) {
      const ctx = getAudioContext();
      if (ctx) {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
          playTone(ctx, f, i * 0.06, 0.26, 0.13, 'triangle')
        );
      }
    }
    triggerHaptic([15, 28, 22]);
    this.showMilestone('milestone', title, subtitle, 2600);
  }
}

export const learningFeedback = new LearningFeedbackEngine();
