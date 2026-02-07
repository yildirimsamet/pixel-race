import { useCallback } from 'react';

export const useSoundEffects = () => {
  const playStatDecrease = useCallback(() => {
    try {
      const audio = new Audio('/sounds/stat-decrease.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (error) {}
  }, []);

  const playStatIncrease = useCallback(() => {
    try {
      const audio = new Audio('/sounds/stat-increase.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (error) {}
  }, []);

  const playModalOpen = useCallback(() => {
    try {
      const audio = new Audio('/sounds/modal-open.mp3');
      audio.volume = 0.2;
      audio.play().catch(() => {});
    } catch (error) {}
  }, []);

  return { playStatDecrease, playStatIncrease, playModalOpen };
};
