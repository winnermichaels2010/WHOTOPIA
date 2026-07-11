import Card from './Card';
import './CardAnimation.css';

const CardAnimationLayer = ({ animations, onRemove }) => {
  if (!animations || animations.length === 0) return null;

  return (
    <div className="card-animation-layer">
      {animations.map((anim) => (
        <div
          key={anim.id}
          className={`flying-card ${anim.type === 'draw' ? 'draw-anim' : 'play-anim'}`}
          style={{
            '--sx': `${anim.startX}px`,
            '--sy': `${anim.startY}px`,
            '--ex': `${anim.endX}px`,
            '--ey': `${anim.endY}px`,
          }}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) {
              onRemove(anim.id);
            }
          }}
        >
          {anim.faceDown ? (
            <div
              className="flying-card-back"
              style={{ width: anim.width, height: anim.height }}
            />
          ) : (
            <div
              className="flying-card-face"
              style={{ width: anim.width, height: anim.height }}
            >
              <Card card={anim.card} disabled small={anim.small} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CardAnimationLayer;
