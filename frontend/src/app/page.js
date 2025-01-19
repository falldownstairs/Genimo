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
    const processingMessageId = useRef(null);

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

    const addProcessingMessage = (text) => {
        const newMessage = {
            id: Date.now(),
            text: text,
            sender: "bot",
            timestamp: new Date().toLocaleTimeString(),
            isProcessing: true,
        };
        processingMessageId.current = newMessage.id;
        setMessages((prev) => [...prev, newMessage]);
    };

    const updateProcessingMessage = (text) => {
        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === processingMessageId.current ? { ...msg, text } : msg
            )
        );
    };

    const removeProcessingMessages = () => {
        setMessages((prev) => prev.filter((msg) => !msg.isProcessing));
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
            // Add initial processing message
            addProcessingMessage("Thinking...");

            const eventSource = new EventSource(
                `http://127.0.0.1:2341/messages/stream?session=${sessionId}&msg=${encodeURIComponent(
                    inputMessage
                )}`
            );

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.type === "status") {
                    updateProcessingMessage(data.message);
                } else if (data.type === "video") {
                    eventSource.close();
                    removeProcessingMessages();
                    setVideoUrl(`http://127.0.0.1:2341${data.url}`);
                } else if (data.type === "message") {
                    eventSource.close();
                    removeProcessingMessages();
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: Date.now(),
                            text: data.message,
                            sender: "bot",
                            timestamp: new Date().toLocaleTimeString(),
                        },
                    ]);
                }
            };

            eventSource.onerror = () => {
                eventSource.close();
                setIsLoading(false);
                removeProcessingMessages();
            };
        } catch (error) {
            console.error("Error sending message:", error);
            setIsLoading(false);
            removeProcessingMessages();
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
            {/* Messages Section */}
            <div
                className="messages-section"
                style={{ width: `${chatWidth}%` }}
            >
                <div className="messages-display">
                    {messages.map((message) => (
                        <div
                            key={messages.indexOf(message)}
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
                    {isLoading && (
                        <div className="message-wrapper system-message">
                            {/* <div className="message-bubble">
                                <p>Processing...</p>
                            </div> */}
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

            {/* Divider */}
            <div className="divider" onMouseDown={startDragging}></div>

            {/* Video Section */}
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
