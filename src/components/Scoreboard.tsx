import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import confetti from 'canvas-confetti';

const Scoreboard: React.FC = () => {
  const { state, dispatch, sendMessage, isConnected, reconnect } = useGame();

  useEffect(() => {
    // Trigger confetti when there's a winner
    if (state.winner) {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 }
      });
    }
  }, [state.winner]);

  const handleReset = () => {
    dispatch({ type: 'RESET_GAME' });
    sendMessage({
      type: 'GAME_RESET',
      payload: null,
    });
  };

  const handleStartGame = () => {
    // Send start game message
    sendMessage({
      type: 'GAME_RESET',
      payload: null,
    });
  };

  const handleReconnect = () => {
    reconnect();
  };

  // Get unique players (in case there are any duplicates)
  const uniquePlayers = state.players.reduce((acc, player) => {
    const existing = acc.find(p => p.name === player.name);
    if (!existing) {
      acc.push(player);
    } else {
      // Keep the player with more recent data (higher marked squares or more recent ID)
      if (player.markedSquares > existing.markedSquares || player.id > existing.id) {
        const index = acc.indexOf(existing);
        acc[index] = player;
      }
    }
    return acc;
  }, [] as typeof state.players);

  return (
    <div className="scoreboard">
      <div className="scoreboard-header">
        <h1>CGX Ice Breaker Bingo - Scoreboard</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          {!isConnected && (
            <button onClick={handleReconnect} className="reconnect-button">
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Debug Information Section */}
      <div className="debug-section" style={{ 
        background: '#f0f0f0', 
        padding: '15px', 
        margin: '10px 0', 
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>🔧 Debug Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div>
            <strong>WebSocket Status:</strong><br />
            Connected: {isConnected ? '✅ YES' : '❌ NO'}<br />
            URL: ws://localhost:8080
          </div>
          <div>
            <strong>Game State:</strong><br />
            Winner: {state.winner ? `🏆 ${state.winner}` : '❌ None'}<br />
            Game Started: {state.gameStarted ? '✅ YES' : '❌ NO'}
          </div>
          <div>
            <strong>Players Data:</strong><br />
            Total Connections: {state.players.length}<br />
            Unique Players: {uniquePlayers.length}<br />
            Players with BINGO: {uniquePlayers.filter(p => p.hasBingo).length}
          </div>
          <div>
            <strong>Player Names:</strong><br />
            {uniquePlayers.length > 0 ? uniquePlayers.map(p => p.name).join(', ') : 'None'}
          </div>
        </div>
        {state.winner && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#e8f5e8', borderRadius: '4px' }}>
            <strong>🎉 WINNER DETECTED:</strong> {state.winner}
          </div>
        )}
      </div>

      <div className="host-controls">
        <button 
          onClick={handleStartGame} 
          className="start-button"
          disabled={!isConnected}
        >
          Start New Game
        </button>
        <button 
          onClick={handleReset} 
          className="reset-button"
          disabled={!isConnected}
        >
          Reset Game
        </button>
      </div>

      {!isConnected && (
        <div className="connection-warning">
          <h3>⚠️ Connection Lost</h3>
          <p>The WebSocket connection to the server has been lost. Real-time updates are disabled.</p>
          <p>Please check that the WebSocket server is running on port 8080 and click "Reconnect".</p>
        </div>
      )}

      {state.winner && (
        <div className="winner-announcement">
          <h2>🎉 BINGO! 🎉</h2>
          <p>{state.winner} is the winner!</p>
        </div>
      )}

      <div className="players-section">
        <h2>Players ({uniquePlayers.length})</h2>
        {state.players.length !== uniquePlayers.length && (
          <div className="duplicate-warning">
            <p>⚠️ Detected {state.players.length - uniquePlayers.length} duplicate player entries. Showing unique players only.</p>
          </div>
        )}
        {uniquePlayers.length === 0 ? (
          <p className="no-players">No players connected yet...</p>
        ) : (
          <div className="players-grid">
            {uniquePlayers.map((player) => (
              <div 
                key={`${player.name}-${player.id}`} 
                className={`player-card ${player.hasBingo ? 'winner' : ''}`}
              >
                <div className="player-header">
                  <h3 className="player-name">{player.name}</h3>
                  {player.hasBingo && <span className="bingo-badge">BINGO!</span>}
                </div>
                
                <div className="player-stats">
                  <div className="stat">
                    <span className="stat-label">Marked Squares:</span>
                    <span className="stat-value">{player.markedSquares}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Player ID:</span>
                    <span className="stat-value">{player.id}</span>
                  </div>
                </div>

                <div className="player-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(player.markedSquares / 25) * 100}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {Math.round((player.markedSquares / 25) * 100)}% Complete
                  </span>
                </div>

                {player.bingoCard && (
                  <div className="mini-bingo-card">
                    {player.bingoCard.slice(0, 25).map((square, index) => (
                      <div 
                        key={square.id}
                        className={`mini-square ${square.isMarked ? 'marked' : ''}`}
                        title={square.prompt}
                      >
                        {square.isMarked ? '✓' : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="game-stats">
        <h2>Game Statistics</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">{uniquePlayers.length}</span>
            <span className="stat-label">Unique Players</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{state.players.length}</span>
            <span className="stat-label">Total Connections</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {uniquePlayers.reduce((sum, player) => sum + player.markedSquares, 0)}
            </span>
            <span className="stat-label">Total Squares Marked</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {uniquePlayers.filter(player => player.hasBingo).length}
            </span>
            <span className="stat-label">Winners</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;