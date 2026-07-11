import './Card.css';

const SYMBOL_COLORS = {
  star: '#e63946',
  circle: '#c1121f',
  cross: '#8B4513',
  square: '#a0522d',
  triangle: '#d4a373',
  whot: '#ffd700',
};

const SPECIAL_LABELS = {
  hold: 'HOLD',
  pick2: 'PICK 2',
  pick3: 'PICK 3',
  suspension: 'SUSPEND',
  generalMarket: 'MARKET',
  whot: 'WHOT',
};

const Card = ({ card, onClick, selected, disabled, small }) => {
  if (!card) return null;

  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(card, e);
    }
  };

  const symbolColor = SYMBOL_COLORS[card.symbol] || '#e63946';
  const isWhot = card.value === 20;

  return (
    <div
      className={`game-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${small ? 'small' : ''} ${isWhot ? 'whot-card' : ''}`}
      onClick={handleClick}
    >
      <div className="card-face" style={{ borderColor: symbolColor }}>
        <div className="card-corner top-left">
          <span className="card-value">{card.value === 20 ? 'W' : card.value}</span>
          <span className="card-symbol-mini">{card.symbolDisplay}</span>
        </div>
        <div className="card-center">
          <span className="card-main-symbol" style={{ color: symbolColor }}>
            {card.symbolDisplay}
          </span>
          {card.isSpecial && (
            <span className="card-effect">
              {SPECIAL_LABELS[card.specialType] || ''}
            </span>
          )}
        </div>
        <div className="card-corner bottom-right">
          <span className="card-value">{card.value === 20 ? 'W' : card.value}</span>
          <span className="card-symbol-mini">{card.symbolDisplay}</span>
        </div>
      </div>
    </div>
  );
};

export default Card;