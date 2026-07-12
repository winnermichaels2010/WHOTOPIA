import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import {
  FaCog,
  FaCheck,
  FaUndo,
  FaTrashAlt,
  FaExclamationTriangle,
  FaGamepad,
  FaLayerGroup,
  FaShieldAlt,
  FaVolumeUp,
  FaInfoCircle,
} from 'react-icons/fa';
import './SettingsPage.css';

const DEFAULT_SETTINGS = {
  startingCards: 5,
  stackingPenalties: true,
  allowMultiPlay: false,
  aiDifficulty: 'medium',
  enablePick2: true,
  enablePick3: true,
  enableSuspension: true,
  enableHoldOn: true,
  enableGeneralMarket: true,
  allowDefendPick2: true,
  allowDefendPick3: true,
  whotCardPower: 'full',
  enableSoundEffects: true,
  enableAnimations: true,
  showCardHints: true,
  autoPlaySingleMatch: false,
  theme: 'system',
};

const SETTINGS_SECTIONS = [
  { id: 'game', label: 'Game Rules', icon: FaGamepad },
  { id: 'cards', label: 'Card Effects', icon: FaLayerGroup },
  { id: 'defense', label: 'Defense Rules', icon: FaShieldAlt },
  { id: 'display', label: 'Display & Audio', icon: FaVolumeUp },
];

