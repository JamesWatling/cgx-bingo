import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import BackgroundEffects from './BackgroundEffects';
import confetti from 'canvas-confetti';
import { playButtonClick, playSuccess, soundEffects } from '../utils/soundEffects';

const Scoreboard: React.FC = () => {
  const { state, dispatch, sendMessage, isConnected, reconnect, requestCurrentState } = useGame();
  const lastStateRequestRef = useRef<number>(0);

  useEffect(() => {
    // Initialize sound system
    soundEffects.setEnabled(state.soundEnabled);
  }, [state.soundEnabled]);

  useEffect(() => {
    // Request current state when scoreboard mounts, but throttle to max once every 2 seconds
    if (isConnected) {
      const now = Date.now();
      const timeSinceLastRequest = now - lastStateRequestRef.current;
      
      if (timeSinceLastRequest >= 2000) { // 2 seconds throttle
        console.log('📋 Scoreboard mounted - requesting current state...');
        requestCurrentState();
        lastStateRequestRef.current = now;
      } else {
        console.log('📋 Scoreboard mount - throttling state request (last request was', Math.round(timeSinceLastRequest / 1000), 'seconds ago)');
      }
    }
  }, [isConnected]); // Remove requestCurrentState from dependencies to prevent infinite loop

  useEffect(() => {
    // Trigger confetti when there's a winner
    if (state.winner) {
      confetti({
        particleCount: 400,
        spread: 140,
        origin: { y: 0.6 },
        colors: ['#ff6b35', '#ffd700', '#00CC76', '#8DFF9D', '#ff4757'],
        ticks: 200
      });
    }
  }, [state.winner]);

  const handleReset = () => {
    if (state.soundEnabled) {
      playButtonClick();
    }
    
    dispatch({ type: 'RESET_GAME' });
    sendMessage({
      type: 'GAME_RESET',
      payload: null,
    });
    
    // Play success sound after a brief delay
    setTimeout(() => {
      if (state.soundEnabled) {
        playSuccess();
      }
    }, 300);
  };

  const handleStartGame = () => {
    if (state.soundEnabled) {
      playButtonClick();
    }
    
    // Send start game message
    sendMessage({
      type: 'GAME_RESET',
      payload: null,
    });
    
    // Play success sound after a brief delay
    setTimeout(() => {
      if (state.soundEnabled) {
        playSuccess();
      }
    }, 300);
  };

  const handleReconnect = () => {
    if (state.soundEnabled) {
      playButtonClick();
    }
    reconnect();
  };

  const handleRemoveAllUsers = () => {
    // Ask for confirmation before removing all users
    if (window.confirm('Are you sure you want to remove all users? This will make all connected players reload their pages and lose their current game progress.')) {
      console.log('🧹 Removing all users...');
      
      if (state.soundEnabled) {
        playButtonClick();
      }
      
      sendMessage({
        type: 'REMOVE_ALL_USERS',
        payload: null,
      });
      
      // Play success sound after a brief delay
      setTimeout(() => {
        if (state.soundEnabled) {
          playSuccess();
        }
      }, 300);
    }
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

  // Calculate hottest player (most recent activity)
  const hottestPlayer = uniquePlayers.length > 0 
    ? uniquePlayers.reduce((hottest, player) => 
        player.markedSquares > hottest.markedSquares ? player : hottest
      ) 
    : null;

  return (
    <div className="scoreboard">
      <BackgroundEffects />
      
      <div className="scoreboard-header">
        <div className="logo-container">
          <div className="logo-placeholder hover-magic">
            CGX
          </div>
          <div className="logo-text">CGX Bingo</div>
        </div>
        
        <h1 className="animate-fadeIn">CGX Ice Breaker Bingo - Scoreboard</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          {!isConnected && (
            <button onClick={handleReconnect} className="reconnect-button hover-magic">
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Debug Information Section */}
      {typeof window !== 'undefined' && (window as any).debug && (
        <div className="debug-section animate-slideInLeft" style={{ 
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
      )}

      <div className="host-controls animate-slideInRight">
        <button 
          onClick={handleStartGame} 
          className="start-button hover-magic"
          disabled={!isConnected}
        >
          🎮 Start New Game
        </button>
        <button 
          onClick={handleReset} 
          className="reset-button hover-magic"
          disabled={!isConnected}
        >
          🔄 Reset Game
        </button>
        <button 
          onClick={handleRemoveAllUsers} 
          className="remove-all-users-button hover-magic"
          disabled={!isConnected}
        >
          🧹 Remove All Users
        </button>
      </div>

      {!isConnected && (
        <div className="connection-warning animate-bounceIn">
          <div className="loading-container">
            <img 
              src="/images/loading.gif" 
              alt="Loading..." 
              className="loading-image"
              style={{ width: '250px', height: '250px' }}
            />
            <h3>🔄 Connecting to Server...</h3>
            <p>Attempting to connect to the WebSocket server.</p>
            <p>Please ensure the WebSocket server is running on port 8080.</p>
            <button onClick={handleReconnect} className="reconnect-button hover-magic">
              Try Again
            </button>
          </div>
        </div>
      )}

      {state.winner && (
        <div className="winner-announcement mega-celebration animate-bounceIn">
          <h2>🎉 BINGO! 🎉</h2>
          <p>{state.winner} is the winner!</p>
        </div>
      )}

      <div className="players-section animate-fadeIn">
        <h2>Players ({uniquePlayers.length})</h2>
        {state.players.length !== uniquePlayers.length && (
          <div className="duplicate-warning animate-shake">
            <p>⚠️ Detected {state.players.length - uniquePlayers.length} duplicate player entries. Showing unique players only.</p>
          </div>
        )}
        {uniquePlayers.length === 0 ? (
          <p className="no-players">No players connected yet...</p>
        ) : (
          <div className="players-grid">
            {uniquePlayers.map((player, index) => (
              <div 
                key={`${player.name}-${player.id}`} 
                className={`player-card hover-magic stagger-item ${player.hasBingo ? 'winner' : ''} ${hottestPlayer?.name === player.name && player.markedSquares > 0 ? 'hot-streak' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="player-header">
                  <h3 className="player-name">
                    {player.name}
                    {hottestPlayer?.name === player.name && player.markedSquares > 0 && (
                      <span style={{ marginLeft: '8px', fontSize: '1rem' }}>🔥</span>
                    )}
                  </h3>
                  {player.hasBingo && <span className="bingo-badge animate-pulse">BINGO!</span>}
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
                      style={{ 
                        width: `${(player.markedSquares / 25) * 100}%`,
                        transition: 'width 0.5s ease-in-out'
                      }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {Math.round((player.markedSquares / 25) * 100)}% Complete
                  </span>
                </div>

                {player.bingoCard && (
                  <div className="mini-bingo-card">
                    {player.bingoCard.slice(0, 25).map((square, squareIndex) => (
                      <div 
                        key={square.id}
                        className={`mini-square ${square.isMarked ? 'marked animate-zoomIn' : ''}`}
                        title={square.prompt}
                        style={{ animationDelay: `${squareIndex * 0.02}s` }}
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

      <div className="game-stats animate-slideInLeft">
        <h2>Game Statistics</h2>
        <div className="stats-grid">
          <div className="stat-item hover-magic stagger-item">
            <span className="stat-number animate-zoomIn">{uniquePlayers.length}</span>
            <span className="stat-label">Unique Players</span>
          </div>
          <div className="stat-item hover-magic stagger-item">
            <span className="stat-number animate-zoomIn">{state.players.length}</span>
            <span className="stat-label">Total Connections</span>
          </div>
          <div className="stat-item hover-magic stagger-item">
            <span className="stat-number animate-zoomIn">
              {uniquePlayers.reduce((sum, player) => sum + player.markedSquares, 0)}
            </span>
            <span className="stat-label">Total Squares Marked</span>
          </div>
          <div className="stat-item hover-magic stagger-item">
            <span className="stat-number animate-zoomIn">
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