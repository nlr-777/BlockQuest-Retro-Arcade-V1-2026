// BlockQuest Official - Character Score Bonus Utility
// Applies character ability bonuses to game scores

import { useCharacterStore } from '../store/characterStore';
import { getCharacterBonus } from '../constants/characters';

/**
 * Hook to get character bonus for a specific game
 * Returns the bonus percentage and a function to apply it
 */
export const useCharacterBonus = (gameId: string) => {
  const { getSelectedCharacter, recordCharacterGame } = useCharacterStore();
  const character = getSelectedCharacter();
  
  // Get bonus percentage (0 if no bonus)
  const bonusPercent = character ? getCharacterBonus(character, gameId) : 0;
  
  /**
   * Apply character bonus to a score
   * @param baseScore - The original score
   * @returns The score with bonus applied (if any)
   */
  const applyBonus = (baseScore: number): number => {
    if (bonusPercent > 0) {
      return Math.round(baseScore * (1 + bonusPercent / 100));
    }
    return baseScore;
  };
  
  /**
   * Calculate bonus points added
   * @param baseScore - The original score
   * @returns The bonus points (0 if no bonus)
   */
  const getBonusPoints = (baseScore: number): number => {
    if (bonusPercent > 0) {
      return Math.round(baseScore * (bonusPercent / 100));
    }
    return 0;
  };
  
  /**
   * Record game completion with character XP
   * @param score - The final score (before bonus)
   */
  const recordGame = (score: number) => {
    if (character) {
      recordCharacterGame(character.id, score);
    }
  };
  
  return {
    character,
    bonusPercent,
    hasBonus: bonusPercent > 0,
    applyBonus,
    getBonusPoints,
    recordGame,
    abilityName: character?.specialAbility.name || null,
    abilityIcon: character?.specialAbility.icon || null,
  };
};

/**
 * Format score with bonus indicator
 * @param baseScore - The original score
 * @param bonusPercent - The bonus percentage
 * @returns Formatted string like "1000 (+150)"
 */
export const formatScoreWithBonus = (baseScore: number, bonusPercent: number): string => {
  if (bonusPercent > 0) {
    const bonusPoints = Math.round(baseScore * (bonusPercent / 100));
    return `${baseScore + bonusPoints} (+${bonusPoints})`;
  }
  return `${baseScore}`;
};
