import Card from './Card';

const PlayerHand = ({ cards, onCardClick, disabled }) => {
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
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            onClick={onCardClick}
            disabled={disabled}
            small
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerHand;