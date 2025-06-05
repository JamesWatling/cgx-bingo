# CGX Bingo - Troubleshooting Guide

## Common Issues and Solutions

### 1. Scoreboard not showing current game state

**Problem**: When navigating to the scoreboard, it only shows new events, not the current state of players' boards.

**Solution**: ✅ **FIXED** - The server now maintains complete game state and automatically sends it to new connections.

**How it works**:
- Server stores all marked squares for each player
- When a client connects, server automatically sends current state
- Scoreboard requests current state when it mounts
- All current marked squares and winner state are restored

**Testing**:
1. Start the game with multiple players
2. Have players mark some squares
3. Navigate to scoreboard - should show all current progress
4. Refresh scoreboard - should still show current state

### 2. WebSocket Connection Issues

**Problem**: WebSocket connections failing with WSS on HTTPS sites.

**Solution**: 
- Enable WebSocket support in Cloudflare dashboard
- Use Cloudflare Flexible SSL mode
- Updated nginx configuration for better WebSocket handling

**Debugging**:
```bash
# Test WebSocket connection manually
const ws = new WebSocket('wss://cgx.jameswatling.com');
ws.onopen = () => console.log('✅ Connected');
ws.onerror = (e) => console.log('❌ Error:', e);
```

### 3. Winner Modal Not Showing

**Problem**: Winner modal only appears on scoreboard, not on individual player screens.

**Solution**: ✅ **FIXED** - Implemented message queue system to handle race conditions.

### 4. Players Not Updating

**Problem**: Player list not updating when players join/leave.

**Current Status**: 
- Server tracks players correctly
- Updates broadcast to all clients
- Check WebSocket connection status

### 5. Game State Not Persisting

**Problem**: Game state lost when players reconnect.

**Solution**: ✅ **IMPROVED** - Server now maintains:
- All marked squares for each player
- Winner state
- Player connection status
- Game can be resumed after brief disconnections

## Debug Features

### Server-side Debugging
- All WebSocket messages logged with details
- Player state tracking
- Game state persistence monitoring

### Client-side Debugging  
- WebSocket connection status indicators
- Message processing logs
- State change tracking
- Scoreboard shows detailed debug information

## Manual Testing Steps

### Test Current State Functionality
1. **Start server**: `node server.js`
2. **Open player 1**: Navigate to game, join as "Player1"
3. **Mark squares**: Mark 5-10 squares with different participants
4. **Open scoreboard**: Navigate to `/scoreboard` 
5. **Verify**: Should show Player1 with correct marked square count
6. **Open player 2**: Open new tab, join as "Player2"
7. **Mark squares**: Mark some squares
8. **Refresh scoreboard**: Should show both players with current state
9. **Test winner**: Have one player get BINGO
10. **Verify**: Both players and scoreboard should show winner modal

### Test WebSocket Reliability
1. **Start game** with 2+ players
2. **Disconnect/reconnect** players
3. **Refresh pages** multiple times
4. **Navigate between routes**
5. **Verify**: State should persist and sync correctly

## Log Analysis

### Server Logs to Watch For
```
📋 Current state requested by client
📝 Stored marked square for PlayerName: index X
🎉 Processing BINGO_WINNER for: PlayerName
📤 Broadcasting BINGO_WINNER message to all clients
```

### Client Logs to Watch For
```
📋 CURRENT_STATE message received
📋 Scoreboard mounted - requesting current state...
🎉 BINGO_WINNER MESSAGE RECEIVED IN WEBSOCKET HOOK!
```

## Performance Notes

- Server maintains complete game state in memory
- State is sent to new connections automatically
- Message queue prevents race conditions
- Game state cleared on GAME_RESET

## Known Limitations

1. **Single Game Session**: Only one active game at a time
2. **Memory Storage**: Game state lost on server restart  
3. **No Authentication**: Anyone can reset game from scoreboard
4. **Browser Dependency**: Requires modern WebSocket support

## Deployment Considerations

1. **WebSocket Support**: Ensure proxy supports WebSocket upgrades
2. **SSL Configuration**: Use Cloudflare Flexible SSL for simplicity
3. **Process Management**: Use PM2 for automatic restarts
4. **Monitoring**: Watch server logs for connection issues

# Troubleshooting WebSocket Connection Issues

## Common WebSocket Connection Problems

### Error: "WebSocket is closed before the connection is established"

This error typically occurs when:

1. **WebSocket server is not running**
2. **Port conflicts**
3. **Browser security restrictions**
4. **Network connectivity issues**

### Issue: "Same person appears multiple times on scoreboard"

This issue has been resolved with improved player management:

1. **Server-side deduplication**: Players are tracked by name, not connection
2. **Automatic cleanup**: Disconnected players are removed properly
3. **Reconnection handling**: Page reloads update existing player instead of creating duplicates
4. **Client-side fallback**: Scoreboard shows unique players even if duplicates exist

## Step-by-Step Troubleshooting

### 1. Verify WebSocket Server is Running

