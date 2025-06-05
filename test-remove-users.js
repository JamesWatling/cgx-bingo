const WebSocket = require('ws');

async function testRemoveAllUsers() {
  console.log('🧪 Testing REMOVE_ALL_USERS functionality...');
  
  // Connect to the WebSocket server
  const ws = new WebSocket('ws://localhost:8080');
  
  ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
    
    // First, join as a test player
    console.log('📝 Joining as test player...');
    ws.send(JSON.stringify({
      type: 'PLAYER_JOINED',
      payload: { playerName: 'TestPlayer' }
    }));
    
    // Wait a moment, then test the remove all users functionality
    setTimeout(() => {
      console.log('🧹 Sending REMOVE_ALL_USERS message...');
      ws.send(JSON.stringify({
        type: 'REMOVE_ALL_USERS',
        payload: null
      }));
    }, 1000);
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('📨 Received message:', message.type);
      
      if (message.type === 'USER_REMOVED') {
        console.log('✅ USER_REMOVED message received successfully!');
        console.log('🎯 This would trigger a page reload in the browser');
        ws.close();
        process.exit(0);
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    process.exit(1);
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });
  
  // Timeout after 10 seconds
  setTimeout(() => {
    console.log('⏰ Test timeout - closing connection');
    ws.close();
    process.exit(1);
  }, 10000);
}

testRemoveAllUsers(); 