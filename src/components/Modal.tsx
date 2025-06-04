import React, { useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: string[];
  onSelect: (participantName: string, answer?: string) => void;
  question?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, participants, onSelect, question }) => {
  const [participantName, setParticipantName] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [useCustomName, setUseCustomName] = useState<boolean>(false);

  // Auto-switch to custom name mode if no participants are available
  React.useEffect(() => {
    if (isOpen && participants.length === 0) {
      setUseCustomName(true);
    }
  }, [isOpen, participants.length]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!participantName.trim()) {
      setError('Please enter a participant name');
      return;
    }

    if (participantName.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }

    onSelect(participantName.trim(), answer.trim() || undefined);
    
    // Reset form
    setParticipantName('');
    setAnswer('');
    setError('');
    setUseCustomName(false);
  };

  const handleParticipantSelect = (name: string) => {
    setParticipantName(name);
    setError('');
  };

  const handleClose = () => {
    setParticipantName('');
    setAnswer('');
    setError('');
    setUseCustomName(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Mark Square</h3>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {question && (
            <div className="question-display">
              <p><strong>Question:</strong> {question}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Who did this apply to?</label>
              
              <div className="participant-selection">
                <div className="selection-toggle">
                  <button
                    type="button"
                    className={`toggle-button ${!useCustomName ? 'active' : ''}`}
                    onClick={() => setUseCustomName(false)}
                    disabled={participants.length === 0}
                  >
                    Choose from list {participants.length === 0 ? '(none available)' : `(${participants.length})`}
                  </button>
                  <button
                    type="button"
                    className={`toggle-button ${useCustomName ? 'active' : ''}`}
                    onClick={() => setUseCustomName(true)}
                  >
                    Type custom name
                  </button>
                </div>

                {useCustomName ? (
                  <div className="custom-name-input">
                    <input
                      type="text"
                      value={participantName}
                      onChange={(e) => {
                        setParticipantName(e.target.value);
                        setError('');
                      }}
                      placeholder="Enter participant name..."
                      className="participant-input"
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="participant-grid">
                    {participants.length > 0 ? (
                      participants.map((name) => (
                        <button
                          key={name}
                          type="button"
                          className={`participant-button ${participantName === name ? 'selected' : ''}`}
                          onClick={() => handleParticipantSelect(name)}
                        >
                          {name}
                        </button>
                      ))
                    ) : (
                      <div className="no-participants-message">
                        <p>No other participants are currently active.</p>
                        <p>Switch to "Type custom name" to enter a name manually.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label>Additional details (optional):</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Add any additional details..."
                className="answer-input"
                rows={3}
                maxLength={200}
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="modal-actions">
              <button type="button" onClick={handleClose} className="cancel-button">
                Cancel
              </button>
              <button type="submit" className="confirm-button">
                Mark Square
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Modal;