import React, { useEffect, useState, useRef, useContext } from "react";
import io from "socket.io-client";
import { toast } from "react-toastify";
import "./Chat.css";
import { StoreContext } from "../../context/StoreContext";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const { token, user, loading } = useContext(StoreContext);
  const chatContainerRef = useRef(null);
  const conversationId = "customer_support_chat";
  const BACKEND_URL = "http://localhost:4000";

  useEffect(() => {
    if (loading) return;

    if (!token || !user) {
      setError("Harap login untuk memulai chat.");
      return;
    }

    const newSocket = io(BACKEND_URL, {
      auth: { token },
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
      toast.success("Terhubung ke chat!");
      newSocket.emit("join_chat", conversationId);
      fetchChatHistory(conversationId, token);
    });

    newSocket.on("receive_message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    newSocket.on("error_message", (errorMsg) => {
      toast.error(errorMsg);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Connection failed:", err.message);
      setIsConnected(false);
      setError("Gagal terhubung ke server chat.");
    });

    return () => {
      newSocket.disconnect();
      setIsConnected(false);
    };
  }, [token, user, loading]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchChatHistory = async (id, authToken) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ conversationId: id }),
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      toast.error("Gagal mengambil riwayat chat.");
    }
  };

  const sendMessage = () => {
    if (inputMessage.trim() === "" || !socket || !user) return;
    if (!isConnected) {
      toast.error("Tidak terhubung ke chat. Coba lagi.");
      return;
    }

    const messageToSend = {
      conversationId,
      message: inputMessage,
      senderName: user.name,
      senderId: user._id,
    };

    socket.emit("send_message", messageToSend);
    setInputMessage("");
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <div className="chat-loading">Memuat data user...</div>;
  }

  if (error) {
    return <div className="chat-error">{error}</div>;
  }

  if (!isConnected) {
    return <div className="chat-loading">Menghubungkan ke chat...</div>;
  }

  return (
    <div className="chat-container">
      <h2 className="chat-title">Chat Bantuan</h2>
      <div ref={chatContainerRef} className="chat-messages">
        {messages.length > 0 ? (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`chat-message ${
                msg.senderId === user?._id ? "user" : "server"
              }`}
            >
              <div className="chat-bubble">
                <div className="chat-sender">
                  {msg.senderId === user?._id
                    ? user.name
                    : msg.senderName || msg.senderType}
                </div>
                <div>{msg.message}</div>
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
        />
        <button onClick={sendMessage} className="chat-send-btn">
          Kirim
        </button>
      </div>
    </div>
  );
};

export default Chat;
