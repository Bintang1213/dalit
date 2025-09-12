import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [token, setToken] = useState("");
  const [food_list, setFoodList] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const url = "http://localhost:4000";

  const fetchFoodList = async () => {
    try {
      const response = await axios.get(`${url}/api/food/list`);
      setFoodList(response.data.data);
    } catch (error) {
      console.error("Gagal mengambil daftar makanan:", error);
    }
  };

  // ✅ PERBAIKAN UTAMA: Fetch user yang lebih robust
  const fetchUser = async (authToken) => {
    if (!authToken) {
      console.log("No token provided for fetchUser");
      setUser(null);
      return false;
    }

    try {
      console.log("Fetching user profile with token...");
      const response = await axios.get(`${url}/api/user/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      if (response.data.success && response.data.data) {
        // ✅ IKUTI STRUKTUR BACKEND: Gunakan response.data.data sesuai getUserProfile
        console.log("User fetched successfully:", response.data.data._id);
        setUser(response.data.data);
        return true;
      } else {
        console.error("Failed to fetch user:", response.data.message);
        clearUserSession();
        return false;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      
      // ✅ Handle different error types
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("Token expired or invalid, clearing session");
        clearUserSession();
      } else {
        console.error("Network or server error:", error.message);
        // Don't clear session for network errors
      }
      return false;
    }
  };

  // ✅ Function untuk clear user session
  const clearUserSession = () => {
    console.log("Clearing user session...");
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setCartItems({}); // ✅ Also clear cart when logging out
  };

  // ✅ Function untuk set user session
  const setUserSession = (newToken, userData = null) => {
    console.log("Setting user session:", newToken ? "with token" : "without token");
    
    if (newToken) {
      localStorage.setItem("token", newToken);
      setToken(newToken);
      
      if (userData) {
        setUser(userData);
      } else {
        // Fetch user data if not provided
        fetchUser(newToken);
      }
    } else {
      clearUserSession();
    }
  };

  useEffect(() => {
    async function loadInitialData() {
      console.log("Loading initial data...");
      setLoading(true);

      // ✅ PERBAIKAN: Clear state terlebih dahulu
      setUser(null);
      setToken("");
      setCartItems({});

      const savedToken = localStorage.getItem("token");
      console.log("Saved token exists:", !!savedToken);

      // Load food list
      const foodPromise = fetchFoodList();

      // Load user if token exists
      let userPromise = Promise.resolve(false);
      if (savedToken) {
        setToken(savedToken); // Set token immediately
        userPromise = fetchUser(savedToken);
      }

      // Wait for both to complete
      const [, userFetchSuccess] = await Promise.all([foodPromise, userPromise]);

      // ✅ If user fetch failed, clear everything
      if (savedToken && !userFetchSuccess) {
        console.log("User fetch failed, clearing session");
        clearUserSession();
      }

      setLoading(false);
      console.log("Initial data loaded");
    }

    loadInitialData();
  }, []); // ✅ Empty dependency array - only run on mount

  // ✅ TAMBAHAN: Effect untuk handle storage changes (multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        const newToken = e.newValue;
        console.log("Token changed in another tab:", !!newToken);
        
        if (!newToken) {
          // Token removed in another tab
          clearUserSession();
        } else if (newToken !== token) {
          // Token changed in another tab
          setToken(newToken);
          fetchUser(newToken);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token]);

  const addToCart = async (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    if (token) {
      try {
        await axios.post(
          `${url}/api/cart/add`,
          { itemId },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        console.error("Gagal menambahkan ke keranjang di server:", error);
        
        // ✅ Handle auth errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log("Auth error in addToCart, clearing session");
          clearUserSession();
        }
      }
    } else {
      console.warn(
        "Pengguna belum login, item hanya ditambahkan ke keranjang lokal."
      );
    }
  };

  const removeFromCart = async (itemId) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: Math.max((prev[itemId] || 1) - 1, 0),
    }));
    if (token) {
      try {
        await axios.post(
          `${url}/api/cart/remove`,
          { itemId },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        console.error("Gagal menghapus dari keranjang di server:", error);
        
        // ✅ Handle auth errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log("Auth error in removeFromCart, clearing session");
          clearUserSession();
        }
      }
    } else {
      console.warn(
        "Pengguna belum login, item hanya dihapus dari keranjang lokal."
      );
    }
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = food_list.find((product) => product._id === item);
        if (itemInfo) {
          totalAmount += itemInfo.price * cartItems[item];
        }
      }
    }
    return totalAmount;
  };

  const clearCart = () => {
    setCartItems({});
  };

  // ✅ TAMBAHAN: Helper functions untuk authentication
  const logout = () => {
    console.log("Manual logout triggered");
    clearUserSession();
  };

  const login = (newToken, userData) => {
    console.log("Manual login triggered");
    setUserSession(newToken, userData);
  };

  const contextValue = {
    food_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    clearCart,
    url,
    token,
    setToken: setUserSession, // ✅ Use setUserSession instead of direct setToken
    user,
    setUser,
    loading,
    // ✅ TAMBAHAN: Helper functions
    logout,
    login,
    clearUserSession,
    fetchUser: (authToken) => fetchUser(authToken), // Expose for manual refresh
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;