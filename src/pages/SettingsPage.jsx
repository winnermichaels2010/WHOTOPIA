import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { updateUserProfile } from '../firebase/services/firestoreService';
import {
  FaCog,
  FaCheck,
  FaUndo,
  FaGamepad,
  FaLayerGroup,
  FaShieldAlt,
  FaVolumeUp,
  FaInfoCircle,
  FaUser,
  FaSave,
} from 'react-icons/fa';
import './SettingsPage.css';

const DEFAULT_SETTINGS = {
  startingCards: 5,
  stackingPenalties: true,
  allowMultiPlay: false,
  aiDifficulty: 'medium',
  botName: 'Computer',
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

const ANIME_AVATARS = [
  { id: 'anime1', label: 'Sakura', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=anime1&backgroundColor=b6e3f4' },
  { id: 'anime2', label: 'Luna', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=anime2&backgroundColor=ffd5dc' },
  { id: 'anime3', label: 'Hana', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=anime3&backgroundColor=c0aede' },
  { id: 'anime4', label: 'Yuki', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=anime4&backgroundColor=d1d4f9' },
  { id: 'anime5', label: 'Mika', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=anime5&backgroundColor=b6e3f4' },
  { id: 'anime6', label: 'Kai', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=anime6&backgroundColor=ffd5dc' },
  { id: 'anime7', label: 'Ryo', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=anime7&backgroundColor=c0aede' },
  { id: 'anime8', label: 'Sora', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=anime8&backgroundColor=d1d4f9' },
  { id: 'anime9', label: 'Ren', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=anime9&backgroundColor=b6e3f4' },
  { id: 'anime10', label: 'Niko', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=anime10&backgroundColor=ffd5dc' },
];

const SETTINGS_SECTIONS = [
  { id: 'profile', label: 'Profile', icon: FaUser },
  { id: 'game', label: 'Game Rules', icon: FaGamepad },
  { id: 'cards', label: 'Card Effects', icon: FaLayerGroup },
  { id: 'defense', label: 'Defense Rules', icon: FaShieldAlt },
  { id: 'display', label: 'Display & Audio', icon: FaVolumeUp },
];

const SettingsPage = () => {
  const { user, updateProfile } = useAuthContext();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [playerName, setPlayerName] = useState(user?.displayName || 'Player');
  const [playerNameSaved, setPlayerNameSaved] = useState(false);
  const [botName, setBotName] = useState('Computer');
  const [botNameSaved, setBotNameSaved] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('anime1');
  const [avatarSaved, setAvatarSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('whotopia_settings');
    if (stored) {
      try {
        const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        setSettings(parsed);
        setBotName(parsed.botName || 'Computer');
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (user) {
      setPlayerName(user.displayName || 'Player');
      const avatarId = ANIME_AVATARS.find(a => a.url === user.photoURL)?.id || 'anime1';
      setSelectedAvatar(avatarId);
    }
  }, [user]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const saveSettings = () => {
    localStorage.setItem('whotopia_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('whotopia_settings', JSON.stringify(DEFAULT_SETTINGS));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSavePlayerName = async () => {
    if (!playerName.trim()) return;
    try {
      await updateProfile({ displayName: playerName.trim() });
      if (user?.uid) {
        await updateUserProfile(user.uid, { displayName: playerName.trim() });
      }
      setPlayerNameSaved(true);
      setTimeout(() => setPlayerNameSaved(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleSaveBotName = () => {
    const updated = { ...settings, botName: botName.trim() || 'Computer' };
    setSettings(updated);
    localStorage.setItem('whotopia_settings', JSON.stringify(updated));
    setBotNameSaved(true);
    setTimeout(() => setBotNameSaved(false), 2500);
  };

  const handleSelectAvatar = async (avatarId) => {
    setSelectedAvatar(avatarId);
    const avatar = ANIME_AVATARS.find(a => a.id === avatarId);
    if (!avatar) return;
    try {
      await updateProfile({ photoURL: avatar.url });
      if (user?.uid) {
        await updateUserProfile(user.uid, { photoURL: avatar.url });
      }
      setAvatarSaved(true);
      setTimeout(() => setAvatarSaved(false), 2500);
    } catch {
      // ignore
    }
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

      {/* Profile */}
      {activeSection === 'profile' && (
        <div className="settings-card">
          <div className="settings-card-title">
            <FaUser />
            <h3>Profile</h3>
          </div>
          <p className="settings-card-desc">Manage your display name, bot name, and profile picture.</p>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Your Name</h4>
              <p>This is how other players will see you</p>
            </div>
            <div className="setting-control profile-control">
              <input
                type="text"
                className="profile-name-input"
                value={playerName}
                onChange={(e) => { setPlayerName(e.target.value); setPlayerNameSaved(false); }}
                maxLength={20}
                placeholder="Enter your name"
              />
              <button className="profile-save-btn" onClick={handleSavePlayerName}>
                <FaSave /> {playerNameSaved ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>

          <div className="setting-divider" />

          <div className="setting-item">
            <div className="setting-info">
              <h4>Bot Name</h4>
              <p>Customize the name of your AI opponent</p>
            </div>
            <div className="setting-control profile-control">
              <input
                type="text"
                className="profile-name-input"
                value={botName}
                onChange={(e) => { setBotName(e.target.value); setBotNameSaved(false); }}
                maxLength={20}
                placeholder="Enter bot name"
              />
              <button className="profile-save-btn" onClick={handleSaveBotName}>
                <FaSave /> {botNameSaved ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>

          <div className="setting-divider" />

          <div className="setting-item setting-item-col">
            <div className="setting-info">
              <h4>Profile Picture</h4>
              <p>Choose an anime avatar as your profile picture</p>
              {avatarSaved && <span className="profile-avatar-saved">Avatar updated!</span>}
            </div>
            <div className="profile-avatar-grid">
              {ANIME_AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  className={`profile-avatar-option ${selectedAvatar === avatar.id ? 'selected' : ''}`}
                  onClick={() => handleSelectAvatar(avatar.id)}
                  title={avatar.label}
                >
                  <img src={avatar.url} alt={avatar.label} />
                  <span className="profile-avatar-label">{avatar.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
              <h4>Allow Defending Penalties</h4>
              <p>Allow Pick 2 and Pick 3 cards to be defended by playing the same card (blocks the penalty)</p>
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
    </div>
  );
};

export default SettingsPage;
