import './Header.css';
import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Header = () => {
  useEffect(() => {
    AOS.init({
      duration: 1200,  // Kecepatan animasi
      once: true,       // Animasi hanya berjalan sekali
    });
  }, []);

  return (
    <div className='header' id='header'>
      <div className="header-contents">
      <h2 data-aos="fade-down">Pesan Tanpa Ribet, Nikmat Tanpa Batas!</h2>   
        <p data-aos="fade-right">Selamat datang dan selamat memilih hidangan terbaik!</p>
        <a href="#explore-menu">
  <button data-aos="zoom-in">Lihat Menu</button>
</a>
      </div>
    </div>
  );
};

export default Header;
