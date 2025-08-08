import { motion } from 'framer-motion'; 
import Navbar from './components/navbar/Navbar';
import { Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home/Home';
import Cart from './pages/Cart/Cart';
import PlaceOrder from './pages/PlaceOrder/PlaceOrder';
import Footer from './components/Footer/Footer';
import LoginPopup from './components/LoginPopup/LoginPopup';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion'; 
import OrderHistory from './pages/OrderHistory/OrderHistory';
import About from './pages/About/About';
import Midtrans from './pages/Midtrans/Midtrans';
import Struk from './components/Struk/Struk';

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  const location = useLocation();

  return (
    <>
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : null}
      <div className='app'>
        {location.pathname !== '/riwayat' && location.pathname !== '/cart' && location.pathname !== '/order' && location.pathname !== '/struk' &&(
          <Navbar setShowLogin={setShowLogin} />
        )}
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route 
              path='/' 
              element={
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.5 }}
                >
                  <Home />
                </motion.div>
              } 
            />
            <Route 
              path='/Menu' 
              element={
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.5 }}
                >
                  <Menu />
                </motion.div>
              } 
            />
            <Route 
              path='/cart' 
              element={
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                >
                  <Cart />
                </motion.div>
              } 
            />
            <Route 
              path='/order' 
              element={
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.5 }}
                >
                  <PlaceOrder />
                </motion.div>
              } 
            />
            <Route 
              path='/struk' 
              element={
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.4 }}
                >
                  <Struk />
                </motion.div>
              } 
            />
            <Route 
              path='/riwayat' 
              element={
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.4 }}
                >
                  <OrderHistory />
                </motion.div>
              }
            />
            <Route 
              path='/tentang-kami' // ✅ Rute baru
              element={
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.5 }}
                >
                  <About />
                </motion.div>
              }
            />
            <Route 
              path='/midtrans-simulator' 
              element={
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                >
                  <Midtrans />
                </motion.div>
              }
            />
          </Routes>
        </AnimatePresence>
      </div>
      <Footer />
    </>
  );
};

export default App;
