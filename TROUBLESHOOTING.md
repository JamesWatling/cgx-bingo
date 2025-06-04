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