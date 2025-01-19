import React, { useState, useRef } from 'react';
import './test.css';

const VideoChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const videoRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);
  };

  return (
    <div className="app-container">
      {/* Messages Section */}
      <div className="messages-section">
        <div className="messages-display">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-wrapper ${
                message.sender === 'user' ? 'user-message' : 'system-message'
              }`}
            >
              <div className="message-bubble">
                <p>{message.text}</p>
                <span className="timestamp">{message.timestamp}</span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message-wrapper system-message">
              <div className="message-bubble">
                <p>Processing...</p>
              </div>
            </div>
          )}
        </div>

        <div className="input-section">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="message-input"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="send-button"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Video Section */}
      <div className="video-section">
        <div className="video-container">
        </div>
      </div>
      <div>
      </div>
    </div>
    

  );

};

export default VideoChatInterface;