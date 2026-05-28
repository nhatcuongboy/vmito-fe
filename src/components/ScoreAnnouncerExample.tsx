'use client';

import { useRef, useState } from 'react';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';

import useUniversalVmitoAudio from '@/hooks/useUniversalVmitoAudio';

// ---------------------------------------------------------------------------
// Replace these with your real announcement audio URLs
// ---------------------------------------------------------------------------
const SAMPLE_SOUNDS = {
  scorePoint: '/audio/score-point.mp3',
  matchPoint: '/audio/match-point.mp3',
  gameOver: '/audio/game-over.mp3',
};

/**
 * Example component demonstrating how to integrate `useUniversalVmitoAudio`.
 *
 * Key integration points:
 *  1. Call `unlock()` on the very first user interaction.
 *  2. Call `play(url)` whenever you need to announce a score.
 *  3. That's it — Bluetooth routing is handled automatically.
 */
const ScoreAnnouncerExample = () => {
  const { unlock, play, stop, isUnlocked } = useUniversalVmitoAudio({
    title: 'Thông báo điểm',
    artist: 'Vmito',
    album: 'Badminton Score',
  });

  const [isAudioReady, setIsAudioReady] = useState(isUnlocked);
  const [isPlaying, setIsPlaying] = useState(false);
  const hasUnlockedRef = useRef(false);

  // -----------------------------------------------------------------------
  // 1. UNLOCK — attach to the first user interaction on the page.
  //    You can also call this in a global "Start Session" button.
  // -----------------------------------------------------------------------
  const handleUnlockAudio = async () => {
    if (hasUnlockedRef.current) return;
    hasUnlockedRef.current = true;
    await unlock();
    setIsAudioReady(true);
  };

  // -----------------------------------------------------------------------
  // 2. PLAY — call with any audio URL.
  // -----------------------------------------------------------------------
  const handlePlaySound = async (src: string) => {
    // Safety: unlock on first interaction if the user skipped the unlock step
    if (!hasUnlockedRef.current) {
      await handleUnlockAudio();
    }
    setIsPlaying(true);
    try {
      await play(src);
    } catch {
      // play() already logs a warning; handle UI feedback here if needed
    } finally {
      setIsPlaying(false);
    }
  };

  // -----------------------------------------------------------------------
  // 3. STOP
  // -----------------------------------------------------------------------
  const handleStop = () => {
    stop();
    setIsPlaying(false);
  };

  return (
    <Box p={6} maxW="400px" mx="auto">
      <VStack gap={4} align="stretch">
        <Text fontSize="xl" fontWeight="bold">
          Vmito Score Announcer
        </Text>

        {/* ---------- Unlock button (required on iOS) ---------- */}
        {!isAudioReady && (
          <Button colorPalette="green" size="lg" onClick={handleUnlockAudio}>
            Tap to Enable Audio
          </Button>
        )}

        {isAudioReady && (
          <Text color="green.500" fontSize="sm">
            Audio engine ready — Bluetooth routing active
          </Text>
        )}

        {/* ---------- Playback buttons ---------- */}
        <HStack gap={2} flexWrap="wrap">
          <Button
            colorPalette="teal"
            onClick={() => handlePlaySound(SAMPLE_SOUNDS.scorePoint)}
            disabled={isPlaying}
          >
            Score Point
          </Button>
          <Button
            colorPalette="orange"
            onClick={() => handlePlaySound(SAMPLE_SOUNDS.matchPoint)}
            disabled={isPlaying}
          >
            Match Point
          </Button>
          <Button
            colorPalette="red"
            onClick={() => handlePlaySound(SAMPLE_SOUNDS.gameOver)}
            disabled={isPlaying}
          >
            Game Over
          </Button>
        </HStack>

        {isPlaying && (
          <Button variant="outline" onClick={handleStop}>
            Stop
          </Button>
        )}

        {/* ---------- iOS Silent-Mode guidance ---------- */}
        <Box
          mt={4}
          p={3}
          borderWidth="1px"
          borderRadius="md"
          fontSize="xs"
          color="gray.500"
        >
          <Text fontWeight="semibold" mb={1}>
            iOS Silent Switch Note
          </Text>
          <Text>
            File-based audio played via an {'<audio>'} element classified as
            &quot;Media&quot; (via Media Session API) will typically{' '}
            <strong>override</strong> the hardware silent switch on iOS. This is
            the desired behaviour for score announcements over Bluetooth. If you
            need to respect the silent switch, consider using{' '}
            <code>window.speechSynthesis</code> (TTS) instead, which honours the
            mute toggle.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default ScoreAnnouncerExample;
