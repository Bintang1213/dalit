import './About.css';
import { assets } from '../../assets/assets';

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">Kedai Wartiyem</h1>
        <p className="hero-subtitle">Rasa Tradisional, Sentuhan Digital</p>
      </section>

      {/* Story Section */}
      <section className="story-section">
        <div className="story-text">
          <h2>Kisah Kami</h2>
          <p>
            Kedai Wartiyem didirikan oleh Ibu Dewi Karmila Wulandari pada tahun 2020, setelah sebelumnya melayani pelanggan melalui WhatsApp dan Facebook sejak 2018. Dengan semangat menghadirkan cita rasa rumahan yang autentik, kami terus berkembang mengikuti perubahan zaman.
          </p>
          <p>
            Untuk menjawab tantangan operasional dan permintaan pelanggan, kami mengembangkan sistem pemesanan digital yang mendukung layanan makan di tempat, di bungkus, dan di antar. Tujuannya: lebih cepat, akurat, dan efisien.
          </p>
        </div>
        <div className="story-image">
          <img src={assets.w} alt="Kedai Wartiyem" />
        </div>
      </section>

      {/* Visi Misi Section */}
      <section className="visi-misi-section">
        <h2>Visi & Misi</h2>
        <div className="visi-misi-grid">
          <div className="visi-box">
            <h3>Visi</h3>
            <p>Menjadi rumah makan pilihan utama yang menggabungkan rasa autentik dengan pelayanan berbasis teknologi modern.</p>
          </div>
          <div className="misi-box">
            <h3>Misi</h3>
            <ul>
              <li>Menyediakan makanan berkualitas dengan harga terjangkau</li>
              <li>Mengutamakan kepuasan pelanggan melalui layanan cepat dan tepat</li>
              <li>Terus berinovasi dalam pelayanan dan teknologi</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Keunggulan Section */}
      <section className="keunggulan-section">
        <h2>Kenapa Harus Pilih Kami?</h2>
        <div className="keunggulan-grid">
          <div className="keunggulan-item">✔️ Cepat & Praktis</div>
          <div className="keunggulan-item">✔️ Rasa Autentik</div>
          <div className="keunggulan-item">✔️ Pemesanan Digital</div>
          <div className="keunggulan-item">✔️ Bahan Berkualitas</div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>🍽️ Ingin Coba Masakan Kami?</h2>
        <p>🚀 Pesan sekarang dan rasakan sensasi kuliner rumahan yang berbeda!</p>
      </section>

      {/* Map Section */}
      <section className="map-section">
        <h2 className="map-title">
          Lokasi Kami <span className="emoji" role="img" aria-label="pin">📍</span>
        </h2>
        <iframe
          className="map-iframe"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63342.09520868409!2d108.18653614236046!3d-6.342426269591406!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e65089e22e5295f%3A0x6d40c535f147ce63!2sJl.%20Ampera%20No.57%2C%20Bulak%2C%20Kec.%20Jatibarang%2C%20Kabupaten%20Indramayu%2C%20Jawa%20Barat%2045273!5e0!3m2!1sid!2sid!4v1684456789012!5m2!1sid!2sid"
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Lokasi Kedai Wartiyem"
        ></iframe>
      </section>
      {/* Team Section */}
      <section className="team-section">
        <h2 className="team-heading">Dikembangkan Oleh</h2>
        <div className="team-grid">
          <div className="team-card">
            <img src={assets.om} alt="Bintang Rizqy" />
            <h3>Bintang Rizqy Andi Alkhalifi</h3>
          </div>
          <div className="team-card">
            <img src={assets.maba} alt="Naba Imelda" />
            <h3>Naba Imelda Nurussauba</h3>
          </div>
          <div className="team-card">
            <img src={assets.cc} alt="Salsah Billah" />
            <h3>Salsah Billah</h3>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
