const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

console.log('WebSocket server running on port 8080');

// Map to store player data with WebSocket connection as key
const playerConnections = new Map();
// Map to store players by name to prevent duplicates
const playersByName = new Map();
// Rate limiting for player registration
const registrationRateLimit = new Map();

const gameState = {
  players: [],
  winner: null,
  gameStarted: false
};

function updateGameState() {
  gameState.players = Array.from(playersByName.values());
}

function broadcast(message) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

function removePlayerByConnection(ws) {
  const playerData = playerConnections.get(ws);
  if (playerData) {
    console.log(`Removing player: ${playerData.name}`);
    playersByName.delete(playerData.name);
    playerConnections.delete(ws);
    registrationRateLimit.delete(playerData.name); // Clear rate limit
    updateGameState();
    
    // Broadcast updated players list
    broadcast({
      type: 'PLAYERS_UPDATE',
      payload: gameState.players
    });
  }
}

function isRateLimited(playerName) {
  const now = Date.now();
  const lastRegistration = registrationRateLimit.get(playerName);
  const rateLimitWindow = 2000; // 2 seconds
  
  if (lastRegistration && (now - lastRegistration) < rateLimitWindow) {
    return true;
  }
  
  registrationRateLimit.set(playerName, now);
  return false;
}

wss.on('connection', function connection(ws) {
  console.log('New client connected');

  ws.on('message', function incoming(data) {
    try {
      const message = JSON.parse(data);
      console.log('Received:', message);

      switch (message.type) {
        case 'PLAYER_JOINED':
          const playerName = message.payload.playerName;
          
          // Rate limiting check
          if (isRateLimited(playerName)) {
            console.log(`Rate limited registration for player: ${playerName}`);
            return;
          }
          
          // Check if player already exists and remove old connection
          if (playersByName.has(playerName)) {
            const existingPlayer = playersByName.get(playerName);
            console.log(`Player ${playerName} reconnecting, updating connection`);
            
            // Find and remove old WebSocket connection
            for (const [oldWs, oldPlayerData] of playerConnections.entries()) {
              if (oldPlayerData.name === playerName) {
                playerConnections.delete(oldWs);
                break;
              }
            }
            
            // Update existing player data
            existingPlayer.id = Date.now().toString();
            playersByName.set(playerName, existingPlayer);
          } else {
            // Create new player
            const newPlayer = {
              id: Date.now().toString(),
              name: playerName,
              markedSquares: 0,
              bingoCard: [],
              hasBingo: false
            };
            playersByName.set(playerName, newPlayer);
            console.log(`New player joined: ${playerName}`);
          }
          
          // Associate this WebSocket with the player
          playerConnections.set(ws, { name: playerName });
          
          updateGameState();
          
          // Send updated players list to all clients
          broadcast({
            type: 'PLAYERS_UPDATE',
            payload: gameState.players
          });
          break;

        case 'SQUARE_MARKED':
          const markPlayerName = message.payload.playerName;
          const player = playersByName.get(markPlayerName);
          
          if (player) {
            player.markedSquares += 1;
            updateGameState();
            
            broadcast({
              type: 'PLAYERS_UPDATE',
              payload: gameState.players
            });
            
            // Also broadcast the square marked event
            broadcast({
              type: 'SQUARE_MARKED',
              payload: message.payload
            });
          }
          break;

        case 'BINGO_WINNER':
          const winnerName = message.payload;
          console.log('🎉 Processing BINGO_WINNER for:', winnerName);
          console.log('Current players:', Array.from(playersByName.keys()));
          
          const winner = playersByName.get(winnerName);
          console.log('Found winner player:', winner ? 'YES' : 'NO');
          
          if (winner) {
            winner.hasBingo = true;
            gameState.winner = winnerName;
            updateGameState();
            
            console.log('📤 Broadcasting BINGO_WINNER message to all clients');
            broadcast({
              type: 'BINGO_WINNER',
              payload: winnerName
            });
            
            console.log('📤 Broadcasting PLAYERS_UPDATE message');
            broadcast({
              type: 'PLAYERS_UPDATE',
              payload: gameState.players
            });
            console.log('✅ BINGO_WINNER processing complete');
          } else {
            console.log('❌ Winner player not found in playersByName map');
          }
          break;

        case 'GAME_RESET':
          console.log('Game reset requested');
          
          // Reset game state but keep players
          gameState.winner = null;
          gameState.gameStarted = false;
          
          // Reset each player's game-specific data but keep them in the game
          for (const [playerName, player] of playersByName.entries()) {
            player.markedSquares = 0;
            player.hasBingo = false;
            player.bingoCard = [];
          }
          
          updateGameState();
          
          broadcast({
            type: 'GAME_RESET',
            payload: null
          });
          
          broadcast({
            type: 'PLAYERS_UPDATE',
            payload: gameState.players
          });
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', function close() {
    console.log('Client disconnected');
    removePlayerByConnection(ws);
  });

  ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
    removePlayerByConnection(ws);
  });

  // Send initial game state to the new connection
  ws.send(JSON.stringify({
    type: 'PLAYERS_UPDATE',
    payload: gameState.players
  }));
});

// Cleanup disconnected clients periodically
setInterval(() => {
  const deadConnections = [];
  
  for (const [ws, playerData] of playerConnections.entries()) {
    if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
      deadConnections.push(ws);
    }
  }
  
  deadConnections.forEach(ws => {
    removePlayerByConnection(ws);
  });
  
  // Clean up old rate limit entries (older than 5 minutes)
  const now = Date.now();
  for (const [playerName, timestamp] of registrationRateLimit.entries()) {
    if (now - timestamp > 300000) { // 5 minutes
      registrationRateLimit.delete(playerName);
    }
  }
}, 30000); // Check every 30 seconds

console.log('WebSocket server is ready for connections'); 