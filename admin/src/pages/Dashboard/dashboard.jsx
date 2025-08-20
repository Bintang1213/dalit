import React, { useEffect, useState } from 'react';
import Axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    jumlahMenu: 0,
    jumlahPelanggan: 0,
    jumlahPenjualan: 0,
    totalPemasukan: 0,
    penjualanBulan: Array(12).fill(0),
    pemasukanBulan: Array(12).fill(0)
  });
  const [loading, setLoading] = useState(true);

  const cardColors = [
    { bg: '#FFD700', iconBg: '#FFF8DC', iconColor: '#B8860B' },
    { bg: '#87CEEB', iconBg: '#E0FFFF', iconColor: '#1E90FF' },
    { bg: '#FFB6C1', iconBg: '#FFE4E1', iconColor: '#FF69B4' },
    { bg: '#90EE90', iconBg: '#F0FFF0', iconColor: '#32CD32' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('Token tidak ditemukan');
        return;
      }

      try {
        setLoading(true);
        const [menuRes, userRes, orderRes] = await Promise.all([
          Axios.get('http://localhost:4000/api/food', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          Axios.get('http://localhost:4000/api/user', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          Axios.get('http://localhost:4000/api/order', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const orders = orderRes.data.data || [];
        const monthlySales = Array(12).fill(0);
        const monthlyRevenue = Array(12).fill(0);
        let currentMonthSales = 0;
        let currentMonthRevenue = 0;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        orders.forEach(order => {
          const orderDate = new Date(order.createdAt);
          const month = orderDate.getMonth();

          if (orderDate.getFullYear() === currentYear) {
            monthlySales[month] += 1;
            order.items?.forEach(item => {
              const itemRevenue = item.price * item.quantity;
              monthlyRevenue[month] += itemRevenue;
              if (month === currentMonth) {
                currentMonthSales += item.quantity;
                currentMonthRevenue += itemRevenue;
              }
            });
          }
        });

        setDashboardData({
          jumlahMenu: menuRes.data.data?.length || 0,
          jumlahPelanggan: userRes.data.data?.length || 0,
          jumlahPenjualan: currentMonthSales,
          totalPemasukan: currentMonthRevenue,
          penjualanBulan: monthlySales,
          pemasukanBulan: monthlyRevenue
        });

      } catch (err) {
        console.error('Gagal memuat data dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
    datasets: [{
      label: 'Jumlah Penjualan',
      data: dashboardData.penjualanBulan,
      backgroundColor: '#4CAF50',
      borderRadius: 4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: context => `${context.dataset.label}: ${context.raw}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Jumlah Penjualan' }
      }
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p className="subtitle">Ringkasan kinerja bisnis Anda</p>
        </div>

        {loading ? (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Memuat data...</p>
          </div>
        ) : (
          <div className="dashboard-content">
            <div className="stats-section">
              {[
                { icon: '🍽️', title: 'Jumlah Menu', value: dashboardData.jumlahMenu, link: '/kelolamenu' },
                { icon: '👥', title: 'Jumlah Pelanggan', value: dashboardData.jumlahPelanggan, link: '/kelolapengguna' },
                { icon: '💰', title: 'Penjualan Bulan Ini', value: dashboardData.jumlahPenjualan, link: '/kelolapesanan' },
                { icon: '📊', title: 'Pemasukan Bulan Ini', value: `Rp ${dashboardData.totalPemasukan.toLocaleString('id-ID')}`, link: '/kelolakeuangan' }
              ].map((card, index) => (
                <div key={index} className={`stat-card card-${index}`} style={{ backgroundColor: cardColors[index].bg }}>
                  <div className="stat-icon" style={{ backgroundColor: cardColors[index].iconBg, color: cardColors[index].iconColor }}>
                    {card.icon}
                  </div>
                  <div className="stat-details">
                    <h3>{card.title}</h3>
                    <div className="stat-value">{card.value}</div>
                    <a href={card.link} className="stat-link">Lihat detail →</a>
                  </div>
                </div>
              ))}
            </div>

            <div className="chart-section">
              <h2>Grafik Penjualan Tahunan</h2>
              <div className="chart-wrapper">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
