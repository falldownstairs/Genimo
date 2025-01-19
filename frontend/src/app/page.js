"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import "../../src/test.css";

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
                const response = await fetch(
                    "http://127.0.0.1:2341/getsession"
                );
                const data = await response.json();
                setSessionId(data._id["$oid"].toString());
                setMessages(data.messages);
            };
            fetchSession();
        } else {
            const fetchSession = async () => {
                const response = await fetch(
                    `http://127.0.0.1:2341/getsession?session=${loadedSessionId}`
                );
                const data = await response.json();
                setSessionId(data._id["$oid"].toString());
                setMessages(data.messages);
            };
            fetchSession();
        }
    }, [params]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (inputMessage.trim() === "" || isLoading) {
            return;
        }

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
            const res = await fetch(
                `http://127.0.0.1:2341/messages?session=${sessionId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        msg: inputMessage,
                    }),
                }
            );

            if (res.ok) {
                const result = await res.json();

                if (result.msg.bot.startsWith("/video/")) {
                    // If the response contains a video URL
                    setVideoUrl(`http://127.0.0.1:2341${result.msg.bot}`);
                } else {
                    // If it's a text message
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: Date.now(),
                            text: result.msg.bot,
                            sender: "bot",
                            timestamp: new Date().toLocaleTimeString(),
                        },
                    ]);
                }
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsLoading(false);
        }
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
                                message.sender === "user"
                                    ? "user-message"
                                    : "system-message"
                            }`}
                        >
                            <div className="message-bubble">
                                <p>{message.text}</p>
                                <span className="timestamp">
                                    {message.timestamp}
                                </span>
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
                        <video
                            ref={videoRef}
                            controls
                            className="video-player"
                            src={videoUrl}
                        >
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