```bash
# Check if the WebSocket server is running on port 8080
lsof -i :8080

# You should see output like:
# COMMAND   PID          USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
# node    82185 james.watling   15u  IPv6 0xe28025ed86677f7c      0t0  TCP *:http-alt (LISTEN)
```

If no output, start the WebSocket server:
```bash
node server.js
```

### 2. Check Server Logs

The WebSocket server should show:
```
WebSocket server running on port 8080
WebSocket server is ready for connections
```

When clients connect, you'll see:
```
New client connected
New player joined: PlayerName
```

When clients disconnect:
```
Client disconnected
Removing player: PlayerName
```

### 3. Verify Vite Development Server

```bash
# Check if Vite is running on port 5173
lsof -i :5173

# Start Vite if not running
npm run dev
```

### 4. Browser Developer Tools

1. Open browser Developer Tools (F12)
2. Go to **Console** tab
3. Look for WebSocket connection messages:
   - ✅ "WebSocket connection established"
   - ✅ "Registering player: PlayerName"
   - ❌ "WebSocket error:" or "WebSocket connection closed"

4. Go to **Network** tab
5. Filter by **WS** (WebSocket)
6. Look for connection to `ws://localhost:8080`

### 5. Test WebSocket Connection Manually

You can test the WebSocket connection using browser console:

```javascript
// Open browser console and run:
const ws = new WebSocket('ws://localhost:8080');
ws.onopen = () => console.log('✅ WebSocket connected');
ws.onerror = (error) => console.error('❌ WebSocket error:', error);
ws.onclose = (event) => console.log('WebSocket closed:', event.code, event.reason);

// Send a test message
ws.send(JSON.stringify({type: 'test', payload: 'hello'}));
```

### 6. Common Solutions

#### Solution 1: Restart Both Servers
```bash
# Stop all processes
pkill -f "node server.js"
pkill -f vite

# Start WebSocket server
node server.js &

# Start Vite server
npm run dev
```

#### Solution 2: Check Port Conflicts
```bash
# Check what's using port 8080
lsof -i :8080

# Check what's using port 5173
lsof -i :5173
```

#### Solution 3: Clear Browser Cache
1. Open Developer Tools
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

#### Solution 4: Try Different Browser
- Test in Chrome, Firefox, or Safari
- Disable browser extensions temporarily

#### Solution 5: Check Firewall/Antivirus
- Temporarily disable firewall
- Add exceptions for ports 8080 and 5173

### 7. Advanced Debugging

#### Enable Verbose WebSocket Logging

Add this to your browser console:
```javascript
// Enable WebSocket debugging
localStorage.setItem('debug', 'websocket');
```

#### Check Network Connectivity
```bash
# Test if port 8080 is accessible
telnet localhost 8080

# Should connect (Ctrl+C to exit)
```

#### Verify Server Response
```bash
# Check if server responds to HTTP requests
curl -v http://localhost:8080
# Should return HTTP 400 (expected for WebSocket endpoint)
```

## Application-Specific Features

### Player Management
The app now includes robust player management:
- **Unique players by name**: No duplicates on reconnection
- **Automatic cleanup**: Disconnected players are removed
- **Connection tracking**: Each player associated with their WebSocket
- **Graceful reconnection**: Page reloads update existing player data

### Reconnection Logic
The app includes automatic reconnection:
- **Max attempts**: 5
- **Delay**: 3 seconds between attempts
- **Manual reconnect**: Click "Reconnect" button
- **Connection stability**: Prevents rapid reconnection attempts

### Connection Status Indicators
- 🟢 **Connected**: Real-time features active
- 🔴 **Disconnected**: Limited functionality
- ⚠️ **Warning**: Connection issues detected

### Fallback Behavior
When disconnected:
- Game continues locally
- Scoreboard shows warning
- Host controls are disabled
- Manual reconnection available

### Duplicate Detection
The scoreboard now shows:
- **Unique Players**: Count of actual unique players
- **Total Connections**: All WebSocket connections
- **Duplicate Warning**: If duplicates are detected
- **Player IDs**: For debugging purposes

## Getting Help

If issues persist:

1. **Check server logs** for error messages
2. **Share browser console output** 
3. **Include network tab screenshots**
4. **Specify browser and OS version**
5. **Note if duplicates appear** in the scoreboard

## Quick Fix Checklist

- [ ] WebSocket server running on port 8080
- [ ] Vite server running on port 5173  
- [ ] No port conflicts
- [ ] Browser console shows no errors
- [ ] Network tab shows WebSocket connection
- [ ] Firewall allows connections
- [ ] Browser cache cleared
- [ ] No duplicate players on scoreboard

## Environment-Specific Notes

### Development
- Uses `ws://localhost:8080`
- Both servers must be running locally
- Player deduplication handled automatically

### Production
- Update WebSocket URL in `src/context/GameContext.tsx`
- Use `wss://` for secure connections
- Ensure WebSocket server is deployed and accessible
- Monitor for connection stability 