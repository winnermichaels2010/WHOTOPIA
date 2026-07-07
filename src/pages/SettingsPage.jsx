import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { FaCog, FaCheck, FaUndo, FaTrashAlt, FaExclamationTriangle } from 'react-icons/fa';
import './SettingsPage.css';

const DEFAULT_SETTINGS = {
  startingCards: 5,
  stackingPenalties: true,
  allowMultiPlay: false,
  aiDifficulty: 'medium',
};

const SettingsPage = () => {
  const { deleteAccount } = useAuthContext();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('whotopia_settings');
    if (stored) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch {}
    }
  }, []);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const saveSettings = () => {
    localStorage.setItem('whotopia_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <FaCog className="settings-header-icon" />
        <h1>Game Settings</h1>
        <p>Configure your default playing rules</p>
      </div>

      <div className="settings-card">
        <div className="setting-item">
          <div className="setting-info">
            <h3>Starting Cards</h3>
            <p>Number of cards each player receives at the start</p>
          </div>
          <div className="setting-control">
            <select
              value={settings.startingCards}
              onChange={(e) => updateSetting('startingCards', Number(e.target.value))}
            >
              <option value={3}>3 cards</option>
              <option value={5}>5 cards</option>
              <option value={7}>7 cards</option>
            </select>
          </div>
        </div>

        <div className="setting-divider" />

        <div className="setting-item">
          <div className="setting-info">
            <h3>Stack Penalties</h3>
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
            <h3>Allow Multi-Play</h3>
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
            <h3>AI Difficulty</h3>
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
