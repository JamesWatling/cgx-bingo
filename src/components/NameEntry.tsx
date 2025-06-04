import React, { useState } from 'react';

interface NameEntryProps {
  onNameSubmit: (name: string) => void;
}

const NameEntry: React.FC<NameEntryProps> = ({ onNameSubmit }) => {
  const [playerName, setPlayerName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (playerName.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }

    if (playerName.trim().length > 20) {
      setError('Name must be 20 characters or less');
      return;
    }

    onNameSubmit(playerName.trim());
  };

  return (
    <div className="name-entry">
      <div className="name-entry-container">
        <h1 className="name-entry-title">CGX Ice Breaker Bingo</h1>
        <p className="name-entry-subtitle">Enter your name to get started!</p>
        
        <form onSubmit={handleSubmit} className="name-entry-form">
          <div className="name-input-container">
            <input
              type="text"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setError('');
              }}
              placeholder="Enter your name..."
              className="name-input"
              maxLength={20}
              autoFocus
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="start-button">
            Start Playing!
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameEntry; 