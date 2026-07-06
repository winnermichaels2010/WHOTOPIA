import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/play/online/:roomId"
              element={
                <ProtectedRoute>
                  <GamePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/play/:mode"
              element={
                <ProtectedRoute>
                  <GamePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/*"
              element={
                <Sidebar>
                  <Routes>
                    <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
                      <Route
                        path="/home"
                        element={
                          <ProtectedRoute>
                            <HomePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/lobby"
                        element={
                          <ProtectedRoute>
                            <LobbyPage />
                          </ProtectedRoute>
                        }
                      />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Sidebar>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;