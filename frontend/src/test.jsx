import React, { useEffect, useRef, useState } from "react";
import "./test.css";

const VideoChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const videoRef = useRef(null);

  // Fetch or create session on load
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await fetch("http://localhost:2341/getsession");
        if (response.ok) {
          const session = await response.text();
          setSessionId(session);
        } else {
          console.error("Failed to initialize session");
        }
      } catch (error) {
        console.error("Error initializing session:", error);
      }
    };

    initializeSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Send the message to the backend
      const response = await fetch(
        `http://localhost:2341/messages?session=${sessionId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ msg: inputMessage }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Poll for video after sending the message
      pollForVideo();
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
    }
  };

  const pollForVideo = async () => {
    const pollInterval = 5000; // 5 seconds
    const maxRetries = 24; // ~2 minutes
    let retries = 0;

    const checkVideo = async () => {
      try {
        const response = await fetch(
          `http://localhost:2341/messages?session=${sessionId}`
        );
        if (response.ok) {
          const data = await response.json();
          const videoName = data.video; // Assuming backend sends video filename

          if (videoName) {
            const videoUrl = `http://localhost:2341/video/${videoName}`;
            setVideoUrl(videoUrl);
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching video:", error);
      }

      retries++;
      if (retries < maxRetries) {
        setTimeout(checkVideo, pollInterval);
      } else {
        console.error("Video processing timed out");
        setIsLoading(false);
      }
    };

    checkVideo();
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
                message.sender === "user" ? "user-message" : "system-message"
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
          {videoUrl ? (
            <video controls width="600">
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            isLoading && <p>Loading video...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoChatInterface;
