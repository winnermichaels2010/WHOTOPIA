class AIEngine {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
  }

  chooseCard(validCards, gameState) {
    if (!validCards || validCards.length === 0) return null;

    switch (this.difficulty) {
      case 'easy':
        return this._easyChoice(validCards);
      case 'medium':
        return this._mediumChoice(validCards, gameState);
      case 'hard':
        return this._hardChoice(validCards, gameState);
      default:
        return this._mediumChoice(validCards, gameState);
    }
  }

  chooseSymbol(gameState) {
    const symbolCounts = {};
    for (const card of gameState.myHand) {
      if (card.value !== 20) {
        symbolCounts[card.symbol] = (symbolCounts[card.symbol] || 0) + 1;
      }
    }

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

  shouldDraw(validCards, _gameState) {
    return !validCards || validCards.length === 0;
  }

  _easyChoice(validCards) {
    return validCards[0];
  }

  _mediumChoice(validCards, gameState) {
    const nonSpecial = validCards.filter(c => !c.isSpecial);
    if (nonSpecial.length > 0 && gameState.myHand.length > 4) {
      const sorted = [...nonSpecial].sort((a, b) => b.value - a.value);
      return sorted[0];
    }

    const pickCards = validCards.filter(c => c.specialType === 'pick2' || c.specialType === 'pick3');
    if (pickCards.length > 0 && gameState.myHand.length > 6) return pickCards[0];

    const holdCards = validCards.filter(c => c.specialType === 'hold');
    if (holdCards.length > 0) return holdCards[0];

    const whotCards = validCards.filter(c => c.value === 20);
    if (whotCards.length > 0 && gameState.myHand.length <= 3) return whotCards[0];

    const suspensionCards = validCards.filter(c => c.specialType === 'suspension');
    if (suspensionCards.length > 0) return suspensionCards[0];

    const marketCards = validCards.filter(c => c.specialType === 'generalMarket');
    if (marketCards.length > 0 && gameState.myHand.length > 3) return marketCards[0];

    const sorted = [...validCards].sort((a, b) => b.value - a.value);
    return sorted[0];
  }

  _hardChoice(validCards, gameState) {
    const scoredMoves = validCards.map(card => {
      let score = 0;

      if (card.value === 20) {
        score += card.specialType === 'whot' ? 50 : 0;
        if (gameState.myHand.length <= 2) score += 30;
      }

      if (card.specialType === 'hold') score += 25;

      if (card.specialType === 'pick2') score += 20;
      if (card.specialType === 'pick3') score += 25;

      if (card.specialType === 'suspension') score += 15;

      if (card.specialType === 'generalMarket') {
        score += gameState.players.length > 2 ? 20 : 10;
      }

      if (!card.isSpecial) {
        score += 5;
      }

      const sameSymbolCount = gameState.myHand.filter(c => c.symbol === card.symbol).length;
      if (sameSymbolCount > 1 && !card.isSpecial) score -= 5;

      const cardsLeft = gameState.myHand.length - 1;
      if (cardsLeft === 1) score += 15;
      if (cardsLeft === 0) score += 100;

      if (card.value >= 10 && card.value < 20 && !card.isSpecial) score += 8;

      return { card, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].card;
  }
}

export default AIEngine;