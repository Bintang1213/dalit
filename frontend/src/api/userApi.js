const API_BASE_URL = "http://localhost:4000/api/user";

export const updateProfile = async (token, userData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Gagal memperbarui profil. Status: ${response.status}`);
        }

        if (data.success === false) {
            throw new Error(data.message || "Gagal memperbarui profil");
        }

        return data.data;

    } catch (error) {
        console.error("Error di updateProfile API:", error.message);
        throw error;
    }
};