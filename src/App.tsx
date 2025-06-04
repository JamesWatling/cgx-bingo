import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NameEntry from './components/NameEntry';
import BingoGame from './components/BingoGame';
import Scoreboard from './components/Scoreboard';
import { GameProvider } from './context/GameContext';
import './styles/theme.css';
import './styles/animations.css';

const App = () => {
  const [playerName, setPlayerName] = useState<string>('');

  useEffect(() => {
    // Check if player name is stored in localStorage
    const storedName = localStorage.getItem('playerName');
    if (storedName) {
      setPlayerName(storedName);
    }
  }, []);

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('playerName', name);
  };

  return (
    <GameProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route 
              path="/" 
              element={
                playerName ? (
                  <BingoGame playerName={playerName} />
                ) : (
                  <NameEntry onNameSubmit={handleNameSubmit} />
                )
              } 
            />
            <Route path="/scoreboard" element={<Scoreboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </GameProvider>
  );
};

export default App;