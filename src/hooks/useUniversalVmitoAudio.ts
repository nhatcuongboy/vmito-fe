'use client';

import { useCallback, useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IVmitoAudioOptions {
  /** Metadata title shown on lock-screen / Bluetooth device. Default: 'Thông báo' */
  title?: string;
  /** Metadata artist shown on lock-screen / Bluetooth device. Default: 'Vmito' */
  artist?: string;
  /** Metadata album (optional). Default: 'Badminton Score' */
  album?: string;
}

interface IUseUniversalVmitoAudioReturn {
  /**
   * Call once on the FIRST user interaction (tap / click) to unlock the audio
   * engine on iOS. Attach this to an `onClick` or `onTouchStart` handler.
   */
  unlock: () => Promise<void>;
  /** Play an audio file from a URL. Reuses a single <audio> element. */
  play: (src: string) => Promise<void>;
  /** Play a short attention tone (can repeat) through the media pipeline. */
  playAttention: (repeatCount?: number) => Promise<void>;
  /** Stop currently playing audio immediately. */
  stop: () => void;
  /** Whether the audio engine has been unlocked by a user gesture. */
  isUnlocked: boolean;
}

// ---------------------------------------------------------------------------
// Singleton audio element — survives across hook instances & re-renders.
// We intentionally keep ONE element to maximise Safari / iOS compatibility.
// ---------------------------------------------------------------------------

let singletonAudio: HTMLAudioElement | null = null;
let singletonCtx: AudioContext | null = null;
let isGloballyUnlocked = false;
let isKeepAlivePlaying = false;

const SILENT_WAV_DATA_URI =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';

let attentionToneDataUri: string | null = null;

const createAttentionToneDataUri = (): string => {
  if (attentionToneDataUri) {
    return attentionToneDataUri;
  }

  const sampleRate = 16000;
  const durationSeconds = 0.32;
  const frequency = 880;
  const sampleCount = Math.floor(sampleRate * durationSeconds);

  const pcmBytes = new Uint8Array(sampleCount * 2);
  const pcmView = new DataView(pcmBytes.buffer);

  for (let i = 0; i < sampleCount; i++) {
    const envelope = Math.exp((-3 * i) / sampleCount);
    const value = Math.sin((2 * Math.PI * frequency * i) / sampleRate);
    const sample = Math.max(-1, Math.min(1, value * 0.35 * envelope));
    pcmView.setInt16(i * 2, Math.floor(sample * 32767), true);
  }

  const header = new ArrayBuffer(44);
  const headerView = new DataView(header);
  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      headerView.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeText(0, 'RIFF');
  headerView.setUint32(4, 36 + pcmBytes.length, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  headerView.setUint32(16, 16, true);
  headerView.setUint16(20, 1, true);
  headerView.setUint16(22, 1, true);
  headerView.setUint32(24, sampleRate, true);
  headerView.setUint32(28, sampleRate * 2, true);
  headerView.setUint16(32, 2, true);
  headerView.setUint16(34, 16, true);
  writeText(36, 'data');
  headerView.setUint32(40, pcmBytes.length, true);

  const wavBytes = new Uint8Array(44 + pcmBytes.length);
  wavBytes.set(new Uint8Array(header), 0);
  wavBytes.set(pcmBytes, 44);

  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < wavBytes.length; i += chunkSize) {
    const chunk = wavBytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  attentionToneDataUri = `data:audio/wav;base64,${btoa(binary)}`;
  return attentionToneDataUri;
};

const getSingletonAudio = (): HTMLAudioElement => {
  if (!singletonAudio) {
    singletonAudio = new Audio();
    // Critical for iOS: allows playback when the silent switch is ON and
    // when the screen is locked. "Managed media" is routed over Bluetooth.
    singletonAudio.setAttribute('playsinline', 'true');
    // Safari iOS 17+ treats <audio> with this attribute as "long-form" media,
    // which routes to A2DP (Bluetooth audio) rather than HFP (phone earpiece).
    singletonAudio.setAttribute('x-webkit-airplay', 'allow');
  }
  return singletonAudio;
};

/**
 * Creates (or resumes) a singleton AudioContext. On iOS the context starts in
 * "suspended" state and can ONLY be resumed inside a user-gesture callback.
 */
const getSingletonContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  if (!singletonCtx) {
    singletonCtx = new AudioCtx();
  }
  return singletonCtx;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Universal audio playback hook for Vmito PWA.
 *
 * Solves three notoriously tricky problems:
 * 1. **iOS autoplay gate** — `unlock()` resumes the AudioContext inside a user
 *    gesture so subsequent programmatic `.play()` calls are allowed.
 * 2. **Bluetooth routing** — Sets `navigator.mediaSession` metadata + playback
 *    state so the OS classifies the stream as *Media* (A2DP) instead of
 *    *System Sound* (HFP/internal speaker).
 * 3. **Singleton reuse** — A single `<audio>` element is reused across calls
 *    which is the most reliable pattern on Mobile Safari.
 */
const useUniversalVmitoAudio = (
  options?: IVmitoAudioOptions
): IUseUniversalVmitoAudioReturn => {
  const {
    title = 'Thông báo',
    artist = 'Vmito',
    album = 'Badminton Score',
  } = options ?? {};

  const isUnlockedRef = useRef(isGloballyUnlocked);

  // Keep the ref in sync with the module-level flag so consumers that read
  // `isUnlocked` after an external unlock still see `true`.
  useEffect(() => {
    isUnlockedRef.current = isGloballyUnlocked;
  }, []);

  // ------------------------------------------------------------------
  // Media Session helper — called before every play()
  // ------------------------------------------------------------------
  const applyMediaSession = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaSession) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album,
    });
    navigator.mediaSession.playbackState = 'playing';

    // Provide no-op handlers so the OS doesn't auto-pause when the user
    // taps the Bluetooth "pause" button on earbuds / car stereos etc.
    navigator.mediaSession.setActionHandler('play', () => {
      singletonAudio?.play();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      singletonAudio?.pause();
    });
    navigator.mediaSession.setActionHandler('stop', () => {
      if (singletonAudio) {
        singletonAudio.pause();
        singletonAudio.currentTime = 0;
      }
      if (navigator.mediaSession) {
        navigator.mediaSession.playbackState = 'none';
      }
    });
  }, [title, artist, album]);

  const startKeepAliveStream = useCallback(async () => {
    if (!isGloballyUnlocked) return;

    const audio = getSingletonAudio();
    audio.pause();
    audio.currentTime = 0;
    audio.loop = true;
    audio.volume = 0;
    if (audio.src !== SILENT_WAV_DATA_URI) {
      audio.src = SILENT_WAV_DATA_URI;
    }

    try {
      await audio.play();
      isKeepAlivePlaying = true;
      applyMediaSession();
    } catch {
      isKeepAlivePlaying = false;
    }
  }, [applyMediaSession]);

  // ------------------------------------------------------------------
  // unlock() — MUST be called from a user-gesture callback (onClick etc.)
  // ------------------------------------------------------------------
  const unlock = useCallback(async () => {
    if (isGloballyUnlocked) return;

    const audio = getSingletonAudio();
    const ctx = getSingletonContext();

    // 1. Resume the AudioContext (iOS requirement)
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }

    // 2. Play a tiny silent sound to "warm up" the <audio> element.
    //    Safari requires an actual .play() call inside a gesture before it
    //    will allow future programmatic plays.
    //    We use an inline base64 WAV (0.01 s silence) to avoid a network hit.
    audio.src = SILENT_WAV_DATA_URI;
    audio.volume = 0;
    try {
      await audio.play();
    } catch {
      // Swallow — some browsers reject even inside a gesture on first load.
    }
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;

    isGloballyUnlocked = true;
    isUnlockedRef.current = true;

    await startKeepAliveStream();
  }, [startKeepAliveStream]);

  // Auto-unlock on the first user gesture so notification audio can play later.
  useEffect(() => {
    if (typeof window === 'undefined' || isGloballyUnlocked) return;

    let isHandled = false;

    const removeListeners = () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };

    const handleFirstGesture = () => {
      if (isHandled) return;
      isHandled = true;
      void unlock().finally(removeListeners);
    };

    window.addEventListener('pointerdown', handleFirstGesture, {
      passive: true,
    });
    window.addEventListener('touchstart', handleFirstGesture, {
      passive: true,
    });
    window.addEventListener('keydown', handleFirstGesture);

    return removeListeners;
  }, []);

  // ------------------------------------------------------------------
  // play(src) — play an audio file, routing through Bluetooth
  // ------------------------------------------------------------------
  const play = useCallback(
    async (src: string) => {
      const audio = getSingletonAudio();

      if (isKeepAlivePlaying) {
        audio.pause();
        audio.currentTime = 0;
        isKeepAlivePlaying = false;
      }

      // If not unlocked yet, try to resume context (best-effort).
      if (!isGloballyUnlocked) {
        const ctx = getSingletonContext();
        if (ctx && ctx.state === 'suspended') {
          try {
            await ctx.resume();
          } catch {
            // Non-fatal
          }
        }
      }

      // Apply Media Session metadata BEFORE play — this is what makes the OS
      // classify the stream as "Media" and route it over Bluetooth A2DP.
      applyMediaSession();

      // Switch source. Reusing the same element is critical on Safari.
      audio.src = src;
      audio.currentTime = 0;

      try {
        await audio.play();
      } catch (err) {
        // On iOS if this fails the audio engine wasn't unlocked — warn dev.
        console.warn(
          '[useUniversalVmitoAudio] play() failed. Did you call unlock() on a user gesture first?',
          err
        );
        if (isGloballyUnlocked) {
          void startKeepAliveStream();
        }
        throw err;
      }

      // When playback ends, inform MediaSession so Bluetooth controls update.
      audio.onended = () => {
        if (navigator.mediaSession) {
          navigator.mediaSession.playbackState = 'paused';
        }
        if (isGloballyUnlocked) {
          void startKeepAliveStream();
        }
      };
    },
    [applyMediaSession, startKeepAliveStream]
  );

  const playAttention = useCallback(
    async (repeatCount: number = 1) => {
      const safeRepeatCount = Math.max(1, Math.min(5, repeatCount));
      const toneSrc = createAttentionToneDataUri();

      for (let i = 0; i < safeRepeatCount; i++) {
        await play(toneSrc);
        await new Promise((resolve) => {
          window.setTimeout(resolve, i < safeRepeatCount - 1 ? 350 : 0);
        });
      }
    },
    [play]
  );

  // ------------------------------------------------------------------
  // stop()
  // ------------------------------------------------------------------
  const stop = useCallback(() => {
    const audio = getSingletonAudio();
    audio.pause();
    audio.currentTime = 0;
    if (typeof navigator !== 'undefined' && navigator.mediaSession) {
      navigator.mediaSession.playbackState = 'none';
    }
  }, []);

  // Cleanup: when the component that uses this hook unmounts, do NOT destroy
  // the singleton — other components may still need it. Only reset session.
  useEffect(() => {
    return () => {
      if (typeof navigator !== 'undefined' && navigator.mediaSession) {
        navigator.mediaSession.playbackState = 'none';
      }
    };
  }, []);

  return {
    unlock,
    play,
    playAttention,
    stop,
    isUnlocked: isUnlockedRef.current,
  };
};

export default useUniversalVmitoAudio;
