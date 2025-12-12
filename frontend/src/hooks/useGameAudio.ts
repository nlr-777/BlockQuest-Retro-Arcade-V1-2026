// BlockQuest Official - useGameAudio Hook
// Easy integration of audio into game components
import { useEffect, useCallback } from 'react';
import audioManager, { SoundEffect, MusicTrack } from '../utils/AudioManager';

interface UseGameAudioOptions {
  musicTrack?: MusicTrack;
  autoStartMusic?: boolean;
}

export const useGameAudio = (options: UseGameAudioOptions = {}) => {
  const { musicTrack = 'action', autoStartMusic = true } = options;

  // Start music when component mounts
  useEffect(() => {
    audioManager.resumeAudioContext();
    
    if (autoStartMusic) {
      audioManager.startMusic(musicTrack);
    }
    
    return () => {
      audioManager.stopMusic();
    };
  }, [musicTrack, autoStartMusic]);

  // Sound effect shortcuts
  const playSound = useCallback((effect: SoundEffect) => {
    audioManager.playSound(effect);
  }, []);

  const playJump = useCallback(() => audioManager.playSound('jump'), []);
  const playCollect = useCallback(() => audioManager.playSound('collect'), []);
  const playHit = useCallback(() => audioManager.playSound('hit'), []);
  const playPowerup = useCallback(() => audioManager.playSound('powerup'), []);
  const playShoot = useCallback(() => audioManager.playSound('shoot'), []);
  const playMove = useCallback(() => audioManager.playSound('move'), []);
  const playClick = useCallback(() => audioManager.playSound('click'), []);
  const playLevelUp = useCallback(() => audioManager.playSound('levelup'), []);
  
  // Game state sounds
  const playGameStart = useCallback(() => {
    audioManager.playSound('start');
    audioManager.startMusic(musicTrack);
  }, [musicTrack]);
  
  const playGameOver = useCallback(() => {
    audioManager.stopMusic();
    audioManager.playSound('gameover');
  }, []);
  
  const playVictory = useCallback(() => {
    audioManager.stopMusic();
    audioManager.playSound('victory');
  }, []);

  const playPause = useCallback(() => {
    audioManager.playSound('pause');
  }, []);

  // Music control
  const changeMusic = useCallback((track: MusicTrack) => {
    audioManager.changeTrack(track);
  }, []);

  const stopMusic = useCallback(() => {
    audioManager.stopMusic();
  }, []);

  // Beat sync for VFX
  const isOnBeat = useCallback(() => {
    return audioManager.isOnBeat();
  }, []);

  const getCurrentBeat = useCallback(() => {
    return audioManager.getCurrentBeat();
  }, []);

  return {
    // Individual sound effects
    playSound,
    playJump,
    playCollect,
    playHit,
    playPowerup,
    playShoot,
    playMove,
    playClick,
    playLevelUp,
    
    // Game state sounds
    playGameStart,
    playGameOver,
    playVictory,
    playPause,
    
    // Music control
    changeMusic,
    stopMusic,
    
    // Beat sync
    isOnBeat,
    getCurrentBeat,
  };
};

export default useGameAudio;
