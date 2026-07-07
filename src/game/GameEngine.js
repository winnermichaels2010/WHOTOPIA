import WhotDeck from './WhotDeck';

class GameEngine {
  constructor() {
    this.deck = new WhotDeck();
    this.players = [];
    this.currentTurn = 0;
    this.currentSymbol = null;
    this.gameStatus = 'idle';
    this.winner = null;
    this.drawPenalty = 0;
    this.skipTurn = false;
    this.repeatTurn = false;
    this.lastAction = null;
    this.direction = 1;
  }

  initGame(playerNames, cardsPerPlayer = 5) {
    this.players = playerNames.map((name, index) => ({
      id: index,
      name,
      hand: [],
      isAI: false,
      cardCount: 0,
      isActive: true,
    }));

    this.deck.createDeck();
    this.deck.shuffle();

    const validation = this.deck.validate();
    if (!validation.valid) {
      throw new Error(`Deck validation failed: ${validation.error}`);
    }

    const hands = this.deck.deal(playerNames.length, cardsPerPlayer);
    this.players.forEach((player, index) => {
      player.hand = hands[index];
      player.cardCount = player.hand.length;
    });

    let firstCard = this.deck.drawCard();
    while (firstCard && firstCard.isSpecial && firstCard.specialType !== 'whot') {
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
    this.drawPenalty = 0;
    this.skipTurn = false;
    this.repeatTurn = false;
    this.direction = 1;
    this.lastAction = 'Game started';
  }

  canPlayCard(card, playerId) {
    if (this.gameStatus !== 'playing') {
      return { valid: false, reason: 'Game is not in progress' };
    }
    if (playerId !== this.currentTurn) {
      return { valid: false, reason: 'Not your turn' };
    }
    if (this.drawPenalty > 0) {
      return { valid: false, reason: 'You must draw penalty cards first' };
    }

    const topCard = this.deck.getTopCard();
    if (!topCard) return { valid: true, reason: '' };

    if (card.value === 20) {
      return { valid: true, reason: '' };
    }

    if (card.symbol === this.currentSymbol) {
      return { valid: true, reason: '' };
    }

    if (topCard && card.value === topCard.value) {
      return { valid: true, reason: '' };
    }

    return {
      valid: false,
      reason: `Card must match symbol (${this.currentSymbol}) or value (${topCard ? topCard.value : 'N/A'})`,
    };
  }

  playCard(card, playerId, chosenSymbol = null) {
    if (this.gameStatus === 'finished') {
      return { success: false, error: 'Game is already over' };
    }

    const validation = this.canPlayCard(card, playerId);
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }

    const player = this.players[playerId];
    const cardIndex = player.hand.findIndex(c => c.id === card.id);
    if (cardIndex === -1) {
      return { success: false, error: 'Card not in hand' };
    }
    player.hand.splice(cardIndex, 1);
    player.cardCount = player.hand.length;

    this.deck.playCard(card);

    if (card.value === 20 && chosenSymbol) {
      this.currentSymbol = chosenSymbol;
    } else if (card.value !== 20) {
      this.currentSymbol = card.symbol;
    }

    const effects = this.applySpecialEffects(card, playerId);

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

    if (this.repeatTurn) {
      this.repeatTurn = false;
    } else {
      this.advanceTurn();
    }

    this.lastAction = this._formatLastAction(player.name, card, chosenSymbol);

    return {
      success: true,
      effects,
      gameOver: false,
    };
  }

  applySpecialEffects(card, _playerId) {
    const effects = {
      holdOn: false,
      drawPenaltyAdded: 0,
      suspension: false,
      generalMarket: false,
    };

    switch (card.specialType) {
      case 'hold':
        effects.holdOn = true;
        this.repeatTurn = true;
        this.lastAction = 'Hold On! Same player plays again.';
        break;

      case 'pick2':
        this.drawPenalty += 2;
        effects.drawPenaltyAdded = 2;
        this.lastAction = 'Pick Two! Next player draws 2 and loses turn.';
        break;

      case 'pick3':
        this.drawPenalty += 3;
        effects.drawPenaltyAdded = 3;
        this.lastAction = 'Pick Three! Next player draws 3 and loses turn.';
        break;

      case 'suspension':
        this.skipTurn = true;
        effects.suspension = true;
        this.lastAction = 'Suspension! Next player is skipped.';
        break;

      case 'generalMarket':
        this.drawPenalty += 1;
        effects.generalMarket = true;
        this.lastAction = 'General Market! Next player draws 1 card.';
        break;

      default:
        break;
    }

    return effects;
  }

  advanceTurn() {
    const numPlayers = this.players.length;
    if (numPlayers === 0) return;

    let next = this.currentTurn;
    let tries = 0;
    do {
      next = (next + this.direction + numPlayers) % numPlayers;
      tries++;
      if (tries > numPlayers) {
        this.gameStatus = 'finished';
        this.winner = null;
        this.lastAction = 'No active players left. Game tied.';
        return;
      }
    } while (!this.players[next].isActive);

    this.currentTurn = next;

    if (this.drawPenalty > 0) {
      this.lastAction = `${this.players[this.currentTurn].name} must draw ${this.drawPenalty} penalty card(s)!`;
      return;
    }

    if (this.skipTurn) {
      this.skipTurn = false;
      this.lastAction = `${this.players[this.currentTurn].name}'s turn is skipped.`;
      this.advanceTurn();
      return;
    }
  }

