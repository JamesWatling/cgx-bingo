import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketMessage } from '../types';

interface UseWebSocketReturn {
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: MessageEvent | null;
  isConnected: boolean;
  reconnect: () => void;
}

const isDevelopment = process.env.NODE_ENV === 'development';

export const useWebSocket = (url: string): UseWebSocketReturn => {
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);
  const lastConnectAttemptRef = useRef(0);
  const messageQueueRef = useRef<MessageEvent[]>([]);
  const processingRef = useRef(false);
  const maxReconnectAttempts = 5;
  const reconnectDelay = isDevelopment ? 5000 : 3000; // Longer delay in development
  const minConnectInterval = isDevelopment ? 2000 : 1000; // Longer interval in development

  // Process queued messages sequentially
  const processMessageQueue = useCallback(() => {
    if (processingRef.current || messageQueueRef.current.length === 0) {
      return;
    }
    
    processingRef.current = true;
    const message = messageQueueRef.current.shift();
    
    if (message) {
      console.log('🔄 Processing queued message:', message.data);
      setLastMessage(message);
      
      // Process next message after a small delay to ensure React state updates
      setTimeout(() => {
        processingRef.current = false;
        processMessageQueue();
      }, 10);
    } else {
      processingRef.current = false;
    }
  }, []);

  const connect = useCallback(() => {
    const now = Date.now();
    
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      if (isDevelopment) console.log('Connection attempt already in progress, skipping...');
      return;
    }

    // Prevent rapid reconnection attempts
    if (now - lastConnectAttemptRef.current < minConnectInterval) {
      if (isDevelopment) console.log('Too soon for another connection attempt, waiting...');
      return;
    }

    try {
      isConnectingRef.current = true;
      lastConnectAttemptRef.current = now;
      console.log(`Attempting to connect to WebSocket: ${url}`);
      
      // Close existing connection if any
      if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
        socketRef.current.close();
      }

      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
      };

      ws.onmessage = (event: MessageEvent) => {
        console.log('🔌 Raw WebSocket message received:', event.data);
        try {
          const parsedMessage = JSON.parse(event.data);
          console.log('🔌 Parsed WebSocket message:', parsedMessage.type, parsedMessage.payload);
          
          // Special logging for BINGO_WINNER messages
          if (parsedMessage.type === 'BINGO_WINNER') {
            console.log('🎉🔌 BINGO_WINNER MESSAGE RECEIVED IN WEBSOCKET HOOK!');
            console.log('🎉🔌 Winner name:', parsedMessage.payload);
            console.log('🎉🔌 About to queue message for processing...');
          }
        } catch (e) {
          console.log('🔌 Failed to parse WebSocket message:', e);
        }
        
        // Queue the message for sequential processing
        messageQueueRef.current.push(event);
        processMessageQueue();
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setIsConnected(false);
        isConnectingRef.current = false;
      };

      ws.onclose = (event) => {
        if (isDevelopment) {
          console.log('WebSocket connection closed:', event.code, event.reason);
        }
        setIsConnected(false);
        isConnectingRef.current = false;
        
        // Only attempt to reconnect if it wasn't a manual close and we haven't exceeded max attempts
        // Also check if this was an unexpected close (not code 1000 or 1001)
        if (event.code !== 1000 && event.code !== 1001 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts}) in ${reconnectDelay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached. Please refresh the page or click reconnect.');
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, [url, reconnectDelay, minConnectInterval, processMessageQueue]);

  const reconnect = useCallback(() => {
    console.log('Manual reconnection requested');
    
    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Close existing connection
    if (socketRef.current) {
      socketRef.current.close(1000, 'Manual reconnection');
    }
    
    // Reset state
    reconnectAttemptsRef.current = 0;
    isConnectingRef.current = false;
    setIsConnected(false);
    
    // Attempt to reconnect after a short delay
    setTimeout(() => {
      connect();
    }, 500);
  }, [connect]);

  useEffect(() => {
    // Only connect once when the component mounts
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounting');
      }
      isConnectingRef.current = false;
    };
  }, []); // Remove 'connect' from dependencies to prevent reconnection loops

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(message));
        if (isDevelopment) console.log('Sent WebSocket message:', message.type);
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    } else {
      if (isDevelopment) console.warn('WebSocket is not connected. Message not sent:', message.type);
    }
  }, []);

  return { sendMessage, lastMessage, isConnected, reconnect };
};