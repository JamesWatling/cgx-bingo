import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef, useCallback } from 'react';
import { GameState, Player, BingoSquare, WebSocketMessage, CurrentStatePayload, MarkedSquare, GameEvent } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  sendMessage: (message: WebSocketMessage) => void;
  isConnected: boolean;
  reconnect: () => void;
  requestCurrentState: () => void;
}

type GameAction =
  | { type: 'SET_PLAYER_NAME'; payload: string }
  | { type: 'SET_BINGO_CARD'; payload: BingoSquare[] }
  | { type: 'MARK_SQUARE'; payload: { index: number; participantName: string; answer?: string } }
  | { type: 'UPDATE_PLAYERS'; payload: Player[] }
  | { type: 'SET_WINNER'; payload: string }
  | { type: 'RESET_GAME' }
  | { type: 'PLAY_SOUND'; payload: string }
  | { type: 'ADD_EVENT'; payload: GameEvent }
  | { type: 'SET_EVENTS'; payload: GameEvent[] };

const initialState: GameState = {
  playerName: '',
  bingoCard: [],
  markedSquares: [],
  players: [],
  winner: null,
  gameStarted: false,
  soundEnabled: true,
  events: [],
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_PLAYER_NAME':
      return { ...state, playerName: action.payload };
    case 'SET_BINGO_CARD':
      return { ...state, bingoCard: action.payload };
    case 'MARK_SQUARE':
      const newMarkedSquares = [...state.markedSquares, action.payload];
      return { ...state, markedSquares: newMarkedSquares };
    case 'UPDATE_PLAYERS':
      return { ...state, players: action.payload };
    case 'SET_WINNER':
      console.log('🏆 SET_WINNER reducer called with payload:', action.payload);
      console.log('🏆 Previous winner state:', state.winner);
      console.log('🏆 Payload type:', typeof action.payload);
      console.log('🏆 Payload value:', JSON.stringify(action.payload));
      const newState = { ...state, winner: action.payload };
      console.log('🏆 New winner state:', newState.winner);
      console.log('🏆 Returning new state from reducer');
      return newState;
    case 'RESET_GAME':
      return { 
        ...initialState, 
        playerName: state.playerName, // Keep the player name
        players: state.players, // Keep the players list
        soundEnabled: state.soundEnabled, // Keep sound preference
        events: [] // Explicitly clear events
      };
    case 'PLAY_SOUND':
      // Sound will be handled by the component
      return state;
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    default:
      return state;
  }
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Determine WebSocket URL based on environment
  const getWebSocketUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      // In production, use the same host as the current page
      // Cloudflare handles SSL termination, so we detect HTTPS and use WSS
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      return `${protocol}//${host}`;
    } else {
      // In development, use localhost:8080
      return 'ws://localhost:8080';
    }
  };
  
  const { sendMessage, lastMessage, isConnected, reconnect } = useWebSocket(getWebSocketUrl());
  
  const lastRegistrationRef = useRef<string>('');
  const registrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debugSequenceRef = useRef<number>(0);

  // Function to request current state from server
  const requestCurrentState = useCallback(() => {
    console.log('📋 Requesting current state from server...');
    sendMessage({
      type: 'REQUEST_CURRENT_STATE',
      payload: null
    });
  }, [sendMessage]);

  useEffect(() => {
    if (lastMessage) {
      try {
        const message: WebSocketMessage = JSON.parse(lastMessage.data);
        
        // Increment debug sequence for tracking
        debugSequenceRef.current += 1;
        const sequence = debugSequenceRef.current;
        
        // Handle WebSocket message with current state
        console.log(`📨 [${sequence}] Received WebSocket message:`, message.type, message.payload);
        console.log(`📨 [${sequence}] Full message object:`, JSON.stringify(message, null, 2));
        console.log(`📨 [${sequence}] Current state.playerName:`, state.playerName);
        console.log(`📨 [${sequence}] Current state.winner:`, state.winner);
        
        switch (message.type) {
          case 'PLAYERS_UPDATE':
            console.log('👥 Processing PLAYERS_UPDATE with', message.payload.length, 'players');
            dispatch({ type: 'UPDATE_PLAYERS', payload: message.payload });
            break;
          case 'SQUARE_MARKED':
            console.log('📝 Processing SQUARE_MARKED for player:', message.payload.playerName);
            // Only handle square marked events from other players
            if (message.payload.playerName !== state.playerName) {
              dispatch({ type: 'MARK_SQUARE', payload: message.payload });
            }
            break;
          case 'BINGO_WINNER':
            console.log(`🎉 [${sequence}] BINGO_WINNER message received for:`, message.payload);
            console.log(`🎉 [${sequence}] Message payload type:`, typeof message.payload);
            console.log(`🎉 [${sequence}] Message payload value:`, JSON.stringify(message.payload));
            console.log(`🎯 [${sequence}] Current player name in state:`, state.playerName);
            console.log(`🎯 [${sequence}] Winner name from message:`, message.payload);
            console.log(`🎯 [${sequence}] Are they the same player?`, message.payload === state.playerName);
            console.log(`🎯 [${sequence}] Current winner state before update:`, state.winner);
            console.log(`🎯 [${sequence}] About to dispatch SET_WINNER action...`);
            
            // ALWAYS process BINGO_WINNER messages regardless of who sent them
            // This ensures both the winner and other players see the modal
            dispatch({ type: 'SET_WINNER', payload: message.payload });
            console.log(`✅ [${sequence}] SET_WINNER action dispatched for winner:`, message.payload);
            
            // Add a small delay and check if state was updated
            setTimeout(() => {
              console.log(`🔍 [${sequence}] Checking state after SET_WINNER dispatch...`);
              console.log(`🔍 [${sequence}] Current winner in state:`, state.winner);
            }, 100);
            break;
          case 'GAME_RESET':
            console.log('🔄 GAME_RESET message received');
            dispatch({ type: 'RESET_GAME' });
            break;
          case 'CURRENT_STATE':
            console.log('📋 CURRENT_STATE message received:', message.payload);
            // Apply current state to our local state
            const currentState = message.payload as CurrentStatePayload;
            if (currentState.winner) {
              dispatch({ type: 'SET_WINNER', payload: currentState.winner });
            }
            if (currentState.players) {
              dispatch({ type: 'UPDATE_PLAYERS', payload: currentState.players });
            }
            if (currentState.events) {
              dispatch({ type: 'SET_EVENTS', payload: currentState.events });
            }
            // Apply marked squares for other players
            if (currentState.playerBoards) {
              Object.entries(currentState.playerBoards).forEach(([playerName, squares]) => {
                if (playerName !== state.playerName) {
                  // Apply each marked square for other players
                  (squares as MarkedSquare[]).forEach((square: MarkedSquare) => {
                    dispatch({ type: 'MARK_SQUARE', payload: { 
                      index: square.index, 
                      participantName: square.participantName, 
                      answer: square.answer 
                    }});
                  });
                }
              });
            }
            break;
          case 'GAME_EVENT':
            console.log('📝 GAME_EVENT message received:', message.payload);
            dispatch({ type: 'ADD_EVENT', payload: message.payload });
            break;
          case 'USER_REMOVED':
            console.log('🧹 USER_REMOVED message received - reloading page');
            // Give a brief moment for any UI updates, then reload the page
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            break;
          default:
            console.log('❓ Unknown message type received:', message.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage, state.playerName]); // Add state.playerName as dependency

  // Send player joined message when player name is set and connected
  // Only send once when both conditions are met, with debouncing
  useEffect(() => {
    if (state.playerName && isConnected) {
      const registrationKey = `${state.playerName}-${isConnected}`;
      
      // Prevent duplicate registrations
      if (lastRegistrationRef.current === registrationKey) {
        return;
      }
      
      // Clear any pending registration
      if (registrationTimeoutRef.current) {
        clearTimeout(registrationTimeoutRef.current);
      }
      
      // Debounce the registration to prevent rapid-fire messages
      registrationTimeoutRef.current = setTimeout(() => {
        console.log(`Registering player: ${state.playerName}`);
        sendMessage({
          type: 'PLAYER_JOINED',
          payload: { playerName: state.playerName }
        });
        lastRegistrationRef.current = registrationKey;
      }, 500); // 500ms debounce
    }
    
    return () => {
      if (registrationTimeoutRef.current) {
        clearTimeout(registrationTimeoutRef.current);
      }
    };
  }, [state.playerName, isConnected, sendMessage]);

  return (
    <GameContext.Provider value={{ state, dispatch, sendMessage, isConnected, reconnect, requestCurrentState }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 