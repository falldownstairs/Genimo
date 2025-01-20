import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./test.css";

const VideoChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const videoRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Fetch session ID on component mount
  useEffect(() => {
    setSessionId(searchParams.get("session"));

    if (sessionId == null) {
      const fetchSession = async () => {
        const response = await fetch("http://localhost:2341/getsession");
        const data = await response.json();
        setSessionId(data._id);
        setSearchParams({ session: `${sessionId}` });
      };
      fetchSession();
    } else {
      const fetchSession = async () => {
        const response = await fetch(
          `http://localhost:2341/getsession?session=${sessionId}`
        );
        const data = await response.json();
        setSessionId(data._id);
      };
      fetchSession();
    }
  }, []);

  // Function to send a message to the backend
  const handleSubmit = async (e) => {
    // e.preventDefault();
    // if (!inputMessage.trim() || isLoading) return;
    // const newMessage = {
    //   id: Date.now(),
    //   text: inputMessage,
    //   sender: "user",
    //   timestamp: new Date().toLocaleTimeString(),
    // };
    // setMessages((prev) => [...prev, newMessage]);
    // setInputMessage("");
    // setIsLoading(true);
    // try {
    //   const response = await fetch(
    //     `http://localhost:2341/messages?session=${sessionId}`,
    //     {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({ msg: inputMessage }),
    //     }
    //   );
    //   const result = await response.json();
    //   if (result.video_url) {
    //     pollForVideo(result.video_url);
    //   } else {
    //     setMessages((prev) => [
    //       ...prev,
    //       {
    //         id: Date.now(),
    //         text: result,
    //         sender: "bot",
    //         timestamp: new Date().toLocaleTimeString(),
    //       },
    //     ]);
    //     setIsLoading(false);
    //   }
    // } catch (error) {
    //   console.error("Error sending message:", error);
    //   setIsLoading(false);
    // }
  };

  // // Poll the backend for video availability
  // const pollForVideo = (videoUrl) => {
  //   const interval = setInterval(async () => {
  //     try {
  //       const response = await fetch(`http://localhost:2341${videoUrl}`);
  //       if (response.ok) {
  //         setVideoUrl(`http://localhost:2341${videoUrl}`);
  //         setIsLoading(false);
  //         clearInterval(interval);
  //       }
  //     } catch {
  //       // Keep polling if the video is not ready
  //     }
  //   }, 5000);
  // };

  return (
    <div className="app-container">
      {/* Messages Section */}
      <div className="messages-section">
        <div className="messages-display">
          {/* {messages.map((message) => (
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
          ))} */}
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
            <button type="submit" disabled={isLoading} className="send-button">
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Video Section */}
      <div className="video-section">
        <div className="video-container">
          {videoUrl ? (
            <video controls width="600" src={videoUrl}>
              Your browser does not support the video tag.
            </video>
          ) : (
            <p>No video available yet...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoChatInterface;
