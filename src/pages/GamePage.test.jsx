import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GamePage from './GamePage.jsx';
import AuthContext from '../context/AuthContext.jsx';

const stateListeners = {};
let writtenState = null;
const fireGameListener = (snapshot) => {
  Object.values(stateListeners).forEach((cb) => cb(snapshot));
};

vi.mock('firebase/database', () => ({
  ref: vi.fn(() => ({})),
  getDatabase: vi.fn(() => ({})),
  onDisconnect: vi.fn(() => ({ remove: vi.fn(), transaction: vi.fn(), cancel: vi.fn() })),
}));

vi.mock('../firebase/services/realtimeDBService.js', () => ({
  onGameStateChange: vi.fn((roomId, cb) => {
    stateListeners[roomId] = cb;
    return () => { delete stateListeners[roomId]; };
  }),
  setGameState: vi.fn(async (_roomId, state) => { writtenState = state; }),
  getGameState: vi.fn(async () => ({ exists: () => !!writtenState, val: () => writtenState })),
  getGameRoom: vi.fn(async () => ({
    exists: () => true,
    val: () => ({
      players: {
        u1: { displayName: 'Host', isHost: true },
        u2: { displayName: 'Opponent', isHost: false },
      },
    }),
  })),
  onRoomPlayersChange: vi.fn(() => () => {}),
  onGameRoomChange: vi.fn(() => () => {}),
  onNewChatMessage: vi.fn(() => () => {}),
  onChatMessages: vi.fn(() => () => {}),
  realtimeDB: {},
}));

vi.mock('../firebase/services/firestoreService.js', () => ({
  recordMatch: vi.fn(async () => {}),
}));

const renderOnline = (initialEntry, state) => {
  return render(
    <AuthContext.Provider value={{ user: { uid: 'u1', displayName: 'Host' }, loading: false }}>
      <MemoryRouter initialEntries={[{ pathname: initialEntry, state }]}>
        <Routes>
          <Route path="/play/online/:roomId" element={<GamePage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

beforeEach(() => {
  writtenState = null;
  Object.keys(stateListeners).forEach((k) => delete stateListeners[k]);
  vi.clearAllMocks();
});

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe('GamePage online mode', () => {
  it('renders the game board for the host after starting a game (not blank)', async () => {
    renderOnline('/play/online/ABC', { isHost: true, playerIndex: 0 });

    fireGameListener({ exists: () => false, val: () => null });

    await waitFor(() => {
      expect(writtenState).not.toBeNull();
    });

    fireGameListener({ exists: () => true, val: () => writtenState });

    await waitFor(() => {
      expect(screen.getByText(/left/)).toBeTruthy();
    }, { timeout: 3000 });

    const drawCount = document.querySelector('.draw-count');
    expect(drawCount).not.toBeNull();
    expect(drawCount.textContent).toMatch(/\d+ left/);
    expect(screen.queryByText(/Waiting for opponent/)).toBeNull();
  });
});
