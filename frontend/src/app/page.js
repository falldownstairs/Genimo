"use client";
import React, { useEffect, useRef, useState } from "react";
import "../../src/test.css";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const videoRef = useRef(null);
  const params = useSearchParams();

  useEffect(() => {
    const loadedSessionId = params.get("session");
    if (loadedSessionId == null) {
      const fetchSession = async () => {
        const response = await fetch("http://127.0.0.1:5000/getsession");
        const data = await response.json();
        setSessionId(data._id["$oid"].toString());
        setMessages(data.messages);
      };
      fetchSession();
    } else {
      const fetchSession = async () => {
        const response = await fetch(
          `http://127.0.0.1:5000/getsession?session=${loadedSessionId}`
        );
        const data = await response.json();
        setSessionId(data._id["$oid"].toString());
        setMessages(data.messages);
      };
      fetchSession();
      console.log(sessionId);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputMessage == "") {
      return;
    }
    setMessages([...messages, { user: inputMessage }]);
    const res = await fetch(
      `http://127.0.0.1:5000/messages?session=${sessionId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // For sending JSON data
        },
        body: JSON.stringify({
          // Your data here:
          msg: inputMessage,
        }),
      }
    );
    if (res.ok) {
      setMessages([...messages, res.json().msg]);
    }
  };

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
}
