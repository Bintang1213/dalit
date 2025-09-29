import Axios from "axios";

const API_BASE_URL = "http://localhost:4000/api/notifications"; 

const api = Axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Mengambil hitungan notifikasi yang belum dibaca dari server.
 * @param {string} token 
 * @returns {Promise<number>} 
 */
export const getNotificationCount = async (token) => {
    const response = await api.get("/unread-count", {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.count;
};

/**
 * Menandai semua notifikasi pengguna sebagai sudah dibaca.
 * @param {string} token 
 */
export const markAllAsRead = async (token) => {
    await api.patch("/", {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
};


export const fetchNotifications = async (token) => {
    const response = await api.get("/", {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};
