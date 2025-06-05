export interface BingoSquare {
  id: string;
  prompt: string;
  isMarked: boolean;
  participantName?: string;
  answer?: string;
}

export interface Player {
  id: string;
  name: string;
  markedSquares: number;
  bingoCard: BingoSquare[];
  hasBingo: boolean;
}

export interface GameState {
  playerName: string;
  bingoCard: BingoSquare[];
  markedSquares: Array<{ index: number; participantName: string; answer?: string }>;
  players: Player[];
  winner: string | null;
  gameStarted: boolean;
  soundEnabled: boolean;
  events: GameEvent[];
}

export interface MarkedSquare {
  index: number;
  participantName: string;
  answer?: string;
}

export interface GameEvent {
  id: string;
  timestamp: number;
  type: 'player_joined' | 'player_left' | 'square_marked' | 'bingo_winner' | 'game_reset';
  playerName: string;
  details?: {
    prompt?: string;
    participantName?: string;
    answer?: string;
  };
}

export interface CurrentStatePayload {
  winner: string | null;
  players: Player[];
  playerBoards: Record<string, MarkedSquare[]>;
  events: GameEvent[];
}

export interface WebSocketMessage {
  type: 'PLAYERS_UPDATE' | 'SQUARE_MARKED' | 'BINGO_WINNER' | 'GAME_RESET' | 'PLAYER_JOINED' | 'CURRENT_STATE' | 'REQUEST_CURRENT_STATE' | 'GAME_EVENT';
  payload: any;
}

export interface Question {
  prompt: string;
  type: string;
}