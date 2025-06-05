import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import Modal from './Modal';
import BackgroundEffects from './BackgroundEffects';
import { BingoSquare, Question } from '../types';
import questionsData from '../data/questions.json';
import confetti from 'canvas-confetti';
import { 
  playSquareMark, 
  playBingo, 
  playNearBingo, 
  playFireEffect, 
  playStreakSound,
  playHover,
  playButtonClick,
  playAmbientChime,
  playEpicWinnerCelebration,
  soundEffects
} from '../utils/soundEffects';

interface BingoGameProps {
  playerName: string;
}

const BingoGame: React.FC<BingoGameProps> = ({ playerName }) => {
  const { state, dispatch, sendMessage, isConnected, reconnect } = useGame();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(playerName);
  
  // Enhanced state for effects
  const [streakCount, setStreakCount] = useState(0);
  const [lastMarkTime, setLastMarkTime] = useState(0);
  const [nearBingoSquares, setNearBingoSquares] = useState<number[]>([]);
  const [hotSquares, setHotSquares] = useState<Set<number>>(new Set());
  const [recentlyMarked, setRecentlyMarked] = useState<Set<number>>(new Set());
  const ambientTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize player and bingo card
    dispatch({ type: 'SET_PLAYER_NAME', payload: playerName });
    generateBingoCard();

    // Initialize sound system
    soundEffects.setEnabled(state.soundEnabled);

    // Start ambient sounds
    startAmbientSounds();

    return () => {
      if (ambientTimerRef.current) {
        clearTimeout(ambientTimerRef.current);
      }
    };
  }, [playerName, dispatch]);

  // Start subtle ambient sounds
  const startAmbientSounds = () => {
    const playRandomAmbient = () => {
      if (Math.random() < 0.3 && state.soundEnabled) { // 30% chance
        playAmbientChime();
      }
      
      // Schedule next ambient sound (30-60 seconds)
      const nextDelay = 30000 + Math.random() * 30000;
      ambientTimerRef.current = setTimeout(playRandomAmbient, nextDelay);
    };

    // Start first ambient sound after 10-20 seconds
    const initialDelay = 10000 + Math.random() * 10000;
    ambientTimerRef.current = setTimeout(playRandomAmbient, initialDelay);
  };

  // Update newName when playerName prop changes
  useEffect(() => {
    setNewName(playerName);
  }, [playerName]);

  // Track all winner state changes for debugging
  useEffect(() => {
    console.log('🔍 Winner state changed:', state.winner);
    console.log('🔍 Current player name:', playerName);
    console.log('🔍 Modal should be visible:', !!state.winner);
  }, [state.winner, playerName]);

  // Show winner modal when someone gets BINGO
  useEffect(() => {
    console.log('🎭 Winner state changed in useEffect:', state.winner);
    
    if (state.winner) {
      console.log('🎊 Triggering confetti and sound for winner:', state.winner);
      console.log('🎭 WINNER MODAL SHOULD BE VISIBLE - Winner:', state.winner, 'Player:', playerName);
      console.log('🎭 RENDERING WINNER MODAL - Winner:', state.winner, 'Player:', playerName);
      // Trigger confetti
      confetti({
        particleCount: 300,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#ff6b35', '#ffd700', '#00CC76', '#8DFF9D']
      });
      
      // Play enhanced bingo sound for everyone when someone wins
      if (state.soundEnabled) {
        playEpicWinnerCelebration();
      }
      console.log('✨ Enhanced confetti and sound triggered');
    }
  }, [state.winner, state.soundEnabled]);

  // Check for near-BINGO states and apply fire effects
  useEffect(() => {
    if (state.bingoCard.length === 25) {
      const nearBingo = checkNearBingo(state.bingoCard);
      setNearBingoSquares(nearBingo);
      
      if (nearBingo.length > 0 && state.soundEnabled) {
        playNearBingo();
        if (Math.random() < 0.3) { // 30% chance for fire effect sound
          setTimeout(() => playFireEffect(), 500);
        }
      }
    }
  }, [state.bingoCard, state.soundEnabled]);

  // Generate new bingo card when game is reset
  useEffect(() => {
    // If the game state has been reset (no winner, empty bingo card, but player name exists)
    // then generate a new bingo card
    if (state.playerName && state.bingoCard.length === 0 && !state.winner) {
      console.log('Game reset detected, generating new bingo card for:', state.playerName);
      generateBingoCard();
      // Reset enhanced state
      setStreakCount(0);
      setNearBingoSquares([]);
      setHotSquares(new Set());
      setRecentlyMarked(new Set());
    }
  }, [state.bingoCard.length, state.winner, state.playerName]);

  // Update sound enabled state
  useEffect(() => {
    soundEffects.setEnabled(state.soundEnabled);
  }, [state.soundEnabled]);

  const generateBingoCard = () => {
    const shuffledQuestions = [...(questionsData as Question[])].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffledQuestions.slice(0, 25);
    
    const bingoCard: BingoSquare[] = selectedQuestions.map((question, index) => ({
      id: `square-${index}`,
      prompt: question.prompt,
      isMarked: false,
    }));

    // Make center square free space (optional)
    if (bingoCard[12]) {
      bingoCard[12] = {
        id: 'square-12',
        prompt: 'FREE SPACE',
        isMarked: true,
        participantName: 'Free',
      };
    }

    dispatch({ type: 'SET_BINGO_CARD', payload: bingoCard });
  };

  // Check for near-BINGO states (4 out of 5 in any line)
  const checkNearBingo = (card: BingoSquare[]): number[] => {
    const size = 5;
    const nearBingoIndices: number[] = [];
    const isMarked = (index: number) => card[index]?.isMarked;

    // Check rows
    for (let row = 0; row < size; row++) {
      const rowIndices = Array.from({ length: size }, (_, col) => row * size + col);
      const markedCount = rowIndices.filter(isMarked).length;
      if (markedCount === 4) {
        // Find the unmarked square in this row
        const unmarked = rowIndices.find(idx => !isMarked(idx));
        if (unmarked !== undefined) nearBingoIndices.push(unmarked);
      }
    }

    // Check columns
    for (let col = 0; col < size; col++) {
      const colIndices = Array.from({ length: size }, (_, row) => row * size + col);
      const markedCount = colIndices.filter(isMarked).length;
      if (markedCount === 4) {
        const unmarked = colIndices.find(idx => !isMarked(idx));
        if (unmarked !== undefined) nearBingoIndices.push(unmarked);
      }
    }

    // Check diagonals
    const diagonal1 = Array.from({ length: size }, (_, i) => i * size + i);
    const diagonal2 = Array.from({ length: size }, (_, i) => i * size + (size - 1 - i));
    
    if (diagonal1.filter(isMarked).length === 4) {
      const unmarked = diagonal1.find(idx => !isMarked(idx));
      if (unmarked !== undefined) nearBingoIndices.push(unmarked);
    }
    
    if (diagonal2.filter(isMarked).length === 4) {
      const unmarked = diagonal2.find(idx => !isMarked(idx));
      if (unmarked !== undefined) nearBingoIndices.push(unmarked);
    }

    return [...new Set(nearBingoIndices)]; // Remove duplicates
  };

  const handleSquareClick = (index: number) => {
    // Prevent clicking if game is over (someone won)
    if (state.winner) {
      return;
    }
    
    if (state.bingoCard[index]?.isMarked) return;
    
    // Play button click sound
    if (state.soundEnabled) {
      playButtonClick();
    }
    
    setSelectedSquare(index);
    setModalOpen(true);
  };

  const handleSquareHover = (index: number) => {
    if (state.winner || state.bingoCard[index]?.isMarked) return;
    
    // Play hover sound (throttled)
    if (state.soundEnabled && Math.random() < 0.3) { // Only 30% chance to avoid spam
      playHover();
    }
  };

  const handleMarkSquare = (participantName: string, answer?: string) => {
    if (selectedSquare === null) return;

    console.log('📝 Marking square:', selectedSquare, 'with participant:', participantName);

    const markData = {
      index: selectedSquare,
      participantName,
      answer,
    };

    dispatch({ type: 'MARK_SQUARE', payload: markData });
    
    // Update the bingo card
    const updatedCard = [...state.bingoCard];
    updatedCard[selectedSquare] = {
      ...updatedCard[selectedSquare],
      isMarked: true,
      participantName,
      answer,
    };
    dispatch({ type: 'SET_BINGO_CARD', payload: updatedCard });

    // Enhanced effects for marking
    const now = Date.now();
    const timeSinceLastMark = now - lastMarkTime;
    
    // Check for streak (marked within 10 seconds)
    if (timeSinceLastMark < 10000 && lastMarkTime > 0) {
      const newStreak = streakCount + 1;
      setStreakCount(newStreak);
      
      if (newStreak >= 3 && state.soundEnabled) {
        playStreakSound();
      }
      
      // Add to hot squares for visual effect
      setHotSquares(prev => new Set([...prev, selectedSquare]));
      setTimeout(() => {
        setHotSquares(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedSquare);
          return newSet;
        });
      }, 5000);
    } else {
      setStreakCount(1);
    }
    
    setLastMarkTime(now);
    
    // Add recently marked effect
    setRecentlyMarked(prev => new Set([...prev, selectedSquare]));
    setTimeout(() => {
      setRecentlyMarked(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedSquare);
        return newSet;
      });
    }, 2000);

    // Send WebSocket message
    sendMessage({
      type: 'SQUARE_MARKED',
      payload: { 
        playerName, 
        ...markData,
        prompt: state.bingoCard[selectedSquare]?.prompt 
      },
    });

    console.log('🎯 About to check for BINGO...');
    // Check for bingo
    if (checkForBingo(updatedCard)) {
      console.log('🎉 BINGO detected! Calling handleBingo...');
      handleBingo();
    } else {
      console.log('❌ No BINGO detected');
    }

    // Play enhanced sound effect
    if (state.soundEnabled) {
      playSquareMark();
    }
    
    setModalOpen(false);
    setSelectedSquare(null);
  };

  const checkForBingo = (card: BingoSquare[]): boolean => {
    const size = 5;
    const isMarked = (index: number) => card[index]?.isMarked;

    console.log('🔍 Checking for BINGO...');
    console.log('Card state:', card.map((square, i) => ({ index: i, marked: square.isMarked, prompt: square.prompt.substring(0, 20) })));

    // Check rows
    for (let row = 0; row < size; row++) {
      const rowIndices = Array.from({ length: size }, (_, col) => row * size + col);
      const rowComplete = rowIndices.every(isMarked);
      console.log(`Row ${row} (indices ${rowIndices}):`, rowComplete);
      if (rowComplete) {
        console.log('🎉 BINGO found in row', row);
        return true;
      }
    }

    // Check columns
    for (let col = 0; col < size; col++) {
      const colIndices = Array.from({ length: size }, (_, row) => row * size + col);
      const colComplete = colIndices.every(isMarked);
      console.log(`Column ${col} (indices ${colIndices}):`, colComplete);
      if (colComplete) {
        console.log('🎉 BINGO found in column', col);
        return true;
      }
    }

    // Check diagonals
    const diagonal1 = Array.from({ length: size }, (_, i) => i * size + i);
    const diagonal2 = Array.from({ length: size }, (_, i) => i * size + (size - 1 - i));
    
    const diag1Complete = diagonal1.every(isMarked);
    const diag2Complete = diagonal2.every(isMarked);
    
    console.log(`Diagonal 1 (indices ${diagonal1}):`, diag1Complete);
    console.log(`Diagonal 2 (indices ${diagonal2}):`, diag2Complete);
    
    if (diag1Complete) {
      console.log('🎉 BINGO found in diagonal 1');
      return true;
    }
    if (diag2Complete) {
      console.log('🎉 BINGO found in diagonal 2');
      return true;
    }

    console.log('❌ No BINGO found');
    return false;
  };

  const handleBingo = () => {
    console.log('🎯 BINGO detected! Sending WebSocket message...');
    console.log('Player name:', playerName);
    console.log('Is connected:', isConnected);
    
    // Don't set winner state locally - let it come through WebSocket
    // This ensures all players freeze at the same time
    const message = {
      type: 'BINGO_WINNER' as const,
      payload: playerName,
    };
    
    console.log('📤 Sending BINGO_WINNER message:', message);
    sendMessage(message);
    console.log('✅ BINGO_WINNER message sent');
    
    // Don't play sound locally - it will be played when WebSocket message is received
    // This ensures all players hear the sound at the same time
  };

  const playSound = (type: 'mark' | 'bingo') => {
    if (!state.soundEnabled) return;
    
    // Legacy sound function - kept for backwards compatibility
    // New enhanced sounds are handled by the soundEffects system
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'mark') {
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'bingo') {
      // Play a celebratory sound sequence
      const frequencies = [523, 659, 784, 1047];
      frequencies.forEach((freq, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.2);
        gain.gain.setValueAtTime(0.2, audioContext.currentTime + index * 0.2);
        osc.start(audioContext.currentTime + index * 0.2);
        osc.stop(audioContext.currentTime + index * 0.2 + 0.3);
      });
    }
  };

  const handleNameEdit = () => {
    setIsEditingName(true);
    setNewName(playerName);
  };

  const handleNameSave = () => {
    const trimmedName = newName.trim();
    if (trimmedName && trimmedName !== playerName) {
      // Update the player name in the context
      dispatch({ type: 'SET_PLAYER_NAME', payload: trimmedName });
      
      // Send message to server about name change
      sendMessage({
        type: 'PLAYER_JOINED',
        payload: { playerName: trimmedName }
      });
      
      console.log(`Name changed from "${playerName}" to "${trimmedName}"`);
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setNewName(playerName);
    setIsEditingName(false);
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  // Enhanced square class names
  const getSquareClasses = (square: BingoSquare, index: number) => {
    const classes = ['bingo-square'];
    
    if (square.isMarked) classes.push('marked');
    if (index === 12) classes.push('free-space');
    if (state.winner) classes.push('disabled');
    if (nearBingoSquares.includes(index)) classes.push('near-bingo', 'on-fire');
    if (hotSquares.has(index)) classes.push('hot-streak');
    if (recentlyMarked.has(index)) classes.push('micro-bounce', 'sparkle-container');
    
    // Add hover magic effect to non-marked squares
    if (!square.isMarked && !state.winner) {
      classes.push('hover-magic');
    }
    
    return classes.join(' ');
  };

  return (
    <div className="bingo-game">
      <BackgroundEffects />
      
      <div className="game-header">
        <div className="logo-container">
          <div className="logo-placeholder">
            CGX
          </div>
          <div className="logo-text">CGX Bingo</div>
        </div>
        
        <h1>CGX Ice Breaker Bingo</h1>
        <div className="player-name-section">
          {isEditingName ? (
            <div className="name-edit-container">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleNameKeyPress}
                className="name-edit-input"
                placeholder="Enter your name"
                maxLength={20}
                autoFocus
              />
              <div className="name-edit-buttons">
                <button onClick={handleNameSave} className="save-name-button hover-magic">
                  ✓ Save
                </button>
                <button onClick={handleNameCancel} className="cancel-name-button hover-magic">
                  ✕ Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="name-display-container">
              <p className="welcome-text">Welcome, {playerName}!</p>
              <button onClick={handleNameEdit} className="change-name-button hover-magic">
                ✏️ Change Name
              </button>
            </div>
          )}
        </div>
        
        {/* Streak indicator */}
        {streakCount >= 3 && (
          <div className="streak-indicator hot-streak">
            🔥 {streakCount} square streak! 🔥
          </div>
        )}
        
        {/* Temporary Debug Button */}
      {typeof window !== 'undefined' && (window as any).debug && (
        <>
        <div style={{ margin: '10px 0', padding: '15px', background: '#ffe6e6', borderRadius: '8px', border: '2px solid #ff6b6b' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#d63031' }}>🧪 DEBUG CONTROLS</h3>
          <button 
            onClick={() => {
              console.log('🧪 TEST: Manually setting winner state to trigger modal');
              dispatch({ type: 'SET_WINNER', payload: playerName });
            }}
            style={{ marginRight: '10px', padding: '8px 15px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}
          >
            🧪 Test Winner Modal
          </button>
          <button 
            onClick={() => {
              console.log('🧪 TEST: Clearing winner state');
              dispatch({ type: 'RESET_GAME' });
            }}
            style={{ marginRight: '10px', padding: '8px 15px', background: '#6b73ff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}
          >
            🧪 Clear Winner
          </button>
          <button 
            onClick={() => {
              console.log('🧪 TEST: Simulating BINGO_WINNER WebSocket message');
              // Send a BINGO_WINNER message through the actual WebSocket
              const message = {
                type: 'BINGO_WINNER' as const,
                payload: playerName
              };
              console.log('🧪 Sending test BINGO_WINNER message:', message);
              sendMessage(message);
            }}
            style={{ padding: '8px 15px', background: '#00b894', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}
          >
            🧪 Test WebSocket Flow
          </button>
          <div style={{ fontSize: '12px', marginTop: '10px', fontFamily: 'monospace', background: '#f8f9fa', padding: '8px', borderRadius: '4px' }}>
            <div><strong>Current winner state:</strong> {state.winner || 'null'}</div>
            <div><strong>WebSocket connected:</strong> {isConnected ? 'YES' : 'NO'}</div>
            <div><strong>Modal should show:</strong> {state.winner ? 'YES' : 'NO'}</div>
            <div><strong>Player name:</strong> {playerName}</div>
            <div><strong>Streak count:</strong> {streakCount}</div>
            <div><strong>Near BINGO squares:</strong> {nearBingoSquares.join(', ') || 'none'}</div>
          </div>
        </div>
          </>
      )}
        
        {/* Connection Status */}
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          {!isConnected && (
            <button onClick={reconnect} className="reconnect-button hover-magic">
              Reconnect
            </button>
          )}
        </div>

        {!isConnected && (
          <div className="connection-warning">
            <div className="loading-container">
              <img 
                src="/images/loading.gif" 
                alt="Loading..." 
                className="loading-image"
                style={{ width: '250px', height: '250px' }}
              />
              <p>🔄 Connecting to server...</p>
              <p>Real-time features may not work until connected.</p>
            </div>
          </div>
        )}
      </div>

      <div className={`bingo-card ${state.winner ? 'game-over' : ''} sparkle-container`}>
        {state.bingoCard.map((square, index) => (
          <div
            key={square.id}
            className={getSquareClasses(square, index)}
            onClick={() => handleSquareClick(index)}
            onMouseEnter={() => handleSquareHover(index)}
          >
            <div className="square-content">
              <p className="square-prompt">{square.prompt}</p>
              {square.isMarked && square.participantName && (
                <div className="square-mark">
                  <span className="participant-name">{square.participantName}</span>
                  {square.answer && <span className="answer">{square.answer}</span>}
                </div>
              )}
            </div>
            
            {/* Sparkle effects for recently marked squares */}
            {recentlyMarked.has(index) && (
              <>
                <div className="sparkle" style={{ top: '20%', left: '20%', animationDelay: '0s' }} />
                <div className="sparkle" style={{ top: '80%', left: '40%', animationDelay: '0.5s' }} />
                <div className="sparkle" style={{ top: '40%', left: '80%', animationDelay: '1s' }} />
                <div className="sparkle" style={{ top: '60%', left: '10%', animationDelay: '1.5s' }} />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Winner Modal */}
      {state.winner && (
        <div className="modal-overlay">
          <div className="modal-content winner-modal mega-celebration">
            <div className="winner-modal-header">
              <h2>🎉 BINGO! 🎉</h2>
            </div>
            <div className="winner-modal-body">
              <div className="winner-image-container">
                <img 
                  src="/images/winner.png" 
                  alt="Winner!" 
                  className="winner-image animate-bounceIn"
                />
              </div>
              <div className="winner-announcement">
                {state.winner === playerName ? (
                  <p className="winner-text">Congratulations! You won!</p>
                ) : (
                  <p className="winner-text">{state.winner} got BINGO!</p>
                )}
              </div>
              <p className="winner-subtitle">
                The game is now frozen. The host can reset the game from the scoreboard.
              </p>
            </div>
            <div className="winner-modal-footer">
              <button 
                onClick={() => {
                  console.log('🎭 Winner modal close button clicked');
                  // Don't close the modal, let the host reset the game
                }} 
                className="close-winner-button hover-magic"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && selectedSquare !== null && !state.winner && (
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedSquare(null);
          }}
          participants={state.players.map(player => player.name)}
          onSelect={handleMarkSquare}
          question={state.bingoCard[selectedSquare]?.prompt}
        />
      )}
    </div>
  );
};

export default BingoGame; 