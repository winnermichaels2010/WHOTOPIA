/**
 * GameEngine - Core Whot card game logic
 * 
 * Handles:
 * - Card validation (can a card be played?)
 * - Turn management
 * - Special card effects (Hold, Pick 2, Market, Whot)
 * - Win condition checking
 * - AI game state management
 */

import WhotDeck from './WhotDeck';

class GameEngine {
  constructor() {
    this.deck = new WhotDeck();
    this.players = [];
    this.currentTurn = 0;
    this.currentSymbol = null;
    this.gameStatus = 'idle'; // idle, playing, finished
    this.winner = null;
    this.pendingPick2 = 0;
    this.lastAction = null;
    this.direction = 1; // 1 = forward, -1 = reverse
  }

  /**
   * Initialize a new game
   * @param {Array} playerNames - Array of player names
   * @param {number} cardsPerPlayer - Cards per player
   */
  initGame(playerNames, cardsPerPlayer = 5) {
    this.players = playerNames.map((name, index) => ({
      id: index,
      name,
      hand: [],
      isAI: false,
      cardCount: 0,
      isActive: true,
    }));

    const hands = this.deck.deal(playerNames.length, cardsPerPlayer);
    this.players.forEach((player, index) => {
      player.hand = hands[index];
      player.cardCount = player.hand.length;
    });

    // Set initial card (first card from deck)
    let firstCard = this.deck.drawCard();
    while (firstCard && firstCard.isSpecial && firstCard.specialType !== 'whot') {
      // If first card is special, put it back and draw again
      this.deck.cards.unshift(firstCard);
      this.deck.shuffle();
      firstCard = this.deck.drawCard();
    }

    if (firstCard) {
      this.deck.playCard(firstCard);
      this.currentSymbol = firstCard.symbol;
    }

    this.currentTurn = 0;
    this.gameStatus = 'playing';
    this.winner = null;
    this.pendingPick2 = 0;
    this.direction = 1;
    this.lastAction = 'Game started';
  }

  /**
   * Validate if a card can be played
   * @param {Object} card - Card to validate
   * @param {number} playerId - Player ID
   * @returns {Object} { valid: boolean, reason: string }
   */
  canPlayCard(card, playerId) {
    if (this.gameStatus !== 'playing') {
      return { valid: false, reason: 'Game is not in progress' };
    }

    if (this.players[playerId].id !== this.currentTurn) {
      return { valid: false, reason: 'Not your turn' };
    }

    if (this.pendingPick2 > 0) {
      return { valid: false, reason: 'You must draw cards first' };
    }

    const topCard = this.deck.getTopCard();
    if (!topCard) return { valid: true, reason: '' };

    // Whot card can be played on anything
    if (card.specialType === 'whot') {
      return { valid: true, reason: '' };
    }

    // Match by symbol
    if (card.symbol === this.currentSymbol) {
      return { valid: true, reason: '' };
    }

    // Match by value
    if (card.value === topCard.value) {
      return { valid: true, reason: '' };
    }

    return { valid: false, reason: `Card must match symbol (${this.currentSymbol}) or value (${topCard.value})` };
  }

  /**
   * Play a card
   * @param {Object} card - Card to play
   * @param {number} playerId - Player ID
   * @param {string} chosenSymbol - Symbol chosen (for Market/Whot cards)
   * @returns {Object} Result of the play
   */
  playCard(card, playerId, chosenSymbol = null) {
    const validation = this.canPlayCard(card, playerId);
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }

    const player = this.players[playerId];

    // Remove card from hand
    const cardIndex = player.hand.findIndex(c => c.id === card.id);
    if (cardIndex === -1) {
      return { success: false, error: 'Card not in hand' };
    }
    player.hand.splice(cardIndex, 1);
    player.cardCount = player.hand.length;

    // Play card to discard pile
    this.deck.playCard(card);

    // Update current symbol
    if (card.specialType === 'market' && chosenSymbol) {
      this.currentSymbol = chosenSymbol;
    } else if (card.specialType === 'whot' && chosenSymbol) {
      this.currentSymbol = chosenSymbol;
    } else {
      this.currentSymbol = card.symbol;
    }

