// src/components/RecommendedDisplay/RecommendedDisplay.jsx
import React, { useState, useEffect } from 'react';
import FoodItem from '../FoodItem/FoodItem';
import './RecommendedDisplay.css';

const RecommendedDisplay = () => {
    const [recommendedList, setRecommendedList] = useState([]);

    useEffect(() => {
        const fetchRecommended = async () => {
            try {
                const response = await fetch('http://localhost:4000/api/food/recommendations');
                const result = await response.json();

                if (result.success) {
                    setRecommendedList(result.data);
                } else {
                    console.error('Gagal mengambil data rekomendasi:', result.message);
                }
            } catch (error) {
                console.error('Terjadi kesalahan:', error);
            }
        };

        fetchRecommended();
    }, []);

    return (
        <div className='recommended-display' id='recommended-display'>
            <h2>Menu Rekomendasi</h2>
            {recommendedList.length > 0 ? (
                <div className="recommended-list">
                    {recommendedList.map((item, index) => (
                        <FoodItem
                            key={item._id}
                            id={item._id}
                            name={item.name}
                            description={item.description}
                            price={item.price}
                            image={item.image}
                            // ✅ Tambahkan baris ini untuk meneruskan status
                            status={item.status} 
                        />
                    ))}
                </div>
            ) : (
                <p>Tidak ada menu yang direkomendasikan saat ini.</p>
            )}
        </div>
    );
};

export default RecommendedDisplay;