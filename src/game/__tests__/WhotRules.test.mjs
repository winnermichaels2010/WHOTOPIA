import { describe, it, expect } from 'vitest';
import GameEngine from '../GameEngine.js';
import WhotDeck from '../WhotDeck.js';


function makeGame(players = ['Alice', 'Bob'], cardsPerPlayer = 5) {
  const engine = new GameEngine();
  engine.initGame(players, cardsPerPlayer);
  return engine;
}



function addCardToHand(engine, playerId, value, symbol) {
  const deck = engine.deck;
  const existing = deck.cards.find(c => c.value === value && c.symbol === symbol);
  if (existing) {
    const idx = deck.cards.indexOf(existing);
    deck.cards.splice(idx, 1);
    engine.players[playerId].hand.push(existing);
    engine.players[playerId].cardCount = engine.players[playerId].hand.length;
    return existing;
  }
  const card = {
    id: `test-${value}-${symbol}-${Date.now()}`,
    value,
    symbol,
    symbolDisplay: symbol,
    name: `${value}`,
    isSpecial: [1, 2, 5, 8, 14, 20].includes(value),
    specialType: ({ 1: 'hold', 2: 'pick2', 5: 'pick3', 8: 'suspension', 14: 'generalMarket' })[value] || null,
  };
  engine.players[playerId].hand.push(card);
  engine.players[playerId].cardCount = engine.players[playerId].hand.length;
  return card;
}



