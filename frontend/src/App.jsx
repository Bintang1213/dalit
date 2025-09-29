import { motion } from "framer-motion";
import Navbar from "./components/navbar/Navbar";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home/Home";
import Cart from "./pages/Cart/Cart";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import Footer from "./components/Footer/Footer";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import OrderHistory from "./pages/OrderHistory/OrderHistory";
import About from "./pages/About/About";
import Midtrans from "./pages/Midtrans/Midtrans";
import Struk from "./components/Struk/Struk";
import Menu from "./pages/Menu/Menu";
import Chat from "./pages/Chat/Chat";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReviewList from "./pages/ReviewList/ReviewList";
import ReviewForm from "./components/ReviewForm/ReviewForm";
import EditProfile from "./pages/EditProfile/EditProfile"; 

const WrappedRoute = ({ children, initial, animate, exit, transition }) => (
    <motion.div
        initial={initial}
        animate={animate}
        exit={exit}
        transition={transition}
    >
        {children}
    </motion.div>
);

const defaultTransition = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
    transition: { duration: 0.5 }
};

const App = () => {
    const [showLogin, setShowLogin] = useState(false);
    const location = useLocation();

    return (
        <>
            {showLogin && <LoginPopup setShowLogin={setShowLogin} />}
            <div className="app">
                {location.pathname !== "/cart" &&
                    location.pathname !== "/order" &&
                    location.pathname !== "/struk" && (
                        <Navbar setShowLogin={setShowLogin} />
                    )}

                <div>
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            
                            {/* Rute Beranda */}
                            <Route
                                path="/"
                                element={
                                    <WrappedRoute
                                        initial={{ opacity: 0, x: -50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 50 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <Home />
                                    </WrappedRoute>
                                }
                            />
                            
                            {/* Rute Edit Profile - BARU DITAMBAHKAN */}
                            <Route
                                path="/profile/edit"
                                element={
                                    <WrappedRoute
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -30 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <EditProfile />
                                    </WrappedRoute>
                                }
                            />

                            {/* Rute Menu */}
                            <Route
                                path="/menu"
                                element={
                                    <WrappedRoute
                                        initial={{ opacity: 0, x: -50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 50 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <Menu />
                                    </WrappedRoute>
                                }
                            />

                            {/* Rute Cart */}
                            <Route
                                path="/cart"
                                element={
                                    <WrappedRoute
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <Cart />
                                    </WrappedRoute>
                                }
                            />
                            
                            {/* Rute Place Order */}
                            <Route
                                path="/order"
                                element={
                                    <WrappedRoute
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -50 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <PlaceOrder />
                                    </WrappedRoute>
                                }
                            />
                            
                            {/* Rute Struk */}
                            <Route
                                path="/struk"
                                element={
                                    <WrappedRoute
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -30 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <Struk />
                                    </WrappedRoute>
                                }
                            />
                            
                            {/* Rute Riwayat */}
                            <Route
                                path="/riwayat"
                                element={
                                    <WrappedRoute
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -30 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <OrderHistory />
                                    </WrappedRoute>
                                }
                            />
                            
                            {/* Rute Tentang Kami */}
                            <Route
                                path="/tentang-kami"
                                element={
                                    <WrappedRoute
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <About />
                                    </WrappedRoute>
                                }
                            />
                            
                            {/* Rute Midtrans */}
                            <Route
                                path="/midtrans-simulator"
                                element={
                                    <WrappedRoute
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <Midtrans />
                                    </WrappedRoute>
                                }
                            />
                            
                            {/* Rute Chat */}
                            <Route
                                path="/chat"
                                element={
                                    <WrappedRoute
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -50 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <Chat />
                                    </WrappedRoute>
                                }
                            />
                            
                            {/* Rute ReviewList */}
                            <Route
                                path="/reviews"
                                element={
                                    <WrappedRoute
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -50 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <ReviewList />
                                    </WrappedRoute>
                                }
                            />
                            
                            {/* Rute ReviewForm */}
                            <Route
                                path="/reviewform"
                                element={
                                    <WrappedRoute
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -50 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <ReviewForm />
                                    </WrappedRoute>
                                }
                            />
                            
                        </Routes>
                    </AnimatePresence>
                </div>
            </div>
            <Footer />
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                style={{ zIndex: 99999 }}
            />
        </>
    );
};

export default App;
