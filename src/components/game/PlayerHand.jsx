import Card from './Card';

const PlayerHand = ({ cards, onCardClick, disabled, validMoves }) => {
  if (!cards || cards.length === 0) {
    return (
      <div className="player-hand empty">
        <p className="hand-empty-text">No cards in hand</p>
      </div>
    );
  }

  return (
    <div className="player-hand">
      <div className="hand-cards">
        {cards.map((card) => {
          const isValid = validMoves?.some(c => c.id === card.id);
          return (
            <Card
              key={card.id}
              card={card}
              onClick={onCardClick}
              disabled={disabled || !isValid}
              small
            />
          );
        })}
      </div>
    </div>
  );
};

export default PlayerHand;