const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Environment configuration
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';
const HOST = process.env.HOST || '0.0.0.0';

console.log(`Starting WebSocket server in ${NODE_ENV} mode on ${HOST}:${PORT}`);

// Create HTTP server for serving static files in production
const server = http.createServer((req, res) => {
  if (NODE_ENV === 'production') {
    // Serve static files from dist directory
    const filePath = path.join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url);
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        // If file not found, serve index.html for SPA routing
        if (err.code === 'ENOENT') {
          fs.readFile(path.join(__dirname, 'dist', 'index.html'), (err, data) => {
            if (err) {
              res.writeHead(500);
              res.end('Server Error');
              return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
          });
        } else {
          res.writeHead(500);
          res.end('Server Error');
        }
        return;
      }
      
      // Set content type based on file extension
      const ext = path.extname(filePath);
      const contentType = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
      }[ext] || 'text/plain';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server running in development mode');
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  perMessageDeflate: false // Disable compression for better performance
});

// Store connected clients and game state
const clients = new Map();
const playersByName = new Map();
let gameState = {
  winner: null,
  players: [],
  playerBoards: new Map(), // Store each player's marked squares
  events: [] // Store game events
};

console.log('WebSocket server is ready for connections');

wss.on('connection', (ws, req) => {
  const clientId = Date.now() + Math.random();
  clients.set(clientId, { ws, playerName: null });
  
  console.log('New client connected');
  
  // Send current game state to new connection
  sendCurrentStateToClient(ws);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);
      
      handleWebSocketMessage(clientId, data);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    const client = clients.get(clientId);
    if (client && client.playerName) {
      console.log('Removing player:', client.playerName);
      
      // Add player left event
      addGameEvent('player_left', client.playerName);
      
      playersByName.delete(client.playerName);
      // Note: Keep player board data in case they reconnect
      updatePlayersList();
    }
    clients.delete(clientId);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function sendCurrentStateToClient(ws) {
  if (ws.readyState === WebSocket.OPEN) {
    // Send current game state
    ws.send(JSON.stringify({
      type: 'CURRENT_STATE',
      payload: {
        winner: gameState.winner,
        players: gameState.players,
        playerBoards: Object.fromEntries(gameState.playerBoards),
        events: gameState.events
      }
    }));
  }
}

function handleWebSocketMessage(clientId, data) {
  const client = clients.get(clientId);
  if (!client) return;
  
  switch (data.type) {
    case 'PLAYER_JOINED':
      const playerName = data.payload.playerName;
      
      // Check if player already exists (reconnection)
      if (playersByName.has(playerName)) {
        console.log('Player', playerName, 'reconnecting, updating connection');
        playersByName.get(playerName).ws = client.ws;
        client.playerName = playerName;
      } else {
        console.log('New player joined:', playerName);
        playersByName.set(playerName, { ws: client.ws, name: playerName });
        client.playerName = playerName;
        
        // Initialize empty board for new player
        if (!gameState.playerBoards.has(playerName)) {
          gameState.playerBoards.set(playerName, []);
        }
        
        // Add player joined event
        addGameEvent('player_joined', playerName);
      }
      
      updatePlayersList();
      break;
      
    case 'SQUARE_MARKED':
      // Store the marked square in game state
      const { playerName: markPlayerName, index, participantName, answer, prompt } = data.payload;
      
      if (!gameState.playerBoards.has(markPlayerName)) {
        gameState.playerBoards.set(markPlayerName, []);
      }
      
      // Add marked square to player's board (avoid duplicates)
      const playerBoard = gameState.playerBoards.get(markPlayerName);
      const existingSquare = playerBoard.find(square => square.index === index);
      
      if (!existingSquare) {
        playerBoard.push({ index, participantName, answer: answer || '' });
        console.log(`📝 Stored marked square for ${markPlayerName}: index ${index}`);
      }
      
      // Broadcast square marked to all clients
      broadcast({
        type: 'SQUARE_MARKED',
        payload: data.payload
      });
      
      // Update players list with new marked square count
      updatePlayersList();
      
      // Add game event with prompt text
      addGameEvent('square_marked', markPlayerName, { 
        prompt: prompt || 'Unknown prompt', 
        participantName, 
        answer: answer || '' 
      });
      break;
      
    case 'BINGO_WINNER':
      console.log('🎉 Processing BINGO_WINNER for:', data.payload);
      const winnerName = data.payload;
      
      // Update game state
      gameState.winner = winnerName;
      
      console.log('Current players:', Array.from(playersByName.keys()));
      console.log('Found winner player:', playersByName.has(winnerName) ? 'YES' : 'NO');
      
      // Broadcast BINGO_WINNER to all clients
      console.log('📤 Broadcasting BINGO_WINNER message to all clients');
      broadcast({
        type: 'BINGO_WINNER',
        payload: winnerName
      });
      
      // Also update players list
      console.log('📤 Broadcasting PLAYERS_UPDATE message');
      updatePlayersList();
      
      // Add game event
      addGameEvent('bingo_winner', winnerName);
      console.log('✅ BINGO_WINNER processing complete');
      break;
      
    case 'GAME_RESET':
      console.log('Game reset requested');
      gameState.winner = null;
      gameState.playerBoards.clear(); // Clear all player boards
      gameState.events = []; // Clear events
      
      // Broadcast game reset to all clients
      broadcast({
        type: 'GAME_RESET',
        payload: null
      });
      
      updatePlayersList();
      
      // Do NOT add a game_reset event - we want a completely clean slate
      console.log('🔄 Game reset complete - events cleared');
      break;
      
    case 'REQUEST_CURRENT_STATE':
      console.log('📋 Current state requested by client');
      sendCurrentStateToClient(client.ws);
      break;
      
    case 'REMOVE_ALL_USERS':
      console.log('🧹 Remove all users requested');
      
      // First, send USER_REMOVED message to all clients to trigger page reload
      broadcast({
        type: 'USER_REMOVED',
        payload: null
      });
      
      // Give clients a brief moment to receive the message before clearing state
      setTimeout(() => {
        // Clear all players and game state
        console.log('🧹 Clearing all players and game state');
        clients.clear();
        playersByName.clear();
        gameState.winner = null;
        gameState.players = [];
        gameState.playerBoards.clear();
        gameState.events = [];
        
        console.log('✅ All users removed and game state cleared');
      }, 500); // 500ms delay to ensure message delivery
      break;
  }
}

function broadcast(message) {
  const messageStr = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(messageStr);
    }
  });
}

function updatePlayersList() {
  const players = Array.from(playersByName.values()).map(player => {
    const playerBoard = gameState.playerBoards.get(player.name) || [];
    return {
      name: player.name,
      markedSquares: playerBoard.length,
      isWinner: gameState.winner === player.name
    };
  });
  
  gameState.players = players;
  
  broadcast({
    type: 'PLAYERS_UPDATE',
    payload: players
  });
}

// Helper function to generate unique event ID
function generateEventId() {
  return Date.now() + '-' + Math.random().toString(36).substring(2);
}

// Helper function to add event to game state
function addGameEvent(type, playerName, details = {}) {
  const event = {
    id: generateEventId(),
    timestamp: Date.now(),
    type,
    playerName,
    details
  };
  
  gameState.events.push(event);
  
  // Keep only last 100 events to prevent memory bloat
  if (gameState.events.length > 100) {
    gameState.events = gameState.events.slice(-100);
  }
  
  // Broadcast the new event to all clients
  broadcast({
    type: 'GAME_EVENT',
    payload: event
  });
  
  console.log('📝 Added game event:', event);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start the server
server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`WebSocket server running on port ${PORT}`);
}); 