describe('Whot Game Rules', () => {
  describe('Turn Order', () => {
    it('starts with player 0', () => {
      const engine = makeGame();
      expect(engine.currentTurn).toBe(0);
    });

    it('advances to player 1', () => {
      const engine = makeGame(['Alice', 'Bob'], 5);
      const card = addCardToHand(engine, 0, 4, engine.currentSymbol);
      const result = engine.playCard(card, 0);
      expect(result.success).toBe(true);
      expect(result.gameOver).toBe(false);
      expect(engine.currentTurn).toBe(1);
    });
  });

  describe('Card Validation', () => {
    it('card with matching symbol is playable', () => {
      const engine = makeGame(['Alice', 'Bob'], 1);
      const topCard = engine.deck.getTopCard();
      const sym = topCard.symbol;
      const card = addCardToHand(engine, 0, 4, sym);
      const result = engine.canPlayCard(card, 0);
      expect(result.valid).toBe(true);
    });

    it('card with matching value is playable', () => {
      const engine = makeGame(['Alice', 'Bob'], 1);
      const topCard = engine.deck.getTopCard();
      const topValue = topCard.value;
      const card = addCardToHand(engine, 0, topValue, 'triangle');
      const result = engine.canPlayCard(card, 0);
      expect(result.valid).toBe(true);
    });

    it('Whot (20) card is always playable', () => {
      const engine = makeGame(['Alice', 'Bob'], 7);
      const whot = addCardToHand(engine, 0, 20, 'whot');
      const result = engine.canPlayCard(whot, 0);
      expect(result.valid).toBe(true);
    });

    it('non-matching card is not playable', () => {
      const engine = makeGame(['Alice', 'Bob'], 7);
      const topCard = engine.deck.getTopCard();
      const unavailable = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 20]
        .filter(v => v !== topCard.value)
        .find(v => v !== 20);
      const diffSymbol = Object.keys({ star: 1, circle: 1, cross: 1, square: 1, triangle: 1 })
        .find(s => s !== topCard.symbol);
      if (unavailable && diffSymbol) {
        const card = addCardToHand(engine, 0, unavailable, diffSymbol);
        const result = engine.canPlayCard(card, 0);
        expect(result.valid).toBe(false);
      }
    });
  });

  describe('Turn Restriction', () => {
    it('cannot play when not your turn', () => {
      const engine = makeGame(['Alice', 'Bob'], 7);
      const card = engine.players[1].hand[0];
      const result = engine.canPlayCard(card, 1);
      expect(result.valid).toBe(false);
    });
  });

  describe('Whot Card Rules', () => {
    it('changes symbol when played with chosen symbol', () => {
      const engine = makeGame(['Alice', 'Bob'], 1);
      engine.players[0].hand = [];
      const whot = addCardToHand(engine, 0, 20, 'whot');
      engine.playCard(whot, 0, 'circle');
      expect(engine.currentSymbol).toBe('circle');
    });
  });

  describe('Hold On', () => {
    it('same player plays again after Hold On', () => {
      const engine = makeGame(['Alice', 'Bob'], 5);
      const hold = addCardToHand(engine, 0, 1, engine.currentSymbol);
      const result = engine.playCard(hold, 0);
      expect(result.success).toBe(true);
      expect(result.gameOver).toBe(false);
      expect(engine.currentTurn).toBe(0);
    });
  });

  describe('Suspension', () => {
    it('skipTurn flag is set then cleared on advance', () => {
      const engine = makeGame(['Alice', 'Bob', 'Charlie'], 5);
      engine.skipTurn = true;
      engine.advanceTurn();
      expect(engine.skipTurn).toBe(false);
      expect(engine.currentTurn).toBe(2);
    });

    it('skips next player after Suspension play', () => {
      const engine = makeGame(['Alice', 'Bob', 'Charlie'], 5);
      const sCard = addCardToHand(engine, 0, 8, engine.currentSymbol);
      const canPlay = engine.canPlayCard(sCard, 0);
      expect(canPlay.valid).toBe(true);
      const result = engine.playCard(sCard, 0);
      expect(result.success).toBe(true);
      expect(result.gameOver).toBe(false);
      expect(engine.currentTurn).toBe(2);
    });
  });

  describe('General Market', () => {
    it('sets draw penalty of 1 for next player', () => {
      const engine = makeGame(['Alice', 'Bob', 'Charlie'], 1);
      const gmCard = addCardToHand(engine, 0, 14, engine.currentSymbol);
      engine.playCard(gmCard, 0);
      expect(engine.drawPenalty).toBe(1);
      expect(engine.currentTurn).toBe(1);
    });
  });

  describe('Win Condition', () => {
    it('game ends when player plays last card', () => {
      const engine = makeGame(['Alice', 'Bob'], 1);
      engine.players[0].hand = [];
      addCardToHand(engine, 0, 3, engine.currentSymbol);
      const card = engine.players[0].hand[0];
      engine.playCard(card, 0);
      expect(engine.gameStatus).toBe('finished');
      expect(engine.winner).toBe(0);
    });
  });

  describe('Draw Penalty', () => {
    it('sets draw penalty of 2 for next player', () => {
      const engine = makeGame(['Alice', 'Bob'], 2);
      const p2 = addCardToHand(engine, 0, 2, engine.currentSymbol);
      engine.playCard(p2, 0);
      expect(engine.drawPenalty).toBe(2);
      expect(engine.currentTurn).toBe(1);
    });

    it('prevents play for penalized player (only matching-value defense)', () => {
      const engine = makeGame(['Alice', 'Bob'], 2);
      const p2 = addCardToHand(engine, 0, 2, engine.currentSymbol);
      engine.playCard(p2, 0);
      const hand = engine.players[1].hand;
      const nonMatching = hand.find(c => c.value !== 2);
      if (nonMatching) {
        expect(engine.canPlayCard(nonMatching, 1).valid).toBe(false);
      }
      const defense = hand.find(c => c.value === 2);
      if (defense) {
        expect(engine.canPlayCard(defense, 1).valid).toBe(true);
      }
    });

    it('penalized player draws one card per click', () => {
      const engine = makeGame(['Alice', 'Bob'], 2);
      const p2 = addCardToHand(engine, 0, 2, engine.currentSymbol);
      engine.playCard(p2, 0);
      expect(engine.drawPenalty).toBe(2);
      const bobCount = engine.players[1].cardCount;
      engine.drawCard(1);
      expect(engine.players[1].cardCount).toBe(bobCount + 1);
      expect(engine.drawPenalty).toBe(1);
      expect(engine.currentTurn).toBe(1);
      engine.drawCard(1);
      expect(engine.players[1].cardCount).toBe(bobCount + 2);
      expect(engine.drawPenalty).toBe(0);
      expect(engine.currentTurn).toBe(0);
    });

    it('allows penalized player to defend with card 2 (blocks penalty, no stacking)', () => {
      const engine = makeGame(['Alice', 'Bob'], 2);
      const p2 = addCardToHand(engine, 0, 2, engine.currentSymbol);
      engine.playCard(p2, 0);
      const defenseCard = addCardToHand(engine, 1, 2, 'star');
      const beforeCount = engine.players[1].cardCount;
      const penaltyBefore = engine.drawPenalty;
      expect(penaltyBefore).toBeGreaterThan(0);
      const result = engine.playCard(defenseCard, 1);
      expect(result.success).toBe(true);
      expect(engine.drawPenalty).toBe(0);
      expect(engine.players[1].cardCount).toBe(beforeCount - 1);
    });

    it('rejects card 5 as defense against card 2 penalty', () => {
      const engine = makeGame(['Alice', 'Bob'], 5);
      const p2 = addCardToHand(engine, 0, 2, engine.currentSymbol);
      engine.playCard(p2, 0);
      const fiveCard = addCardToHand(engine, 1, 5, 'circle');
      expect(engine.canPlayCard(fiveCard, 1).valid).toBe(false);
    });

    it('allows penalized player to defend with card 5 (blocks penalty, no stacking)', () => {
      const engine = makeGame(['Alice', 'Bob'], 2);
      const p5 = addCardToHand(engine, 0, 5, engine.currentSymbol);
      engine.playCard(p5, 0);
      const defenseCard = addCardToHand(engine, 1, 5, 'circle');
      const beforeCount = engine.players[1].cardCount;
      expect(engine.drawPenalty).toBeGreaterThan(0);
      const result = engine.playCard(defenseCard, 1);
      expect(result.success).toBe(true);
      expect(engine.drawPenalty).toBe(0);
      expect(engine.players[1].cardCount).toBe(beforeCount - 1);
    });

    it('does not allow defense when stacking penalties is disabled', () => {
      const engine = new GameEngine({ stackingPenalties: false });
      engine.initGame(['Alice', 'Bob'], 2);
      const p2 = addCardToHand(engine, 0, 2, engine.currentSymbol);
      engine.playCard(p2, 0);
      const defenseCard = addCardToHand(engine, 1, 2, 'star');
      expect(engine.canPlayCard(defenseCard, 1).valid).toBe(false);
    });

    it('does not allow defending a pick 2 when allowDefendPick2 is disabled', () => {
      const engine = new GameEngine({ allowDefendPick2: false });
      engine.initGame(['Alice', 'Bob'], 2);
      const p2 = addCardToHand(engine, 0, 2, engine.currentSymbol);
      engine.playCard(p2, 0);
      const defenseCard = addCardToHand(engine, 1, 2, 'star');
      expect(engine.canPlayCard(defenseCard, 1).valid).toBe(false);
    });

    it('does not allow defending a pick 3 when allowDefendPick3 is disabled', () => {
      const engine = new GameEngine({ allowDefendPick3: false });
      engine.initGame(['Alice', 'Bob'], 2);
      const p5 = addCardToHand(engine, 0, 5, engine.currentSymbol);
      engine.playCard(p5, 0);
      const defenseCard = addCardToHand(engine, 1, 5, 'circle');
      expect(engine.canPlayCard(defenseCard, 1).valid).toBe(false);
    });
  });

  describe('Whot Deck Properties', () => {
    it('deck has exactly 5 Whot cards', () => {
      const deck = new WhotDeck();
      deck.createDeck();
      const whots = deck.cards.filter(c => c.value === 20);
      expect(whots).toHaveLength(5);
    });

    it('Whot cards have correct properties', () => {
      const deck = new WhotDeck();
      deck.createDeck();
      const whot = deck.cards.find(c => c.value === 20);
      expect(whot.specialType).toBe('whot');
      expect(whot.isSpecial).toBe(true);
      expect(whot.value).toBe(20);
    });

    it('deck has special cards of each type', () => {
      const deck = new WhotDeck();
      deck.createDeck();
      expect(deck.cards.filter(c => c.specialType === 'hold').length).toBeGreaterThan(0);
      expect(deck.cards.filter(c => c.specialType === 'pick2').length).toBeGreaterThan(0);
      expect(deck.cards.filter(c => c.specialType === 'pick3').length).toBeGreaterThan(0);
      expect(deck.cards.filter(c => c.specialType === 'suspension').length).toBeGreaterThan(0);
      expect(deck.cards.filter(c => c.specialType === 'generalMarket').length).toBeGreaterThan(0);
    });
  });

  describe('Deck Reshuffle', () => {
    it('draws all cards then reshuffles from discard', () => {
      const deck = new WhotDeck();
      deck.createDeck();
      deck.shuffle();
      const total = deck.cards.length;
      for (let i = 0; i < total - 1; i++) {
        const card = deck.drawCard();
        if (card) {
          deck.playCard(card);
          deck.discardPile.push(card);
          deck.cards.pop();
        }
      }
      deck.cards = [];
      const reshuffled = deck.drawCard();
      expect(reshuffled).not.toBeNull();
    });
  });

  describe('Multiplayer Turn Order', () => {
    it('cycles through 4 players in order', () => {
      const engine = makeGame(['A', 'B', 'C', 'D'], 1);
      const sym = engine.currentSymbol;
      const turns = [];
      for (let i = 0; i < 4; i++) {
        const playerId = engine.currentTurn;
        const card = addCardToHand(engine, playerId, 4, sym);
        const result = engine.playCard(card, playerId);
        expect(result.success).toBe(true);
        expect(result.gameOver).toBe(false);
        turns.push(engine.currentTurn);
      }
      expect(turns[0]).toBe(1);
      expect(turns[1]).toBe(2);
      expect(turns[2]).toBe(3);
      expect(turns[3]).toBe(0);
    });
  });

  describe('Configurable Game Rules', () => {
    it('deals the configured number of starting cards', () => {
      const engine = new GameEngine({ startingCards: 3 });
      engine.initGame(['Alice', 'Bob']);
      expect(engine.players[0].cardCount).toBe(3);
      expect(engine.players[1].cardCount).toBe(3);
    });

    it('uses the startingCards default of 5 when no rules are given', () => {
      const engine = makeGame(['Alice', 'Bob']);
      expect(engine.players[0].cardCount).toBe(5);
    });

    it('does not apply pick 2 penalty when enablePick2 is disabled', () => {
      const engine = new GameEngine({ enablePick2: false });
      engine.initGame(['Alice', 'Bob'], 2);
      const p2 = addCardToHand(engine, 0, 2, engine.currentSymbol);
      const result = engine.playCard(p2, 0);
      expect(result.success).toBe(true);
      expect(engine.drawPenalty).toBe(0);
    });

    it('does not apply pick 3 penalty when enablePick3 is disabled', () => {
      const engine = new GameEngine({ enablePick3: false });
      engine.initGame(['Alice', 'Bob'], 2);
      const p5 = addCardToHand(engine, 0, 5, engine.currentSymbol);
      const result = engine.playCard(p5, 0);
      expect(result.success).toBe(true);
      expect(engine.drawPenalty).toBe(0);
    });

    it('does not repeat turn for hold on when enableHoldOn is disabled', () => {
      const engine = new GameEngine({ enableHoldOn: false });
      engine.initGame(['Alice', 'Bob'], 2);
      const hold = addCardToHand(engine, 0, 1, engine.currentSymbol);
      const result = engine.playCard(hold, 0);
      expect(result.success).toBe(true);
      expect(engine.currentTurn).toBe(1);
    });

    it('does not skip next player when enableSuspension is disabled', () => {
      const engine = new GameEngine({ enableSuspension: false });
      engine.initGame(['Alice', 'Bob', 'Charlie'], 2);
      const sCard = addCardToHand(engine, 0, 8, engine.currentSymbol);
      const result = engine.playCard(sCard, 0);
      expect(result.success).toBe(true);
      expect(engine.currentTurn).toBe(1);
    });

    it('does not apply general market penalty when enableGeneralMarket is disabled', () => {
      const engine = new GameEngine({ enableGeneralMarket: false });
      engine.initGame(['Alice', 'Bob', 'Charlie'], 2);
      const gmCard = addCardToHand(engine, 0, 14, engine.currentSymbol);
      const result = engine.playCard(gmCard, 0);
      expect(result.success).toBe(true);
      expect(engine.drawPenalty).toBe(0);
    });

    it('allows playing multiple matching-value cards when allowMultiPlay is enabled', () => {
      const engine = new GameEngine({ allowMultiPlay: true });
      engine.initGame(['Alice', 'Bob'], 2);
      const topCard = engine.deck.getTopCard();
      const card1 = addCardToHand(engine, 0, topCard.value, engine.currentSymbol);
      const result1 = engine.playCard(card1, 0);
      expect(result1.success).toBe(true);
      expect(engine.currentTurn).toBe(0);

      const card2 = addCardToHand(engine, 0, topCard.value, 'circle');
      const result2 = engine.playCard(card2, 0);
      expect(result2.success).toBe(true);
      expect(engine.currentTurn).toBe(0);

      const otherValue = [3, 7, 11].find(v => v !== topCard.value);
      const card3 = addCardToHand(engine, 0, otherValue, engine.currentSymbol);
      const result3 = engine.playCard(card3, 0);
      expect(result3.success).toBe(true);
      expect(engine.currentTurn).toBe(1);
    });

    it('does not repeat turn when allowMultiPlay is disabled', () => {
      const engine = new GameEngine({ allowMultiPlay: false });
      engine.initGame(['Alice', 'Bob'], 2);
      const sym = engine.currentSymbol;
      const card1 = addCardToHand(engine, 0, 4, sym);
      const result1 = engine.playCard(card1, 0);
      expect(result1.success).toBe(true);
      expect(engine.currentTurn).toBe(1);
    });

    it('keeps Whot card always playable when whotCardPower is full', () => {
      const engine = new GameEngine({ whotCardPower: 'full' });
      engine.initGame(['Alice', 'Bob'], 2);
      const whot = addCardToHand(engine, 0, 20, 'whot');
      expect(engine.canPlayCard(whot, 0).valid).toBe(true);
    });

    it('does not allow playing Whot card when whotCardPower is off', () => {
      const engine = new GameEngine({ whotCardPower: 'off' });
      engine.initGame(['Alice', 'Bob'], 2);
      const whot = addCardToHand(engine, 0, 20, 'whot');
      expect(engine.canPlayCard(whot, 0).valid).toBe(false);
    });

    it('requires a match to play Whot card when whotCardPower is limited', () => {
      const engine = new GameEngine({ whotCardPower: 'limited' });
      engine.initGame(['Alice', 'Bob'], 2);
      engine.deck.discardPile = [{ id: 'top-card', value: 7, symbol: 'star', symbolDisplay: '★', name: '7', isSpecial: false, specialType: null }];
      engine.currentSymbol = 'star';
      const whot = addCardToHand(engine, 0, 20, 'whot');
      expect(engine.canPlayCard(whot, 0).valid).toBe(false);
    });

    it('exposes rules through exportState and restores them on importState', () => {
      const engine = new GameEngine({ startingCards: 3, allowMultiPlay: true });
      engine.initGame(['Alice', 'Bob'], 3);
      const state = engine.exportState();
      expect(state.rules.startingCards).toBe(3);
      expect(state.rules.allowMultiPlay).toBe(true);

      const restored = new GameEngine();
      restored.importState(state);
      expect(restored.rules.startingCards).toBe(3);
      expect(restored.rules.allowMultiPlay).toBe(true);
    });
  });
});
