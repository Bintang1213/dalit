import React from 'react';
import './Footer.css';
import { assets } from '../../assets/assets';


const Footer = () => {
  return (
    <div>

      <div className='footer' id='footer'>
        <div className="footer-content">
          <div className="footer-section">
            <img src={assets.Tengko} alt="Logo Kedai" className="footer-logo" />
            <p>
              Nikmati suasana santai dengan menu khas yang menggoda selera.
              Kami percaya bahwa makanan tidak hanya sekadar rasa, tetapi juga pengalaman.
            </p>
            <div className="footer-social-icons">
            <a 
              href="https://www.facebook.com/p/Kedai-Wartiyem-Bulak-100087412186742/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <img src={assets.fb} alt="Facebook" className="social-icon" />
            </a>
            <a 
              href="https://www.instagram.com/wartiyembulak/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <img src={assets.ig} alt="Instagram" className="social-icon" />
            </a>
            <a 
              href="https://wa.me/6285943622000" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <img src={assets.wa} alt="WhatsApp" className="social-icon" />
            </a>
          </div>
          </div>

          <div className="footer-section">
            <h2>NAVIGASI</h2>
            <ul>
              <li><i className="fas fa-home"></i> <a href="/">Beranda</a></li>
              <li><i className="fas fa-utensils"></i> <a href="/#explore-menu">Menu</a></li>
              <li><i className="fas fa-utensils"></i> <a href="/riwayat">Pesanan</a></li>
              <li><i className="fas fa-info-circle"></i> <a href="/tentang-kami">Tentang Kami</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h2>HUBUNGI KAMI</h2>
            <ul>
              <li>📞 085943622000</li>
              <li>📧  kedaiwartiyem@gmail.com</li>
              <li>📍 Jl. Ampera No.57 Bulak, Kec. Jatibarang, Kab. Indramayu</li>
            </ul>
          </div>
        </div>

        <hr />
        <p className="footer-copyright">© 2025 Kedai Wartiyem - All Rights Reserved.</p>
      </div>
    </div>
  );
}

export default Footer;
