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
    const SILENT_WAV =
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
    audio.src = SILENT_WAV;
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
  }, []);

  // ------------------------------------------------------------------
  // play(src) — play an audio file, routing through Bluetooth
  // ------------------------------------------------------------------
  const play = useCallback(
    async (src: string) => {
      const audio = getSingletonAudio();

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
        throw err;
      }

      // When playback ends, inform MediaSession so Bluetooth controls update.
      audio.onended = () => {
        if (navigator.mediaSession) {
          navigator.mediaSession.playbackState = 'paused';
        }
      };
    },
    [applyMediaSession]
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
    stop,
    isUnlocked: isUnlockedRef.current,
  };
};

export default useUniversalVmitoAudio;
