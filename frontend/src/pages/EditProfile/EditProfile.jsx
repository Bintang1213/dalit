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
            if (dataToSend[key] === undefined || dataToSend[key] === '') {
                delete dataToSend[key];
            }
        });

        if (Object.keys(dataToSend).length === 0) {
            toast.info("Tidak ada perubahan yang terdeteksi.");
            setIsLoading(false);
            return;
        }

        try {
            const updatedData = await updateProfile(token, dataToSend);

            setUser(prev => ({
                ...prev,
                name: updatedData.name || prev.name,
                email: updatedData.email || prev.email,
            }));

            toast.success("✅ Profil berhasil diperbarui!");

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
            {/* Header yang lebih compact */}
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

            {/* Main Content yang lebih compact */}
            <div className="edit-profile-main">
                <div className="profile-sidebar">
                    <div className="sidebar-nav">
                        <button 
                            className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveSection('profile')}
                        >
                            <i className="bi bi-person-circle"></i>
                            <span>Informasi Profil</span>
                        </button>
                        <button 
                            className={`nav-item ${activeSection === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveSection('security')}
                        >
                            <i className="bi bi-shield-lock"></i>
                            <span>Keamanan</span>
                        </button>
                    </div>

                    {/* Tips Section di sidebar */}
                    <div className="sidebar-tips">
                        <h4>Tips Keamanan</h4>
                        <div className="tip-item">
                            <i className="bi bi-shield-check"></i>
                            <span>Gunakan password yang kuat</span>
                        </div>
                        <div className="tip-item">
                            <i className="bi bi-arrow-repeat"></i>
                            <span>Update password berkala</span>
                        </div>
                        <div className="tip-item">
                            <i className="bi bi-envelope-check"></i>
                            <span>Email harus aktif</span>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="profile-content">
                    <form onSubmit={handleUpdateProfile} className="edit-profile-form">
                        
                        {activeSection === 'profile' && (
                            <div className="form-section">
                                <div className="section-title">
                                    <i className="bi bi-person-badge"></i>
                                    <h2>Informasi Pribadi</h2>
                                </div>
                                
                                <div className="form-fields">
                                    <div className="form-field">
                                        <label className="field-label">
                                            <i className="bi bi-person"></i>
                                            Nama Lengkap
                                        </label>
                                        <div className="input-wrapper">
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="form-input"
                                                placeholder="Masukkan nama lengkap"
                                                required
                                            />
                                            {formData.name && (
                                                <i className="bi bi-check-lg input-status success"></i>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-field">
                                        <label className="field-label">
                                            <i className="bi bi-envelope"></i>
                                            Alamat Email
                                        </label>
                                        <div className="input-wrapper">
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="form-input"
                                                placeholder="nama@email.com"
                                                required
                                            />
                                            {formData.email && (
                                                <i className="bi bi-check-lg input-status success"></i>
                                            )}
                                        </div>
                                        <p className="field-hint">
                                            Digunakan untuk notifikasi dan pemulihan akun
                                        </p>
                                    </div>
                                </div>

                                {/* Changes Preview yang lebih compact */}
                                {(formData.name !== user.name || formData.email !== user.email) && (
                                    <div className="changes-preview">
                                        <div className="preview-header">
                                            <i className="bi bi-info-circle"></i>
                                            <span>Perubahan yang akan disimpan:</span>
                                        </div>
                                        <div className="preview-items">
                                            {formData.name !== user.name && (
                                                <div className="preview-item">
                                                    <span className="item-label">Nama:</span>
                                                    <span className="item-change">
                                                        {user.name} → <strong>{formData.name}</strong>
                                                    </span>
                                                </div>
                                            )}
                                            {formData.email !== user.email && (
                                                <div className="preview-item">
                                                    <span className="item-label">Email:</span>
                                                    <span className="item-change">
                                                        {user.email} → <strong>{formData.email}</strong>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeSection === 'security' && (
                            <div className="form-section">
                                <div className="section-title">
                                    <i className="bi bi-key"></i>
                                    <h2>Keamanan Akun</h2>
                                </div>

                                <div className="security-notice">
                                    <i className="bi bi-info-circle"></i>
                                    <p>Ubah kata sandi secara berkala untuk keamanan akun</p>
                                </div>

                                <div className="form-fields">
                                    <div className="form-field">
                                        <label className="field-label">
                                            <i className="bi bi-lock"></i>
                                            Kata Sandi Saat Ini
                                        </label>
                                        <div className="input-wrapper">
                                            <input
                                                type={showPasswords.oldPassword ? "text" : "password"}
                                                name="oldPassword"
                                                value={formData.oldPassword}
                                                onChange={handleChange}
                                                className="form-input"
                                                placeholder="Masukkan password saat ini"
                                            />
                                            <i 
                                                className={`bi ${showPasswords.oldPassword ? 'bi-eye' : 'bi-eye-slash'} password-toggle`}
                                                onClick={() => togglePasswordVisibility('oldPassword')}
                                            ></i>
                                        </div>
                                    </div>

                                    <div className="form-field">
                                        <label className="field-label">
                                            <i className="bi bi-lock-fill"></i>
                                            Kata Sandi Baru
                                        </label>
                                        <div className="input-wrapper">
                                            <input
                                                type={showPasswords.newPassword ? "text" : "password"}
                                                name="newPassword"
                                                value={formData.newPassword}
                                                onChange={handleChange}
                                                className="form-input"
                                                placeholder="Minimal 8 karakter"
                                            />
                                            <i 
                                                className={`bi ${showPasswords.newPassword ? 'bi-eye' : 'bi-eye-slash'} password-toggle`}
                                                onClick={() => togglePasswordVisibility('newPassword')}
                                            ></i>
                                        </div>
                                        <div className="password-strength">
                                            <div className="strength-indicator">
                                                <div className={`strength-bar ${formData.newPassword.length >= 8 ? 'strong' : formData.newPassword.length >= 4 ? 'medium' : 'weak'}`}></div>
                                            </div>
                                            <span className="strength-text">
                                                {formData.newPassword.length >= 8 ? 'Kuat' : formData.newPassword.length >= 4 ? 'Sedang' : 'Lemah'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="form-field">
                                        <label className="field-label">
                                            <i className="bi bi-lock"></i>
                                            Konfirmasi Sandi Baru
                                        </label>
                                        <div className="input-wrapper">
                                            <input
                                                type={showPasswords.confirmNewPassword ? "text" : "password"}
                                                name="confirmNewPassword"
                                                value={formData.confirmNewPassword}
                                                onChange={handleChange}
                                                className="form-input"
                                                placeholder="Ketik ulang password baru"
                                            />
                                            <i 
                                                className={`bi ${formData.newPassword && formData.newPassword === formData.confirmNewPassword ? 'bi-check-lg success' : showPasswords.confirmNewPassword ? 'bi-eye' : 'bi-eye-slash'} ${formData.newPassword && formData.newPassword === formData.confirmNewPassword ? 'input-status' : 'password-toggle'}`}
                                                onClick={() => {
                                                    if (!(formData.newPassword && formData.newPassword === formData.confirmNewPassword)) {
                                                        togglePasswordVisibility('confirmNewPassword');
                                                    }
                                                }}
                                            ></i>
                                        </div>
                                        {formData.newPassword && formData.confirmNewPassword && (
                                            <p className={`validation-message ${formData.newPassword === formData.confirmNewPassword ? 'success' : 'error'}`}>
                                                {formData.newPassword === formData.confirmNewPassword 
                                                    ? '✓ Kata sandi cocok' 
                                                    : '✗ Kata sandi tidak cocok'
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button 
                                        type="button" 
                                        className="btn-cancel"
                                        onClick={clearPasswordFields}
                                        disabled={isLoading}
                                    >
                                        <i className="bi bi-x-circle"></i>
                                        Reset Password
                                    </button>
                                </div>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="btn-save"
                        >
                            {isLoading ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-lg"></i>
                                    Simpan Perubahan
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;