import React, { useEffect, useState, useRef, useContext } from "react";
import axios from "axios";
import io from "socket.io-client";
import { toast } from "react-toastify";
import "./Chat.css";
import { StoreContext } from "../../context/StoreContext";
import { IoSend } from "react-icons/io5";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { token, user, loading } = useContext(StoreContext);
  const chatContainerRef = useRef(null);

  const BACKEND_URL = "http://localhost:4000";

  useEffect(() => {
    if (!token || !user || loading) return;

    const setupChat = async () => {
      try {
        const init = await axios.post(
          `${BACKEND_URL}/api/chat/user/initialize`,
          { userName: user.name },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const convId = init.data.conversationId;
        setConversationId(convId);

        const newSocket = io(BACKEND_URL, { auth: { token } });
        setSocket(newSocket);

        newSocket.on("connect", () => {
          setIsConnected(true);
          newSocket.emit("join_chat", convId);
        });

        newSocket.on("joined_chat", () => setIsInitialized(true));

        newSocket.on("receive_message", (msg) => {
          setMessages((prev) => [...prev, msg]);
        });

      } catch (err) {
        setError("Gagal menghubungkan chat");
      }
    };

    setupChat();

    return () => socket?.disconnect();
  }, [token, user, loading]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    if (!socket || !conversationId) return;

    socket.emit("send_message", {
      conversationId,
      message: inputMessage.trim(),
      senderName: user.name,
      senderId: user._id,
      senderType: "User",
    });

    setInputMessage("");
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) return <div className="chat-container">Memuat...</div>;
  if (error) return <div className="chat-container chat-error">{error}</div>;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat Bantuan</h2>
        <span className={isConnected ? "online" : "offline"}>
          ● {isConnected ? "Terhubung" : "Menghubungkan"}
        </span>
      </div>

      <div className="chat-messages" ref={chatContainerRef}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-message ${
              msg.senderType === "User" ? "user" : "admin"
            }`}
          >
            <div className="chat-bubble">
              <div className="sender">
                {msg.senderType === "User" ? "Anda" : "Admin"}
              </div>

              <div className="text">{msg.message}</div>

              <div className="time">{formatTime(msg.timestamp)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input-wrapper">
        <input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ketik pesan..."
        />
        <button onClick={sendMessage}>
          <IoSend />
        </button>
      </div>
    </div>
  );
};

export default Chat;
