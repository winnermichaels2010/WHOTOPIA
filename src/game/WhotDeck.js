/**
 * WhotDeck - Creates and manages the Whot card deck
 * 
 * Whot card game has 54 cards with 5 symbols + Whot:
 * - Star (★), Circle (●), Cross (✚), Square (■), Triangle (▲)
 * - Whot (⭐) - wild card
 * 
 * Card values: 1-14 (with duplicates for some values)
 * Special cards: 1=Hold, 2=Pick 2, 5=Market, 8=Market, 14=Whot
 */

const SYMBOLS = {
  STAR: { id: 'star', symbol: '★', name: 'Star' },
  CIRCLE: { id: 'circle', symbol: '●', name: 'Circle' },
  CROSS: { id: 'cross', symbol: '✚', name: 'Cross' },
  SQUARE: { id: 'square', symbol: '■', name: 'Square' },
  TRIANGLE: { id: 'triangle', symbol: '▲', name: 'Triangle' },
  WHOT: { id: 'whot', symbol: '⭐', name: 'Whot' },
};

// Card distribution: [value, count]
const CARD_DISTRIBUTION = [
  [1, 3],   // Hold - 3 per symbol
  [2, 2],   // Pick 2 - 2 per symbol
  [3, 2],   // 2 per symbol
  [4, 2],   // 2 per symbol
  [5, 3],   // Market - 3 per symbol
  [6, 1],   // 1 per symbol
  [7, 1],   // 1 per symbol
  [8, 2],   // Market - 2 per symbol
  [9, 1],   // 1 per symbol
  [10, 1],  // 1 per symbol
  [11, 1],  // 1 per symbol
  [12, 1],  // 1 per symbol
  [13, 1],  // 1 per symbol
  [14, 1],  // Whot - 1 per symbol
];

const WHOT_CARDS = [
  { value: 20, symbol: 'whot', symbolDisplay: '⭐', name: 'Whot' },
  { value: 20, symbol: 'whot', symbolDisplay: '⭐', name: 'Whot' },
  { value: 20, symbol: 'whot', symbolDisplay: '⭐', name: 'Whot' },
  { value: 20, symbol: 'whot', symbolDisplay: '⭐', name: 'Whot' },
  { value: 20, symbol: 'whot', symbolDisplay: '⭐', name: 'Whot' },
];

class WhotDeck {
  constructor() {
    this.cards = [];
    this.discardPile = [];
  }

  /**
   * Create a full 54-card Whot deck
   */
  createDeck() {
    this.cards = [];
    const symbols = Object.values(SYMBOLS).filter(s => s.id !== 'whot');

    // Create regular cards
    for (const symbol of symbols) {
      for (const [value, count] of CARD_DISTRIBUTION) {
        for (let i = 0; i < count; i++) {
          this.cards.push({
            id: `${symbol.id}-${value}-${i}`,
            value,
            symbol: symbol.id,
            symbolDisplay: symbol.symbol,
            name: value === 1 ? 'Hold' :
                  value === 2 ? 'Pick 2' :
                  value === 5 ? 'Market' :
                  value === 8 ? 'Market' :
                  value === 14 ? 'Whot' :
                  `${value}`,
            isSpecial: [1, 2, 5, 8, 14].includes(value),
            specialType: value === 1 ? 'hold' :
                        value === 2 ? 'pick2' :
                        value === 5 ? 'market' :
                        value === 8 ? 'market' :
                        value === 14 ? 'whot' : null,
          });
        }
      }
    }

    // Add Whot cards (5 Whot cards)
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

  /**
   * Shuffle the deck using Fisher-Yates algorithm
   */
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    return this.cards;
  }

  /**
   * Deal cards to players
   * @param {number} numPlayers - Number of players
   * @param {number} cardsPerPlayer - Cards per player (default: 5)
   * @returns {Array} Array of player hands
   */
  deal(numPlayers, cardsPerPlayer = 5) {
    this.createDeck();
    this.shuffle();
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

    // Remaining cards become the draw pile
    this.cards = this.cards.slice(cardIndex);

    return hands;
  }

  /**
   * Draw a card from the deck
   * @returns {Object|null} Card object or null if deck is empty
   */
  drawCard() {
    if (this.cards.length === 0) {
      // Reshuffle discard pile into deck (keep top card)
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

  /**
   * Play a card to the discard pile
   * @param {Object} card - Card to play
   */
  playCard(card) {
    this.discardPile.push(card);
  }

  /**
   * Get the top card of the discard pile
   * @returns {Object|null} Top card or null
   */
  getTopCard() {
    if (this.discardPile.length === 0) return null;
    return this.discardPile[this.discardPile.length - 1];
  }

  /**
   * Reset the deck
   */
  reset() {
    this.cards = [];
    this.discardPile = [];
  }
}

export { WhotDeck, SYMBOLS };
export default WhotDeck;