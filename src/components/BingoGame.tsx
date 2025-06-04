import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import Modal from './Modal';
import { BingoSquare, Question } from '../types';
import questionsData from '../data/questions.json';
import confetti from 'canvas-confetti';

interface BingoGameProps {
  playerName: string;
}

const BingoGame: React.FC<BingoGameProps> = ({ playerName }) => {
  const { state, dispatch, sendMessage, isConnected, reconnect } = useGame();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);

  useEffect(() => {
    // Initialize player and bingo card
    dispatch({ type: 'SET_PLAYER_NAME', payload: playerName });
    generateBingoCard();
  }, [playerName, dispatch]);

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
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 }
      });
      // Play bingo sound for everyone when someone wins
      playSound('bingo');
      console.log('✨ Confetti and sound triggered');
    }
  }, [state.winner]);

  // Generate new bingo card when game is reset
  useEffect(() => {
    // If the game state has been reset (no winner, empty bingo card, but player name exists)
    // then generate a new bingo card
    if (state.playerName && state.bingoCard.length === 0 && !state.winner) {
      console.log('Game reset detected, generating new bingo card for:', state.playerName);
      generateBingoCard();
    }
  }, [state.bingoCard.length, state.winner, state.playerName]);

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

  const handleSquareClick = (index: number) => {
    // Prevent clicking if game is over (someone won)
    if (state.winner) {
      return;
    }
    
    if (state.bingoCard[index]?.isMarked) return;
    setSelectedSquare(index);
    setModalOpen(true);
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

    // Send WebSocket message
    sendMessage({
      type: 'SQUARE_MARKED',
      payload: { playerName, ...markData },
    });

    console.log('🎯 About to check for BINGO...');
    // Check for bingo
    if (checkForBingo(updatedCard)) {
      console.log('🎉 BINGO detected! Calling handleBingo...');
      handleBingo();
    } else {
      console.log('❌ No BINGO detected');
    }

    // Play sound effect
    playSound('mark');
    
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
    
    // Create audio context for sound effects
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

  return (
    <div className="bingo-game">
      <div className="game-header">
        <h1>CGX Ice Breaker Bingo</h1>
        <p>Welcome, {playerName}!</p>
        
        {/* Temporary Debug Button */}
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
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          {!isConnected && (
            <button onClick={reconnect} className="reconnect-button">
              Reconnect
            </button>
          )}
        </div>

        {!isConnected && (
          <div className="connection-warning">
            <p>⚠️ Connection to server lost. Real-time features may not work properly.</p>
          </div>
        )}
      </div>

      <div className={`bingo-card ${state.winner ? 'game-over' : ''}`}>
        {state.bingoCard.map((square, index) => (
          <div
            key={square.id}
            className={`bingo-square ${square.isMarked ? 'marked' : ''} ${index === 12 ? 'free-space' : ''} ${state.winner ? 'disabled' : ''}`}
            onClick={() => handleSquareClick(index)}
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
          </div>
        ))}
      </div>

      {/* Winner Modal */}
      {state.winner && (
        <div className="modal-overlay">
          <div className="modal-content winner-modal">
            <div className="winner-modal-header">
              <h2>🎉 BINGO! 🎉</h2>
            </div>
            <div className="winner-modal-body">
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
                className="close-winner-button"
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