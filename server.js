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
  players: []
};

console.log('WebSocket server is ready for connections');

wss.on('connection', (ws, req) => {
  const clientId = Date.now() + Math.random();
  clients.set(clientId, { ws, playerName: null });
  
  console.log('New client connected');
  
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
      playersByName.delete(client.playerName);
      updatePlayersList();
    }
    clients.delete(clientId);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

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
      }
      
      updatePlayersList();
      break;
      
    case 'SQUARE_MARKED':
      // Broadcast square marked to all clients
      broadcast({
        type: 'SQUARE_MARKED',
        payload: data.payload
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
      console.log('✅ BINGO_WINNER processing complete');
      break;
      
    case 'GAME_RESET':
      console.log('Game reset requested');
      gameState.winner = null;
      
      // Broadcast game reset to all clients
      broadcast({
        type: 'GAME_RESET',
        payload: null
      });
      
      updatePlayersList();
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
  const players = Array.from(playersByName.values()).map(player => ({
    name: player.name,
    markedSquares: 0 // This would be tracked in a real implementation
  }));
  
  gameState.players = players;
  
  broadcast({
    type: 'PLAYERS_UPDATE',
    payload: players
  });
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