import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import './DialogsPage.css'

const dummyDialogs = [
  { id: '1', name: 'CardShark42', lastMsg: 'Good game! Want a rematch?', time: '2m', unread: 3 },
  { id: '2', name: 'WhotMaster', lastMsg: 'Nice play with the 14s', time: '1h', unread: 0 },
  { id: '3', name: 'AcePlayer', lastMsg: 'I knew you had the 20!', time: '3h', unread: 1 },
  { id: '4', name: 'KingOfWhot', lastMsg: 'Let me know when you want to play again', time: '1d', unread: 0 },
  { id: '5', name: 'QueenBee', lastMsg: 'Thanks for the game!', time: '2d', unread: 0 },
]

const colors = ['#e63946', '#f72585', '#FF9800', '#2196F3', '#4CAF50', '#9C27B0']

function getInitials(name) {
  return name.slice(0, 2).toUpperCase()
}

function getColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function DialogsPage() {
  const { user, loading } = useAuthContext()
  const navigate = useNavigate()
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')

  if (loading) return <LoadingSpinner />

  const filtered = user
    ? dummyDialogs.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase())
      )
    : []

  function handleStartDialog() {
    setShowNew(false)
    setSearch('')
  }

  return (
    <div className="dialogs-page">
      <div className="dialogs-header">
        <h1>Messages</h1>
        <button className="dialogs-new-btn" onClick={() => setShowNew(true)}>
          + New Message
        </button>
      </div>

      {filtered.length > 0 ? (
        <div className="dialogs-list">
          {filtered.map(dialog => (
            <div
              key={dialog.id}
              className="dialog-item"
              onClick={() => navigate(`/dialogs/${dialog.id}`)}
            >
              <div
                className="dialog-avatar"
                style={{ background: getColor(dialog.name) }}
              >
                {getInitials(dialog.name)}
              </div>
              <div className="dialog-info">
                <div className="dialog-name">{dialog.name}</div>
                <div className="dialog-last-msg">{dialog.lastMsg}</div>
              </div>
              <div className="dialog-meta">
                <span className="dialog-time">{dialog.time}</span>
                {dialog.unread > 0 && (
                  <span className="dialog-unread">{dialog.unread}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dialogs-empty">
          <div className="dialogs-empty-icon">💬</div>
          <h3>No messages yet</h3>
          <p>Start a conversation with another player</p>
        </div>
      )}

      {showNew && (
        <div className="dialog-modal-overlay" onClick={() => setShowNew(false)}>
          <div className="dialog-modal" onClick={e => e.stopPropagation()}>
            <h2>New Message</h2>
            <p>Enter a player's name to start a conversation</p>
            <input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <div className="dialog-modal-actions">
              <button className="dialog-btn-cancel" onClick={() => { setShowNew(false); setSearch('') }}>
                Cancel
              </button>
              <button
                className="dialog-btn-start"
                disabled={!search.trim()}
                onClick={handleStartDialog}
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