const SettingsPage = () => {
  const { deleteAccount } = useAuthContext();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeSection, setActiveSection] = useState('game');

  useEffect(() => {
    const stored = localStorage.getItem('whotopia_settings');
    if (stored) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch { /* ignore */ }
    }
  }, []);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const saveSettings = () => {
    localStorage.setItem('whotopia_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const result = await deleteAccount();
    if (result.success) {
      navigate('/login');
    }
    setDeleting(false);
    setShowDeleteConfirm(false);
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('whotopia_settings', JSON.stringify(DEFAULT_SETTINGS));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div className="settings-header-icon-wrap">
          <FaCog className="settings-header-icon" />
        </div>
        <div>
          <h1>Settings</h1>
          <p>Configure your game rules and preferences</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="settings-tabs">
        {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`settings-tab ${activeSection === id ? 'active' : ''}`}
            onClick={() => setActiveSection(id)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Game Rules */}
      {activeSection === 'game' && (
        <div className="settings-card">
          <div className="settings-card-title">
            <FaGamepad />
            <h3>Game Rules</h3>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Starting Cards</h4>
              <p>Number of cards each player receives at the start</p>
            </div>
            <div className="setting-control">
              <div className="setting-stepper">
                <button
                  className="stepper-btn"
                  onClick={() => updateSetting('startingCards', Math.max(3, settings.startingCards - 2))}
                  disabled={settings.startingCards <= 3}
                >
                  −
                </button>
                <span className="stepper-value">{settings.startingCards}</span>
                <button
                  className="stepper-btn"
                  onClick={() => updateSetting('startingCards', Math.min(15, settings.startingCards + 2))}
                  disabled={settings.startingCards >= 15}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="setting-divider" />

          <div className="setting-item">
            <div className="setting-info">
              <h4>Stack Penalties</h4>
              <p>Allow Pick 2 and Pick 3 cards to stack on top of each other</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.stackingPenalties}
                  onChange={(e) => updateSetting('stackingPenalties', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-divider" />

          <div className="setting-item">
            <div className="setting-info">
              <h4>Allow Multi-Play</h4>
              <p>Allow playing multiple matching cards in one turn (same value)</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.allowMultiPlay}
                  onChange={(e) => updateSetting('allowMultiPlay', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-divider" />

          <div className="setting-item">
            <div className="setting-info">
              <h4>Whot Card Power</h4>
              <p>Control what the special Whot (20) card can do</p>
            </div>
            <div className="setting-control">
              <select
                value={settings.whotCardPower}
                onChange={(e) => updateSetting('whotCardPower', e.target.value)}
              >
                <option value="full">Full Power</option>
                <option value="limited">Limited (No penalty)</option>
                <option value="off">Disabled</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Card Effects */}
      {activeSection === 'cards' && (
        <div className="settings-card">
          <div className="settings-card-title">
            <FaLayerGroup />
            <h3>Card Effects</h3>
          </div>
          <p className="settings-card-desc">Enable or disable specific card special effects in your games.</p>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Pick 2</h4>
              <p>Next player draws 2 cards when this is played</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.enablePick2}
                  onChange={(e) => updateSetting('enablePick2', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-divider" />

          <div className="setting-item">
            <div className="setting-info">
              <h4>Pick 3</h4>
              <p>Next player draws 3 cards when this is played</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.enablePick3}
                  onChange={(e) => updateSetting('enablePick3', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-divider" />

          <div className="setting-item">
            <div className="setting-info">
              <h4>Suspension</h4>
              <p>Skip the next player&apos;s turn</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.enableSuspension}
                  onChange={(e) => updateSetting('enableSuspension', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-divider" />

          <div className="setting-item">
            <div className="setting-info">
              <h4>Hold On</h4>
              <p>Same player plays again</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.enableHoldOn}
                  onChange={(e) => updateSetting('enableHoldOn', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-divider" />

          <div className="setting-item">
            <div className="setting-info">
              <h4>General Market</h4>
              <p>Next player draws 1 extra card</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.enableGeneralMarket}
                  onChange={(e) => updateSetting('enableGeneralMarket', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Defense Rules */}
      {activeSection === 'defense' && (
        <div className="settings-card">
          <div className="settings-card-title">
            <FaShieldAlt />
            <h3>Defense Rules</h3>
          </div>
          <p className="settings-card-desc">Configure whether players can defend against penalty cards.</p>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Defend Pick 2</h4>
              <p>Allow playing another Pick 2 on top to pass the penalty forward</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.allowDefendPick2}
                  onChange={(e) => updateSetting('allowDefendPick2', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-divider" />

          <div className="setting-item">
            <div className="setting-info">
              <h4>Defend Pick 3</h4>
              <p>Allow playing another Pick 3 on top to pass the penalty forward</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.allowDefendPick3}
                  onChange={(e) => updateSetting('allowDefendPick3', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Display & Audio */}
      {activeSection === 'display' && (
        <div className="settings-card">
          <div className="settings-card-title">
            <FaVolumeUp />
            <h3>Display & Audio</h3>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>AI Difficulty</h4>
              <p>Default difficulty when playing against the computer</p>
            </div>
            <div className="setting-control">
              <select
                value={settings.aiDifficulty}
                onChange={(e) => updateSetting('aiDifficulty', e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="setting-divider" />

          <div className="setting-item">
            <div className="setting-info">
              <h4>Sound Effects</h4>
              <p>Play sounds during card plays and game events</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.enableSoundEffects}
                  onChange={(e) => updateSetting('enableSoundEffects', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-divider" />

          <div className="setting-item">
            <div className="setting-info">
              <h4>Animations</h4>
              <p>Enable card animations and transitions</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.enableAnimations}
                  onChange={(e) => updateSetting('enableAnimations', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-divider" />

          <div className="setting-item">
            <div className="setting-info">
              <h4>Show Card Hints</h4>
              <p>Highlight playable cards during your turn</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.showCardHints}
                  onChange={(e) => updateSetting('showCardHints', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-divider" />

          <div className="setting-item">
            <div className="setting-info">
              <h4>Auto-Play Next Match</h4>
              <p>Automatically start a new game after finishing one</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.autoPlaySingleMatch}
                  onChange={(e) => updateSetting('autoPlaySingleMatch', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="settings-info-bar">
        <FaInfoCircle />
        <span>Settings are saved locally on this device and apply to all games.</span>
      </div>

      <div className="settings-actions">
        <button className="settings-btn primary" onClick={saveSettings}>
          <FaCheck /> {saved ? 'Saved!' : 'Save Settings'}
        </button>
        <button className="settings-btn secondary" onClick={resetSettings}>
          <FaUndo /> Reset to Defaults
        </button>
      </div>

      <div className="settings-divider-large" />

      <div className="settings-danger-zone">
        <div className="danger-zone-header">
          <FaExclamationTriangle className="danger-icon" />
          <h2>Danger Zone</h2>
        </div>
        <p>Once you delete your account, there is no going back. All your data will be permanently removed.</p>

        {!showDeleteConfirm ? (
          <button
            className="settings-btn danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <FaTrashAlt /> Delete My Account
          </button>
        ) : (
          <div className="delete-confirm">
            <p className="delete-warning">Are you absolutely sure? This action cannot be undone.</p>
            <div className="delete-actions">
              <button
                className="settings-btn danger"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
              <button
                className="settings-btn secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
