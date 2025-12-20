import React, { useContext, useState, useEffect } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { updateProfile } from '../../api/userApi';
import { toast } from 'react-toastify';
import './EditProfile.css';

const EditProfile = () => {
    const { token, user, setUser } = useContext(StoreContext);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [activeSection, setActiveSection] = useState('profile');
    const [showPasswords, setShowPasswords] = useState({
        oldPassword: false,
        newPassword: false,
        confirmNewPassword: false
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || ''
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const { name, email, oldPassword, newPassword, confirmNewPassword } = formData;

        // ================= VALIDASI =================
        if (newPassword) {
            if (newPassword !== confirmNewPassword) {
                toast.error("Konfirmasi kata sandi tidak cocok!");
                setIsLoading(false);
                return;
            }

            if (!oldPassword) {
                toast.error("Harap masukkan kata sandi lama untuk mengubah kata sandi!");
                setIsLoading(false);
                return;
            }
        }

        const dataToSend = {
            name: name !== user.name ? name : undefined,
            email: email !== user.email ? email : undefined,
            oldPassword: newPassword ? oldPassword : undefined,
            newPassword: newPassword || undefined,
        };

        Object.keys(dataToSend).forEach(key => {
            if (!dataToSend[key]) delete dataToSend[key];
        });

        if (Object.keys(dataToSend).length === 0) {
            toast.info("Tidak ada perubahan yang terdeteksi.");
            setIsLoading(false);
            return;
        }

        // ================= ALERT KONFIRMASI =================
        const confirmSave = window.confirm(
            "Apakah Anda yakin ingin menyimpan perubahan?"
        );

        if (!confirmSave) {
            setIsLoading(false);
            return;
        }

        // ================= UPDATE =================
        try {
            const updatedData = await updateProfile(token, dataToSend);

            setUser(prev => ({
                ...prev,
                name: updatedData.name || prev.name,
                email: updatedData.email || prev.email,
            }));

            // ================= ALERT SUKSES =================
            alert("🎉 Perubahan berhasil disimpan!");
            toast.success("Profil berhasil diperbarui!");

            setFormData(prev => ({
                ...prev,
                oldPassword: '',
                newPassword: '',
                confirmNewPassword: '',
            }));

            setShowPasswords({
                oldPassword: false,
                newPassword: false,
                confirmNewPassword: false
            });

        } catch (error) {
            toast.error(error.message || "❌ Gagal memperbarui profil.");
        } finally {
            setIsLoading(false);
        }
    };

    const clearPasswordFields = () => {
        setFormData(prev => ({
            ...prev,
            oldPassword: '',
            newPassword: '',
            confirmNewPassword: '',
        }));
        setShowPasswords({
            oldPassword: false,
            newPassword: false,
            confirmNewPassword: false
        });
    };

    if (!user) {
        return (
            <div className="edit-profile-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Memuat data profil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="edit-profile-container">

            {/* ================= HEADER ================= */}
            <div className="edit-profile-header">
                <div className="header-content">
                    <div className="avatar-section">
                        <div className="avatar-circle">
                            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="avatar-info">
                            <h1 className="profile-greeting">Halo, {user?.name}!</h1>
                            <p className="profile-subtitle">Kelola informasi profil Anda</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= MAIN ================= */}
            <div className="edit-profile-main">

                {/* SIDEBAR */}
                <div className="profile-sidebar">
                    <div className="sidebar-nav">
                        <button
                            type="button"
                            className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveSection('profile')}
                        >
                            <i className="bi bi-person-circle"></i>
                            <span>Informasi Profil</span>
                        </button>

                        <button
                            type="button"
                            className={`nav-item ${activeSection === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveSection('security')}
                        >
                            <i className="bi bi-shield-lock"></i>
                            <span>Keamanan</span>
                        </button>
                    </div>

                    <div className="sidebar-tips">
                        <h4>Tips Keamanan</h4>
                        <div className="tip-item"><i className="bi bi-shield-check"></i><span>Gunakan password yang kuat</span></div>
                        <div className="tip-item"><i className="bi bi-arrow-repeat"></i><span>Update password berkala</span></div>
                        <div className="tip-item"><i className="bi bi-envelope-check"></i><span>Email harus aktif</span></div>
                    </div>
                </div>

                {/* FORM */}
                <div className="profile-content">
                    <form onSubmit={handleUpdateProfile} className="edit-profile-form">

                        {/* ================= PROFILE ================= */}
                        {activeSection === 'profile' && (
                            <div className="form-section">
                                <div className="section-title">
                                    <i className="bi bi-person-badge"></i>
                                    <h2>Informasi Pribadi</h2>
                                </div>

                                <div className="form-fields">
                                    <div className="form-field">
                                        <label className="field-label"><i className="bi bi-person"></i>Nama Lengkap</label>
                                        <div className="input-wrapper">
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="form-input"
                                                required
                                            />
                                            {formData.name && <i className="bi bi-check-lg input-status success"></i>}
                                        </div>
                                    </div>

                                    <div className="form-field">
                                        <label className="field-label"><i className="bi bi-envelope"></i>Email</label>
                                        <div className="input-wrapper">
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="form-input"
                                                required
                                            />
                                            {formData.email && <i className="bi bi-check-lg input-status success"></i>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================= SECURITY ================= */}
                        {activeSection === 'security' && (
                            <div className="form-section">
                                <div className="section-title">
                                    <i className="bi bi-key"></i>
                                    <h2>Keamanan Akun</h2>
                                </div>

                                <div className="form-fields">
                                    <input type="password" name="oldPassword" value={formData.oldPassword} onChange={handleChange} className="form-input" placeholder="Password lama" />
                                    <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} className="form-input" placeholder="Password baru" />
                                    <input type="password" name="confirmNewPassword" value={formData.confirmNewPassword} onChange={handleChange} className="form-input" placeholder="Konfirmasi password" />
                                </div>

                                <button type="button" className="btn-cancel" onClick={clearPasswordFields}>
                                    Reset Password
                                </button>
                            </div>
                        )}

                        {/* ================= SAVE ================= */}
                        <button type="submit" disabled={isLoading} className="btn-save">
                            {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;
