import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import { toast } from "react-toastify";
import "./AdminChat.css";
import { IoSend } from "react-icons/io5";

const BACKEND_URL = "http://localhost:4000";

const AdminChat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const chatContainerRef = useRef(null);

  const token = localStorage.getItem("authToken");

  const fetchConversations = async () => {
    if (!token) {
      toast.error("Tidak ada token admin. Silakan login.");
      return;
    }
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/chat/admin/conversations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.data.success) {
        const sortedConversations = response.data.data.sort(
          (a, b) =>
            new Date(b.lastMessageAt || b.updatedAt) -
            new Date(a.lastMessageAt || a.updatedAt),
        );
        setConversations(sortedConversations);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      toast.error("Gagal mengambil daftar percakapan.");
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!selectedChat || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io(BACKEND_URL, { auth: { token } });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Admin connected to socket");
      setIsConnected(true);
      newSocket.emit("join_chat", selectedChat);
      fetchChatHistory(selectedChat, token);
    });

    newSocket.on("receive_message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
      fetchConversations();
    });

    newSocket.on("disconnect", () => {
      console.log("Admin disconnected from socket");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection failed:", err.message);
      setIsConnected(false);
      toast.error("Gagal terhubung ke chat.");
    });

    newSocket.on("error_message", (errorMsg) => {
      toast.error(errorMsg);
    });

    return () => {
      newSocket.disconnect();
      setIsConnected(false);
    };
  }, [selectedChat, token]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchChatHistory = async (id, authToken) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/chat/admin/history`,
        { conversationId: id },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      if (response.data.success) {
        setMessages(response.data.data);
      } else {
        if (response.data.message !== "Percakapan tidak ditemukan") {
          toast.error(response.data.message);
        }
      }
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      toast.error("Gagal mengambil riwayat chat.");
    }
  };

  const sendMessage = () => {
    if (
      inputMessage.trim() === "" ||
      !socket ||
      !selectedChat ||
      !isConnected
    ) {
      if (!isConnected) {
        toast.error("Tidak terhubung ke chat. Coba lagi.");
      }
      return;
    }

    const messageToSend = {
      conversationId: selectedChat,
      message: inputMessage.trim(),
    };

    socket.emit("send_message", messageToSend);
    setInputMessage("");
  };

  const clearAllChats = async () => {
    if (!window.confirm("Yakin mau hapus semua chat?")) return;
    try {
      const response = await axios.delete(
        `${BACKEND_URL}/api/chat/admin/clear-all`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.data.success) {
        toast.success("Semua chat berhasil dihapus!");
        setConversations([]);
        setMessages([]);
        setSelectedChat(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Gagal hapus semua chat:", error);
      toast.error("Gagal menghapus semua chat.");
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return formatTime(timestamp);
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Kemarin";
    } else {
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
      });
    }
  };

  const selectedConversation = conversations.find(
    (conv) => conv.conversationId === selectedChat,
  );

  const getSenderDisplayName = (msg) => {
    if (!msg) return "";
    if (msg.senderType === "Admin") return "Anda";
    if (msg.senderName) return msg.senderName;
    return selectedConversation?.userName || "Pengguna";
  };

  const getLastMessage = (conv) => {
    if (!conv.messages || conv.messages.length === 0) {
      return "Belum ada pesan";
    }
    const lastMsg = conv.messages[conv.messages.length - 1];
    const preview =
      lastMsg.message.length > 50
        ? lastMsg.message.substring(0, 50) + "..."
        : lastMsg.message;
    const senderPrefix = lastMsg.senderType === "Admin" ? "Anda: " : "";
    return senderPrefix + preview;
  };

  return (
    <div className="admin-chat-container">
      <div className="conversation-list-panel">
        <div className="panel-header">
          <h3 className="panel-title">Daftar Chat</h3>
          <div className="connection-status">
            <span
              className={`status-indicator ${isConnected ? "connected" : "disconnected"}`}
            >
              {isConnected ? "🟢" : "🔴"}
            </span>
          </div>
        </div>

        <button onClick={clearAllChats} className="clear-all-btn">
          Hapus Semua Chat
        </button>

        {conversations.length > 0 ? (
          <div className="conversations-list">
            {conversations.map((conv) => (
              <div
                key={conv.conversationId}
                className={`conversation-item ${selectedChat === conv.conversationId ? "active" : ""}`}
                onClick={() => {
                  setSelectedChat(conv.conversationId);
                  setMessages([]);
                }}
              >
                <div className="conversation-header">
                  <span className="conversation-user-name">
                    {conv.userName ||
                      `User ${conv.conversationId.slice(5, 13)}...`}
                  </span>
                  <span className="conversation-time">
                    {formatDate(conv.lastMessageAt || conv.updatedAt)}
                  </span>
                </div>
                <div className="last-message-preview">
                  {getLastMessage(conv)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-conversations">Tidak ada chat aktif.</div>
        )}
      </div>

      <div className="chat-window-panel">
        {!selectedChat ? (
          <div className="chat-placeholder">
            <h3>💬 Admin Chat Panel</h3>
            <p>Pilih chat dari daftar untuk melihat percakapan.</p>
          </div>
        ) : (
          <div className="chat-container">
            <div className="chat-header">
              <h3 className="chat-title">
                Chat dengan{" "}
                {selectedConversation?.userName ||
                  `User ${selectedChat.slice(5, 13)}...`}
              </h3>
              <div className="connection-indicator">
                <span
                  className={`status-dot ${isConnected ? "connected" : "disconnected"}`}
                ></span>
                {isConnected ? "Terhubung" : "Terputus"}
              </div>
            </div>

            <div ref={chatContainerRef} className="chat-messages">
              {messages.length > 0 ? (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`chat-message ${msg.senderType === "Admin" ? "admin" : "user"}`}
                  >
                    <div className="chat-bubble">
                      <div className="chat-sender">
                        {getSenderDisplayName(msg)}
                      </div>
                      <div className="chat-text">{msg.message}</div>
                      <div className="chat-timestamp">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="chat-empty">
                  <p>Belum ada percakapan.</p>
                  <p>Mulai dengan mengirim pesan pertama!</p>
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
                placeholder={
                  isConnected ? "Ketik pesan..." : "Menghubungkan..."
                }
                disabled={!isConnected}
              />
              <button
                onClick={sendMessage}
                className="chat-send-btn"
                disabled={!isConnected || inputMessage.trim() === ""}
              >
                <IoSend size={24} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChat;