    // Handle special card effects
    const effects = this.handleSpecialCard(card, playerId);

    // Check win condition
    if (player.hand.length === 0) {
      this.gameStatus = 'finished';
      this.winner = playerId;
      this.lastAction = `${player.name} wins!`;
      return {
        success: true,
        effects,
        gameOver: true,
        winner: playerId,
        winnerName: player.name,
      };
    }

    // Move to next turn
    if (!effects.skipNext) {
      this.nextTurn();
    }

    this.lastAction = `${player.name} played ${card.name} ${card.symbolDisplay}`;
    if (chosenSymbol) {
      this.lastAction += ` → ${chosenSymbol}`;
    }

    return {
      success: true,
      effects,
      gameOver: false,
    };
  }

  /**
   * Handle special card effects
   */
  handleSpecialCard(card, playerId) {
    const effects = { skipNext: false, pick2: 0, market: false };

    switch (card.specialType) {
      case 'hold': // Value 1 - Next player skips turn
        effects.skipNext = true;
        this.lastAction = 'Hold! Next player skips a turn';
        break;

      case 'pick2': // Value 2 - Next player draws 2
        this.pendingPick2 += 2;
        effects.pick2 = this.pendingPick2;
        this.lastAction = 'Pick 2! Next player draws 2 cards';
        break;

      case 'market': // Value 5 or 8 - Player chooses symbol
        effects.market = true;
        this.lastAction = 'Market! Choose a symbol';
        break;

      case 'whot': // Value 14 or 20 - Wild, choose symbol
        effects.market = true;
        this.lastAction = 'Whot! Choose a symbol';
        break;

      default:
        break;
    }

    return effects;
  }

  /**
   * Force a player to draw cards
   * @param {number} playerId - Player ID
   * @param {number} count - Number of cards to draw
   * @returns {Array} Cards drawn
   */
  drawCards(playerId, count = 1) {
    const player = this.players[playerId];
    const drawnCards = [];

    for (let i = 0; i < count; i++) {
      const card = this.deck.drawCard();
      if (card) {
        player.hand.push(card);
        player.cardCount = player.hand.length;
        drawnCards.push(card);
      }
    }

    if (this.pendingPick2 > 0) {
      this.pendingPick2 = 0;
    }

    this.lastAction = `${player.name} drew ${drawnCards.length} card(s)`;
    this.nextTurn();

    return drawnCards;
  }

  /**
   * Move to the next player's turn
   */
  nextTurn() {
    const numPlayers = this.players.filter(p => p.isActive).length;
    if (numPlayers === 0) return;

    let next = this.currentTurn + this.direction;
    if (next >= this.players.length) next = 0;
    if (next < 0) next = this.players.length - 1;

    this.currentTurn = next;
  }

  /**
   * Get the current game state for a player
   * @param {number} playerId - Player ID
   * @returns {Object} Game state
   */
  getGameState(playerId) {
    const topCard = this.deck.getTopCard();
    return {
      gameStatus: this.gameStatus,
      currentTurn: this.currentTurn,
      currentSymbol: this.currentSymbol,
      topCard: topCard,
      myHand: this.players[playerId]?.hand || [],
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        cardCount: p.cardCount,
        isActive: p.isActive,
        isCurrentTurn: p.id === this.currentTurn,
      })),
      deckSize: this.deck.cards.length,
      pendingPick2: this.pendingPick2,
      lastAction: this.lastAction,
      winner: this.winner,
      direction: this.direction,
    };
  }

  /**
   * Get valid moves for a player
   * @param {number} playerId - Player ID
   * @returns {Array} Valid cards that can be played
   */
  getValidMoves(playerId) {
    if (this.gameStatus !== 'playing') return [];
    if (this.players[playerId].id !== this.currentTurn) return [];
    if (this.pendingPick2 > 0) return [];

    return this.players[playerId].hand.filter(card => {
      return this.canPlayCard(card, playerId).valid;
    });
  }
}

export default GameEngine;