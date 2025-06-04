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
}

export interface WebSocketMessage {
  type: 'PLAYERS_UPDATE' | 'SQUARE_MARKED' | 'BINGO_WINNER' | 'GAME_RESET' | 'PLAYER_JOINED';
  payload: any;
}

export interface Question {
  prompt: string;
  type: string;
}