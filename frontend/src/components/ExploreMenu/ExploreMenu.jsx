import './ExploreMenu.css';
import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { menu_list } from "../../assets/assets";

const ExploreMenu = ({ category, setCategory }) => {
  
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  return (
    <div className='explore-menu' id='explore-menu'>
      <h1 data-aos="fade-up">Telusuri Menu Terbaik Kami</h1>
      <p className='explore-menu-text' data-aos="fade-up">
  Makan enak itu bukan sekadar mengisi perut, tapi juga cara terbaik untuk menikmati hidup.<br />
  Karena setiap suapan membawa kebahagiaan tersendiri!
</p>

      
      <div className="explore-menu-list-wrapper">
        <div className="explore-menu-list">
          {menu_list.map((item, index) => (
            <div 
              onClick={() => setCategory(prev => prev === item.menu_name ? "All" : item.menu_name)}
              key={index} 
              className='explore-menu-list-item' 
              data-aos="zoom-in"
            >
              <img className={category === item.menu_name ? "active" : ""} src={item.menu_image} alt={item.menu_name} />
              <p>{item.menu_name}</p>
            </div>
          ))}
        </div>
      </div>

      <hr data-aos="fade-up" />
    </div>
  );
};

export default ExploreMenu;
