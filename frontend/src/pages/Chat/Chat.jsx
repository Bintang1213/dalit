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

  const initializeChat = async () => {
    if (!token || !user) return false;

    try {
      console.log("Initializing chat for user:", user._id);

      const response = await axios.post(
        `${BACKEND_URL}/api/chat/user/initialize`,
        { userName: user.name },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        const newConversationId = response.data.conversationId;
        setConversationId(newConversationId);
        console.log("Chat initialized with conversationId:", newConversationId);
        return newConversationId;
      } else {
        console.error("Failed to initialize chat:", response.data.message);
        setError("Gagal menginisialisasi chat: " + response.data.message);
        return false;
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
      setError(
        "Gagal menginisialisasi chat: " +
          (error.response?.data?.message || error.message),
      );
      return false;
    }
  };

  useEffect(() => {
    const resetChatState = () => {
      setMessages([]);
      setIsConnected(false);
      setError(null);
      setConversationId(null);
      setIsInitialized(false);

      if (socket) {
        console.log("Disconnecting old socket...");
        socket.disconnect();
        setSocket(null);
      }
    };

    if (loading) {
      console.log("Still loading user data...");
      return;
    }

    if (!token || !user) {
      resetChatState();
      setError("Harap login untuk memulai chat.");
      return;
    }

    resetChatState();

    const setupChat = async () => {
      console.log("Setting up chat for user:", user._id);

      const initConversationId = await initializeChat();
      if (!initConversationId) {
        return;
      }

      console.log("Creating socket connection...");
      const newSocket = io(BACKEND_URL, {
        auth: { token },
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
      });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Socket connected, joining chat:", initConversationId);
        setIsConnected(true);
        setError(null);

        newSocket.emit("join_chat", initConversationId);
      });

      newSocket.on("joined_chat", (data) => {
        console.log("Successfully joined chat:", data);
        setIsInitialized(true);
        fetchChatHistory();
      });

      newSocket.on("receive_message", (message) => {
        console.log("Received message:", message);
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      newSocket.on("error_message", (errorMsg) => {
        console.error("Socket error message:", errorMsg);
        toast.error(errorMsg);
        setError(errorMsg);
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket connection failed:", err.message);
        setIsConnected(false);
        setError("Gagal terhubung ke server chat: " + err.message);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        setIsConnected(false);
        setIsInitialized(false);
      });
    };

    setupChat();

    return () => {
      console.log("Cleaning up chat component...");
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token, user, loading]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchChatHistory = async () => {
    if (!token) {
      console.log("No token available for fetching chat history");
      return;
    }

    try {
      console.log("Fetching chat history...");
      const response = await axios.get(`${BACKEND_URL}/api/chat/user/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        console.log(
          "Chat history loaded:",
          response.data.data.length,
          "messages",
        );
        setMessages(response.data.data);
      } else {
        console.warn("No chat history found:", response.data.message);
        if (!response.data.message.includes("tidak ditemukan")) {
          setError(response.data.message);
        }
      }
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      const errorMsg = error.response?.data?.message || error.message;
      setError("Gagal mengambil riwayat chat: " + errorMsg);
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim()) {
      console.log("Empty message, not sending");
      return;
    }

    if (!socket || !isConnected || !isInitialized) {
      toast.error(
        "Tidak terhubung ke chat. Silakan tunggu atau refresh halaman.",
      );
      return;
    }

    if (!user || !conversationId) {
      toast.error("Data user atau chat belum siap. Silakan refresh halaman.");
      return;
    }

    console.log("Sending message to:", conversationId);

    const messageToSend = {
      conversationId: conversationId,
      message: inputMessage.trim(),
      senderName: user.name,
      senderId: user._id,
      senderType: "User",
    };

    socket.emit("send_message", messageToSend);
    setInputMessage("");
  };

  const retryConnection = () => {
    setError(null);
    window.location.reload();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="chat-container">
        <div className="chat-loading">Memuat data user...</div>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="chat-container">
        <div className="chat-error">Harap login untuk memulai chat.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-container">
        <div className="chat-error">
          {error}
          <button onClick={retryConnection} className="retry-btn">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2 className="chat-title">Chat Bantuan</h2>
        <div className="connection-status">
          {isConnected && isInitialized ? (
            <span className="status-connected">● Terhubung</span>
          ) : (
            <span className="status-connecting">● Menghubungkan...</span>
          )}
        </div>
      </div>

      {isConnected && isInitialized ? (
        <>
          <div ref={chatContainerRef} className="chat-messages">
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div
                  key={`${msg.timestamp}-${index}`}
                  className={`chat-message ${
                    msg.senderType === "User" ? "user" : "admin"
                  }`}
                >
                  <div className="chat-bubble">
                    <div className="chat-sender">
                      {msg.senderType === "User"
                        ? "Anda"
                        : msg.senderName || "Admin"}
                    </div>
                    <div className="message-text">{msg.message}</div>
                    <div className="chat-timestamp">
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="chat-empty">
                Mulai percakapan dengan mengirim pesan!
              </div>
            )}
          </div>
          <div className="chat-input-container">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              className="chat-input"
              placeholder="Ketik pesan..."
              disabled={!isConnected || !isInitialized}
            />
            <button
              onClick={sendMessage}
              className="chat-send-btn"
              disabled={!isConnected || !isInitialized || !inputMessage.trim()}
            >
              <IoSend />
            </button>
          </div>
        </>
      ) : (
        <div className="chat-loading">
          Menghubungkan ke chat...
          {conversationId && (
            <div className="debug-info">Chat ID: {conversationId}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Chat;
