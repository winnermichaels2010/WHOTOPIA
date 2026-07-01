import { FaUser } from 'react-icons/fa';

const OpponentArea = ({ players, currentPlayerId, currentTurn }) => {
  return (
    <div className="opponent-area">
      {players
        .filter(p => p.id !== currentPlayerId)
        .map((player) => (
          <div
            key={player.id}
            className={`opponent-card ${player.isCurrentTurn ? 'active-turn' : ''}`}
          >
            <div className="opponent-avatar">
              <FaUser />
            </div>
            <div className="opponent-info">
              <span className="opponent-name">{player.name}</span>
              <span className="opponent-cards">
                {player.cardCount} card{player.cardCount !== 1 ? 's' : ''}
              </span>
            </div>
            {player.isCurrentTurn && <div className="turn-indicator">●</div>}
          </div>
        ))}
    </div>
  );
};

export default OpponentArea;