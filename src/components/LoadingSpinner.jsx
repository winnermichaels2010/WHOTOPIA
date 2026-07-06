import './LoadingSpinner.css';

const LoadingSpinner = ({ text = 'Loading...' }) => (
  <div className="loading-container">
    <div className="w-spinner">
      <svg viewBox="0 0 120 80" className="w-svg">
        <line
          className="w-stroke w-stroke-1"
          x1="10" y1="10"
          x2="35" y2="70"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <line
          className="w-stroke w-stroke-2"
          x1="35" y1="70"
          x2="60" y2="10"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <line
          className="w-stroke w-stroke-3"
          x1="60" y1="10"
          x2="85" y2="70"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <line
          className="w-stroke w-stroke-4"
          x1="85" y1="70"
          x2="110" y2="10"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
    </div>
    <p className="loading-text">{text}</p>
  </div>
);

export default LoadingSpinner;
