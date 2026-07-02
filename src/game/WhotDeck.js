const SYMBOLS = {
  STAR: { id: 'star', symbol: '★', name: 'Star' },
  CIRCLE: { id: 'circle', symbol: '●', name: 'Circle' },
  CROSS: { id: 'cross', symbol: '✚', name: 'Cross' },
  SQUARE: { id: 'square', symbol: '■', name: 'Square' },
  TRIANGLE: { id: 'triangle', symbol: '▲', name: 'Triangle' },
  WHOT: { id: 'whot', symbol: '⭐', name: 'Whot' },
};

const SYMBOL_VALUES = {
  circle: [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14],
  triangle: [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14],
  cross: [1, 2, 3, 5, 7, 10, 11, 13, 14],
  square: [1, 2, 3, 5, 7, 10, 11, 13, 14],
  star: [1, 2, 3, 4, 5, 7, 8],
};

const SPECIAL_VALUES = [1, 2, 5, 8, 14, 20];

const TOTAL_CARDS = 54;

class WhotDeck {
  constructor() {
    this.cards = [];
    this.discardPile = [];
  }

  createDeck() {
    this.cards = [];
    const symbols = Object.values(SYMBOLS).filter(s => s.id !== 'whot');

    for (const symbol of symbols) {
      const values = SYMBOL_VALUES[symbol.id];
      for (let i = 0; i < values.length; i++) {
        this.cards.push(this._makeCard(symbol, values[i], i));
      }
    }

    for (let i = 0; i < 5; i++) {
      this.cards.push({
        id: `whot-${i}`,
        value: 20,
        symbol: 'whot',
        symbolDisplay: '⭐',
        name: 'Whot',
        isSpecial: true,
        specialType: 'whot',
      });
    }

    return this.cards;
  }

  _makeCard(symbol, value, index) {
    const specialType = {
      1: 'hold',
      2: 'pick2',
      5: 'pick3',
      8: 'suspension',
      14: 'generalMarket',
    }[value] || null;

    const name = {
      1: 'Hold On',
      2: 'Pick Two',
      5: 'Pick Three',
      8: 'Suspension',
      14: 'General Market',
    }[value] || `${value}`;

    return {
      id: `${symbol.id}-${value}-${index}`,
      value,
      symbol: symbol.id,
      symbolDisplay: symbol.symbol,
      name,
      isSpecial: SPECIAL_VALUES.includes(value),
      specialType,
    };
  }

  countCardsBySymbol() {
    const counts = {};
    for (const card of this.cards) {
      counts[card.symbol] = (counts[card.symbol] || 0) + 1;
    }
    return counts;
  }

  validate() {
    if (this.cards.length !== TOTAL_CARDS) {
      return { valid: false, error: `Expected ${TOTAL_CARDS} cards, got ${this.cards.length}` };
    }

    const symbolCounts = this.countCardsBySymbol();
    const expected = {
      circle: 12, triangle: 12, cross: 9, square: 9, star: 7, whot: 5,
    };

    for (const [sym, expectedCount] of Object.entries(expected)) {
      const actual = symbolCounts[sym] || 0;
      if (actual !== expectedCount) {
        return { valid: false, error: `Symbol "${sym}" has ${actual} cards, expected ${expectedCount}` };
      }
    }

    const whotCards = this.cards.filter(c => c.value === 20);
    if (whotCards.length !== 5) {
      return { valid: false, error: `Expected 5 Whot cards, got ${whotCards.length}` };
    }

    for (const [symbolId, values] of Object.entries(SYMBOL_VALUES)) {
      for (const value of values) {
        const match = this.cards.filter(c => c.symbol === symbolId && c.value === value);
        if (match.length !== 1) {
          return { valid: false, error: `Expected 1 card for ${symbolId}-${value}, got ${match.length}` };
        }
      }
    }

    return { valid: true };
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    return this.cards;
  }

  deal(numPlayers, cardsPerPlayer = 5) {
    this.discardPile = [];

    const hands = [];
    for (let i = 0; i < numPlayers; i++) {
      hands.push([]);
    }

    let cardIndex = 0;
    for (let c = 0; c < cardsPerPlayer; c++) {
      for (let p = 0; p < numPlayers; p++) {
        hands[p].push(this.cards[cardIndex]);
        cardIndex++;
      }
    }

    this.cards = this.cards.slice(cardIndex);
    return hands;
  }

  drawCard() {
    if (this.cards.length === 0) {
      if (this.discardPile.length > 1) {
        const topCard = this.discardPile.pop();
        this.cards = [...this.discardPile];
        this.discardPile = [topCard];
        this.shuffle();
      } else {
        return null;
      }
    }
    return this.cards.pop();
  }

  playCard(card) {
    this.discardPile.push(card);
  }

  getTopCard() {
    if (this.discardPile.length === 0) return null;
    return this.discardPile[this.discardPile.length - 1];
  }

  reset() {
    this.cards = [];
    this.discardPile = [];
  }
}

export { WhotDeck, SYMBOLS, SYMBOL_VALUES };
export default WhotDeck;
