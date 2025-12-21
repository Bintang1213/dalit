// StoreContext.jsx (FINAL FIXED by Pipit)
import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [token, setToken] = useState("");
  const [food_list, setFoodList] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ⭐ DITAMBAHKAN — tempat nyimpen rating
  const [ratings, setRatings] = useState({});

  const url = "http://localhost:4000";

  const fetchFoodList = async () => {
    try {
      const response = await axios.get(`${url}/api/food/list`);
      const normalized = (response.data.data || []).map((item) => ({
        _id: item._id || item.id || item._id?.toString(),
        ...item,
        price:
          item.price === undefined || item.price === null
            ? 0
            : Number(item.price),
        rating:
          item.rating === undefined || item.rating === null
            ? 0
            : Number(item.rating),
        category: item.category || "Uncategorized",
      }));
      setFoodList(normalized);
    } catch (error) {
      console.error("Gagal mengambil daftar makanan:", error);
    }
  };

  // ⭐ DITAMBAHKAN — fetch rating dari API
  const fetchRatings = async () => {
    try {
      const response = await axios.get(`${url}/api/reviews/top`);
      const data = response.data || [];

      const mapped = {};
data.forEach((item) => {
  mapped[item._id] = {
    averageRating: item.avgRating || 0,
    reviewCount: item.totalReviews || 0,
    ratingCounts: item.ratingCounts || {},
  };
});

setRatings(mapped);
    } catch (err) {
      console.error("Gagal fetch ratings:", err);
    }
  };

  const [unreadChatCount, setUnreadChatCount] = useState(
  Number(localStorage.getItem("unreadChatCount")) || 0
);

useEffect(() => {
  localStorage.setItem("unreadChatCount", unreadChatCount);
}, [unreadChatCount]);


  const fetchUser = async (authToken) => {
    if (!authToken) {
      setUser(null);
      return false;
    }
    try {
      const response = await axios.get(`${url}/api/user/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.success && response.data.data) {
        setUser(response.data.data);
        return true;
      } else {
        clearUserSession();
        return false;
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        clearUserSession();
      }
      return false;
    }
  };

  const clearUserSession = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setCartItems({});
  };

  const setUserSession = (newToken, userData = null) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      setToken(newToken);
      if (userData) setUser(userData);
      else fetchUser(newToken);
    } else {
      clearUserSession();
    }
  };

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setUser(null);
      setToken("");
      setCartItems({});

      const savedToken = localStorage.getItem("token");

      // ⭐ DITAMBAHKAN — fetch food + ratings sekaligus
      const foodPromise = Promise.all([fetchFoodList(), fetchRatings()]);

      let userPromise = Promise.resolve(false);
      if (savedToken) {
        setToken(savedToken);
        userPromise = fetchUser(savedToken);
      }

      const [, userFetchSuccess] = await Promise.all([
        foodPromise,
        userPromise,
      ]);

      if (savedToken && !userFetchSuccess) {
        clearUserSession();
      }

      setLoading(false);
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        const newToken = e.newValue;
        if (!newToken) {
          clearUserSession();
        } else if (newToken !== token) {
          setToken(newToken);
          fetchUser(newToken);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [token]);

  const addToCart = async (itemId) => {
    const key = String(itemId);
    setCartItems((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    if (token) {
      try {
        await axios.post(
          `${url}/api/cart/add`,
          { itemId: key },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          clearUserSession();
        }
      }
    }
  };

  const removeFromCart = async (itemId) => {
    const key = String(itemId);
    setCartItems((prev) => ({
      ...prev,
      [key]: Math.max((prev[key] || 1) - 1, 0),
    }));
    if (token) {
      try {
        await axios.post(
          `${url}/api/cart/remove`,
          { itemId: key },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          clearUserSession();
        }
      }
    }
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        const itemInfo = food_list.find(
          (product) => String(product._id) === String(item)
        );
        if (itemInfo) totalAmount += itemInfo.price * cartItems[item];
      }
    }
    return totalAmount;
  };

  const getTotalCartItems = () => {
    let totalItems = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) totalItems += cartItems[item];
    }
    return totalItems;
  };

  const clearCart = () => {
    setCartItems({});
  };

  const logout = () => {
    clearUserSession();
  };

  const login = (newToken, userData) => {
    setUserSession(newToken, userData);
  };

  const contextValue = {
    food_list,
    ratings, // ⭐ DITAMBAHKAN! Supaya FoodDisplay bisa akses rating
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    getTotalCartItems,
    clearCart,
    url,
    token,
    setToken: setUserSession,
    user,
    setUser,
    loading,
    logout,
    login,
    clearUserSession,
    fetchUser: (authToken) => fetchUser(authToken),
    unreadChatCount,
    setUnreadChatCount,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;