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

  const [readByAdmin, setReadByAdmin] = useState({}); // ✅ penting

  const chatContainerRef = useRef(null);
  const token = localStorage.getItem("authToken");

  /* ================= FETCH LIST ================= */
  const fetchConversations = async () => {
    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/chat/admin/conversations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setConversations(
          res.data.data.sort(
            (a, b) =>
              new Date(b.lastMessageAt || b.updatedAt) -
              new Date(a.lastMessageAt || a.updatedAt)
          )
        );
      }
    } catch {
      toast.error("Gagal mengambil daftar chat");
    }
  };

  useEffect(() => {
    fetchConversations();
    const i = setInterval(fetchConversations, 30000);
    return () => clearInterval(i);
  }, []);

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!selectedChat) return;

    const s = io(BACKEND_URL, { auth: { token } });
    setSocket(s);

    s.on("connect", () => {
      setIsConnected(true);
      s.emit("join_chat", selectedChat);
      fetchChatHistory(selectedChat);

      // ✅ tandai chat SUDAH DIBACA ADMIN
      setReadByAdmin((prev) => ({
        ...prev,
        [selectedChat]: true,
      }));
    });

    s.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      fetchConversations();
    });

    s.on("disconnect", () => setIsConnected(false));

    return () => s.disconnect();
  }, [selectedChat]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const fetchChatHistory = async (id) => {
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/chat/admin/history`,
        { conversationId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) setMessages(res.data.data);
    } catch {
      toast.error("Gagal mengambil riwayat chat");
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !socket) return;
    socket.emit("send_message", {
      conversationId: selectedChat,
      message: inputMessage,
    });
    setInputMessage("");
  };

  /* ================= HELPER ================= */
  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const isUnread = (conv) => {
    const lastMsg = conv.messages?.at(-1);
    if (!lastMsg) return false;
    if (lastMsg.senderType === "Admin") return false;
    return !readByAdmin[conv.conversationId];
  };

  const getCheckIcon = (msg) => {
    if (msg.senderType !== "Admin") return null;

    // simulasi status
    if (!isConnected) return "✔";
    if (readByAdmin[selectedChat]) return "✔✔ blue";
    return "✔✔";
  };

  return (
    <div className="main-content">
      <div className="admin-chat-container">
        {/* ===== LEFT ===== */}
        <div className="conversation-list-panel">
          <h3>Daftar Chat</h3>

          <div className="conversations-list">
            {conversations.map((conv) => {
              const unread = isUnread(conv);

              return (
                <div
                  key={conv.conversationId}
                  className={`conversation-item ${
                    unread ? "unread" : ""
                  } ${selectedChat === conv.conversationId ? "active" : ""}`}
                  onClick={() => {
                    setSelectedChat(conv.conversationId);
                    setMessages([]);
                    setReadByAdmin((prev) => ({
                      ...prev,
                      [conv.conversationId]: true,
                    }));
                  }}
                >
                  <div className="conversation-top">
                    <span className="conversation-name">
                      {conv.userName || "User"}
                    </span>
                    <span className="conversation-time">
                      {formatTime(conv.lastMessageAt || conv.updatedAt)}
                    </span>
                  </div>

                  <div className="conversation-bottom">
                    <span className="conversation-preview">
                      {conv.messages?.at(-1)?.message || "Belum ada pesan"}
                    </span>
                    {unread && <span className="unread-dot" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== RIGHT ===== */}
        <div className="chat-window-panel">
          {!selectedChat ? (
            <div className="chat-placeholder">
              <h3>💬 Admin Chat Panel</h3>
              <p>Pilih chat dari daftar</p>
            </div>
          ) : (
            <div className="chat-container">
              <div className="chat-header">
                <strong>Chat</strong>
                <span>{isConnected ? "🟢 Terhubung" : "🔴 Terputus"}</span>
              </div>

              <div ref={chatContainerRef} className="chat-messages">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`chat-message ${
                      msg.senderType === "Admin" ? "admin" : "user"
                    }`}
                  >
                    <div className="chat-bubble">
                      {msg.message}
                      <div className="chat-time">
                        {formatTime(msg.timestamp)}
                        {msg.senderType === "Admin" && (
                          <span
                            className={`check-icon ${
                              getCheckIcon(msg) === "✔✔ blue"
                                ? "blue"
                                : ""
                            }`}
                          >
                            {getCheckIcon(msg)?.replace(" blue", "")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="chat-input-container">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