  drawCard(playerId) {
    if (this.gameStatus !== 'playing') {
      return { success: false, error: 'Game is not in progress', cards: [] };
    }
    if (playerId !== this.currentTurn) {
      return { success: false, error: 'Not your turn', cards: [] };
    }

    if (this.drawPenalty > 0) {
      const card = this.deck.drawCard();
      if (!card) {
        return { success: false, error: 'Deck is empty', cards: [] };
      }
      this.players[playerId].hand.push(card);
      this.players[playerId].cardCount = this.players[playerId].hand.length;
      this.drawPenalty--;

      if (this.drawPenalty === 0) {
        this.lastAction = `${this.players[playerId].name} drew all penalty cards and loses turn.`;
        this.advanceTurn();
      } else {
        this.lastAction = `${this.players[playerId].name} drew a penalty card (${this.drawPenalty} more to draw).`;
      }

      return { success: true, card, isPlayable: false, cards: [card] };
    }

    const card = this.deck.drawCard();
    if (!card) {
      return { success: false, error: 'Deck is empty', cards: [] };
    }

    this.players[playerId].hand.push(card);
    this.players[playerId].cardCount = this.players[playerId].hand.length;

    const isPlayable = this.canPlayCard(card, playerId).valid;

    if (!isPlayable) {
      this.lastAction = `${this.players[playerId].name} drew a card and cannot play it.`;
      this.advanceTurn();
    } else {
      this.lastAction = `${this.players[playerId].name} drew a card. It may be played.`;
      this._drawnCardPlayable = true;
      this._lastDrawnCard = card;
    }

    return { success: true, card, isPlayable, cards: [card] };
  }

  passAfterDraw(playerId) {
    if (playerId !== this.currentTurn) {
      return { success: false, error: 'Not your turn' };
    }
    this._drawnCardPlayable = false;
    this._lastDrawnCard = null;
    this.lastAction = `${this.players[playerId].name} passed after drawing.`;
    this.advanceTurn();
    return { success: true };
  }

  canDrawBePlayed(playerId) {
    if (playerId !== this.currentTurn) return false;
    return this._drawnCardPlayable && this._lastDrawnCard != null;
  }

  getLastDrawnCard(playerId) {
    if (playerId !== this.currentTurn) return null;
    return this._lastDrawnCard;
  }

  getGameState(playerId) {
    const topCard = this.deck.getTopCard();
    const state = {
      gameStatus: this.gameStatus,
      currentTurn: this.currentTurn,
      currentSymbol: this.currentSymbol,
      topCard,
      myHand: this.players[playerId]?.hand || [],
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        cardCount: p.cardCount,
        isActive: p.isActive,
        isCurrentTurn: p.id === this.currentTurn,
      })),
      deckSize: this.deck.cards.length,
      drawPenalty: this.drawPenalty,
      lastAction: this.lastAction,
      winner: this.winner,
      direction: this.direction,
      canPlayDrawnCard: this.canDrawBePlayed(playerId),
      lastDrawnCard: this.getLastDrawnCard(playerId),
    };

    if (this.gameStatus === 'playing') {
      state.validMoves = this.getValidCards(playerId);
    } else {
      state.validMoves = [];
    }

    return state;
  }

  getValidCards(playerId) {
    if (this.gameStatus !== 'playing') return [];
    if (playerId !== this.currentTurn) return [];
    if (this.drawPenalty > 0) return [];

    return this.players[playerId].hand.filter(card => {
      return this.canPlayCard(card, playerId).valid;
    });
  }

  _formatLastAction(playerName, card, chosenSymbol) {
    let msg = `${playerName} played ${card.name}`;
    if (chosenSymbol) {
      msg += ` → ${chosenSymbol}`;
    }
    return msg;
  }

  exportState() {
    const stripCard = (c) => {
      const card = { ...c };
      if (card.specialType === null) delete card.specialType;
      return card;
    };
    const state = {
      players: this.players.map(p => ({
        ...p,
        hand: p.hand.map(stripCard),
      })),
      currentTurn: this.currentTurn,
      gameStatus: this.gameStatus,
      drawPenalty: this.drawPenalty,
      skipTurn: this.skipTurn,
      repeatTurn: this.repeatTurn,
      direction: this.direction,
      deck: {
        cards: this.deck.cards.map(stripCard),
        discardPile: this.deck.discardPile.map(stripCard),
      },
      _drawnCardPlayable: !!this._drawnCardPlayable,
    };
    if (this.currentSymbol != null) state.currentSymbol = this.currentSymbol;
    if (this.winner != null) state.winner = this.winner;
    if (this.lastAction != null) state.lastAction = this.lastAction;
    if (this._lastDrawnCard != null) state._lastDrawnCard = stripCard(this._lastDrawnCard);
    return state;
  }

  importState(state) {
    const restoreCard = (c) => ({ ...c, specialType: c.specialType ?? null });
    this.players = state.players.map(p => ({
      ...p,
      hand: p.hand.map(restoreCard),
    }));
    this.currentTurn = state.currentTurn;
    this.currentSymbol = state.currentSymbol ?? null;
    this.gameStatus = state.gameStatus;
    this.winner = state.winner ?? null;
    this.drawPenalty = state.drawPenalty;
    this.skipTurn = state.skipTurn;
    this.repeatTurn = state.repeatTurn;
    this.lastAction = state.lastAction ?? null;
    this.direction = state.direction;
    this.deck.cards = state.deck.cards.map(restoreCard);
    this.deck.discardPile = state.deck.discardPile.map(restoreCard);
    this._drawnCardPlayable = !!state._drawnCardPlayable;
    this._lastDrawnCard = state._lastDrawnCard ? restoreCard(state._lastDrawnCard) : null;
  }
}

export default GameEngine;