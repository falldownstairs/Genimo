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
    const [chatWidth, setChatWidth] = useState(33.333);
    const videoRef = useRef(null);
    const params = useSearchParams();
    const isDragging = useRef(false);

    // Constants
    const PROCESSING_MESSAGE_ID = "processing-message";
    const PORT = process.env.PORT || 2341;

    useEffect(() => {
        const loadedSessionId = params.get("session");
        if (loadedSessionId == null) {
            const fetchSession = async () => {
                const response = await fetch(
                    `http://localhost:${PORT}/getsession`
                );
                const data = await response.json();
                setSessionId(data._id["$oid"].toString());
                setMessages(data.messages);
            };
            fetchSession();
        } else {
            const fetchSession = async () => {
                const response = await fetch(
                    `http://localhost:${PORT}/getsession?session=${loadedSessionId}`
                );
                const data = await response.json();
                setSessionId(data._id["$oid"].toString());
                setMessages(data.messages);
            };
            fetchSession();
        }
    }, [params]);

    const addProcessingMessage = (text) => {
        const processingMessage = {
            id: PROCESSING_MESSAGE_ID,
            text: text,
            sender: "bot",
            timestamp: new Date().toLocaleTimeString(),
            isProcessing: true,
        };
        setMessages((prev) => [...prev, processingMessage]);
    };

    const updateProcessingMessage = (text) => {
        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === PROCESSING_MESSAGE_ID ? { ...msg, text } : msg
            )
        );
    };

    const removeProcessingMessage = () => {
        setMessages((prev) =>
            prev.filter((msg) => msg.id !== PROCESSING_MESSAGE_ID)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (inputMessage.trim() === "" || isLoading) return;

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
            const eventSource = new EventSource(
                `http://localhost:${PORT}/messages/stream?session=${sessionId}&msg=${encodeURIComponent(
                    inputMessage
                )}`
            );

            // Add initial processing message
            addProcessingMessage("Thinking...");

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.type === "status") {
                    updateProcessingMessage(data.message);
                } else if (data.type === "video") {
                    eventSource.close();
                    removeProcessingMessage();
                    setIsLoading(false);
                    setVideoUrl(`http://localhost:${PORT}${data.url}`);
                } else if (data.type === "message") {
                    eventSource.close();
                    removeProcessingMessage();
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: Date.now(),
                            text: data.message,
                            sender: "bot",
                            timestamp: new Date().toLocaleTimeString(),
                        },
                    ]);
                    setIsLoading(false);
                }
            };

            eventSource.onerror = () => {
                eventSource.close();
                setIsLoading(false);
                removeProcessingMessage();
            };
        } catch (error) {
            console.error("Error sending message:", error);
            setIsLoading(false);
            removeProcessingMessage();
        }
    };

    const handleDrag = (e) => {
        if (!isDragging.current) return;
        const newChatWidth = (e.clientX / window.innerWidth) * 100;
        if (newChatWidth >= 20 && newChatWidth <= 70) {
            setChatWidth(newChatWidth);
        }
    };

    const stopDragging = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", handleDrag);
        document.removeEventListener("mouseup", stopDragging);
    };

    const startDragging = () => {
        isDragging.current = true;
        document.addEventListener("mousemove", handleDrag);
        document.addEventListener("mouseup", stopDragging);
    };

    return (
        <div className="app-container">
            <div
                className="messages-section"
                style={{ width: `${chatWidth}%` }}
            >
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
                                <p style={{ whiteSpace: "pre-wrap" }}>
                                    {message.text}
                                </p>
                                <span className="timestamp">
                                    {message.timestamp}
                                </span>
                            </div>
                        </div>
                    ))}
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

            <div className="divider" onMouseDown={startDragging}></div>

            <div
                className="video-section"
                style={{ width: `${100 - chatWidth}%` }}
            >
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
