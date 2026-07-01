/**
 * AIEngine - AI opponent for Whot card game
 * 
 * Three difficulty levels:
 * - Easy: Plays first valid card, no strategy
 * - Medium: Prioritizes special cards, matches by number first
 * - Hard: Point-based evaluation, strategic card selection
 */

class AIEngine {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
  }

  /**
   * Choose the best card for the AI to play
   * @param {Array} validMoves - Array of valid cards
   * @param {Object} gameState - Current game state
   * @returns {Object|null} Selected card or null (draw)
   */
  chooseCard(validMoves, gameState) {
    if (validMoves.length === 0) return null;

    switch (this.difficulty) {
      case 'easy':
        return this.easyChoice(validMoves);
      case 'medium':
        return this.mediumChoice(validMoves, gameState);
      case 'hard':
        return this.hardChoice(validMoves, gameState);
      default:
        return this.mediumChoice(validMoves, gameState);
    }
  }

  /**
   * Choose a symbol when playing Market or Whot
   * @param {Object} gameState - Current game state
   * @returns {string} Chosen symbol
   */
  chooseSymbol(gameState) {
    // Count symbols in AI's hand
    const symbolCounts = {};
    for (const card of gameState.myHand) {
      if (card.symbol !== 'whot') {
        symbolCounts[card.symbol] = (symbolCounts[card.symbol] || 0) + 1;
      }
    }

    // Choose the symbol we have the most of
    let bestSymbol = 'star';
    let maxCount = 0;
    for (const [symbol, count] of Object.entries(symbolCounts)) {
      if (count > maxCount) {
        maxCount = count;
        bestSymbol = symbol;
      }
    }

    return bestSymbol;
  }

  /**
   * Easy: Play first valid card
   */
  easyChoice(validMoves) {
    return validMoves[0];
  }

  /**
   * Medium: Prioritize special cards, match by number
   */
  mediumChoice(validMoves, gameState) {
    // Priority: Whot > Market > Hold > Pick 2 > regular cards
    const whotCards = validMoves.filter(c => c.specialType === 'whot');
    if (whotCards.length > 0 && validMoves.length > 1) {
      // Only play Whot if we have many cards left
      if (gameState.myHand.length > 3) {
        return whotCards[0];
      }
    }

    // Prefer playing Market cards
    const marketCards = validMoves.filter(c => c.specialType === 'market');
    if (marketCards.length > 0) return marketCards[0];

    // Prefer playing Hold cards
    const holdCards = validMoves.filter(c => c.specialType === 'hold');
    if (holdCards.length > 0) return holdCards[0];

    // Prefer playing Pick 2 cards
    const pick2Cards = validMoves.filter(c => c.specialType === 'pick2');
    if (pick2Cards.length > 0) return pick2Cards[0];

    // Match by value (prefer higher values to get rid of them)
    const sortedByValue = [...validMoves].sort((a, b) => b.value - a.value);
    return sortedByValue[0];
  }

  /**
   * Hard: Point-based strategic evaluation
   */
  hardChoice(validMoves, gameState) {
    const topCard = gameState.topCard;

    // Score each valid move
    const scoredMoves = validMoves.map(card => {
      let score = 0;

      // +50 for playing Whot (wild card)
      if (card.specialType === 'whot') score += 50;

      // +40 for playing Market (choose symbol)
      if (card.specialType === 'market') score += 40;

      // +30 for playing Hold (skip opponent)
      if (card.specialType === 'hold') score += 30;

      // +20 for playing Pick 2
      if (card.specialType === 'pick2') score += 20;

      // +15 for matching by symbol (keeps game going)
      if (card.symbol === gameState.currentSymbol) score += 15;

      // +10 for matching by value
      if (topCard && card.value === topCard.value) score += 10;

      // -5 for each card of this symbol in hand (prefer to keep pairs)
      const sameSymbolCount = gameState.myHand.filter(c => c.symbol === card.symbol).length;
      if (sameSymbolCount > 1) score -= 5;

      // +25 if playing this card reduces hand to 1 (one card left!)
      const cardsLeft = gameState.myHand.length - 1;
      if (cardsLeft === 1) score += 25;
      if (cardsLeft === 0) score += 100; // Winning move

      // -10 for high value cards (get rid of them)
      if (card.value >= 10 && card.value < 20) score += 10;

      return { card, score };
    });

    // Sort by score descending
    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].card;
  }

  /**
   * Decide whether to draw a card or play
   * @param {Array} validMoves - Valid cards
   * @param {Object} gameState - Game state
   * @returns {boolean} True if AI should draw
   */
  shouldDraw(validMoves, gameState) {
    if (validMoves.length === 0) return true;
    if (gameState.pendingPick2 > 0) return true;

    // Easy: always play if possible
    if (this.difficulty === 'easy') return false;

    // Medium/Hard: play if we have valid moves
    return false;
  }
}

export default AIEngine;