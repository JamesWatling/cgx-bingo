import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { GameEvent } from '../types';
import './EventsSidebar.css';

const EventsSidebar: React.FC = () => {
  const { state } = useGame();
  const eventsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest event (at the top)
  useEffect(() => {
    if (eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.events]);

  // Format event message for display
  const formatEventMessage = (event: GameEvent): string => {
    switch (event.type) {
      case 'player_joined':
        return `${event.playerName} joined the game`;
      case 'player_left':
        return `${event.playerName} left the game`;
      case 'square_marked':
        const prompt = event.details?.prompt || 'Unknown prompt';
        const participant = event.details?.participantName || 'Unknown';
        const shortPrompt = prompt.length > 40 ? prompt.substring(0, 37) + '...' : prompt;
        return `${event.playerName} marked "${shortPrompt}" with ${participant}`;
      case 'bingo_winner':
        return `🎉 ${event.playerName} got BINGO! 🎉`;
      case 'game_reset':
        return `Game was reset`;
      default:
        return `${event.playerName} performed ${event.type}`;
    }
  };

  // Get event icon
  const getEventIcon = (event: GameEvent): string => {
    switch (event.type) {
      case 'player_joined':
        return '👋';
      case 'player_left':
        return '👋';
      case 'square_marked':
        return '✓';
      case 'bingo_winner':
        return '🎉';
      case 'game_reset':
        return '🔄';
      default:
        return '📝';
    }
  };

  // Get events sorted by timestamp (newest first)
  const sortedEvents = [...state.events].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="events-sidebar">
      <div className="events-header">
        <h3>
          <span className="events-icon">📝</span>
          Live Events
        </h3>
        <div className="events-count">
          {state.events.length} events
        </div>
      </div>

      <div className="events-feed">
        <div ref={eventsEndRef} />
        {sortedEvents.length === 0 ? (
          <div className="no-events">
            <div className="no-events-icon">🎮</div>
            <p>No events yet...</p>
            <p className="no-events-subtitle">Waiting for players!</p>
          </div>
        ) : (
          <div className="events-list">
            {sortedEvents.map((event) => (
              <div 
                key={event.id}
                className={`event-item event-${event.type}`}
              >
                <div className="event-content">
                  <div className="event-main">
                    <span className="event-icon">
                      {getEventIcon(event)}
                    </span>
                    <span className="event-message">
                      {formatEventMessage(event)}
                    </span>
                  </div>
                  <div className="event-time">
                    {new Date(event.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </div>
                  {event.details?.answer && (
                    <div className="event-answer">
                      Answer: "{event.details.answer}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsSidebar; 