import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import './AdminChat.css';
import { IoSend } from 'react-icons/io5';

const BACKEND_URL = "http://localhost:4000";

const AdminChat = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const chatContainerRef = useRef(null);

    const token = localStorage.getItem('authToken');

    const fetchConversations = async () => {
        if (!token) {
            toast.error("Tidak ada token admin. Silakan login.");
            return;
        }
        try {
            const response = await axios.get(`${BACKEND_URL}/api/chat/admin/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setConversations(response.data.data);
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
    }, [token]);

    useEffect(() => {
        if (!selectedChat || !token) {
            if (socket) {
                socket.disconnect();
            }
            return;
        }

        const newSocket = io(BACKEND_URL, { auth: { token } });
        setSocket(newSocket);
        
        newSocket.on('connect', () => {
            console.log('Admin connected to socket');
            newSocket.emit('join_chat', selectedChat);
            fetchChatHistory(selectedChat, token);
        });

        newSocket.on('receive_message', (message) => {
            setMessages(prevMessages => [...prevMessages, message]);
        });

        newSocket.on('disconnect', () => {
            console.log('Admin disconnected from socket');
        });

        newSocket.on('connect_error', (err) => {
            console.error("Socket connection failed:", err.message);
            toast.error("Gagal terhubung ke chat.");
        });

        return () => {
            newSocket.disconnect();
        };
    }, [selectedChat, token]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchChatHistory = async (id, authToken) => {
        try {
            const response = await axios.post(`${BACKEND_URL}/api/chat/history`, 
                { conversationId: id },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            if (response.data.success) {
                setMessages(response.data.data);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Failed to fetch chat history:', error);
            toast.error("Gagal mengambil riwayat chat.");
        }
    };

    const sendMessage = () => {
        if (inputMessage.trim() === '' || !socket || !selectedChat) return;
        
        const messageToSend = {
            conversationId: selectedChat,
            message: inputMessage,
        };

        socket.emit('send_message', messageToSend);
        setInputMessage('');
    };

    const clearAllChats = async () => {
        if (!window.confirm("Yakin mau hapus semua chat?")) return;
        try {
            const response = await axios.delete(`${BACKEND_URL}/api/chat/clear-all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };
    
    const selectedConversation = conversations.find(conv => conv.conversationId === selectedChat);

    const getSenderDisplayName = (msg) => {
        if (!msg) return '';
        if (msg.senderType === 'Admin') return 'Anda';
        if (msg.senderName) {
            return msg.senderName;
        }
        return selectedConversation?.userName || 'Pengguna';
    };

    return (
        <div className="admin-chat-container">
            <div className="conversation-list-panel">
                <h3 className="panel-title">Daftar Chat</h3>

                <button onClick={clearAllChats} className="clear-all-btn">
                    Hapus Semua Chat
                </button>

                {conversations.length > 0 ? (
                    conversations.map((conv) => (
                        <div
                            key={conv.conversationId}
                            className={`conversation-item ${selectedChat === conv.conversationId ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedChat(conv.conversationId);
                                setMessages([]);
                            }}
                        >
                            <div className="conversation-header">
                                <span className="conversation-user-name">
                                    {conv.userName || `Pengguna ${conv.conversationId.slice(0, 8)}...`}
                                </span>
                                <span className="conversation-time">
                                    {conv.messages && conv.messages.length > 0 ? formatTime(conv.messages[0].timestamp) : ''}
                                </span>
                            </div>
                            <span className="last-message-preview">
                                {conv.messages && conv.messages.length > 0 ? conv.messages[0].message : 'Mulai chat'}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="no-conversations">Tidak ada chat aktif.</div>
                )}
            </div>
            
            <div className="chat-window-panel">
                {!selectedChat ? (
                    <div className="chat-placeholder">
                        Pilih chat dari daftar untuk melihat percakapan.
                    </div>
                ) : (
                    <div className="chat-container">
                        <h3 className="chat-title">
                            Chat dengan {selectedConversation?.userName || `Pengguna ${selectedChat.slice(0, 8)}...`}
                        </h3>
                        <div ref={chatContainerRef} className="chat-messages">
                            {messages.length > 0 ? (
                                messages.map((msg, index) => (
                                    <div 
                                        key={index} 
                                        className={`chat-message ${msg.senderType === 'Admin' ? 'admin' : 'user'}`}
                                    >
                                        <div className="chat-bubble">
                                            <div className="chat-sender">
                                                {getSenderDisplayName(msg)}
                                            </div>

                                            <div className="chat-text">{msg.message}</div>

                                            <div className="chat-timestamp">{formatTime(msg.timestamp)}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="chat-empty">Mulai percakapan dengan mengirim pesan!</div>
                            )}
                        </div>
                        <div className="chat-input-container">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                className="chat-input"
                                placeholder="Ketik pesan..."
                            />
                            <button onClick={sendMessage} className="chat-send-btn">
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