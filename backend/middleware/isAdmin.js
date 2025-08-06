// backend/middleware/isAdmin.js
export const isAdmin = (req, res, next) => {
    // Asumsikan informasi peran admin ada di objek req setelah authMiddleware dijalankan
    if (req.user && req.user.isAdmin) {
      return next();
    } else if (req.adminId) { // Atau jika kamu menggunakan properti adminId
      return next();
    } else {
      return res.status(403).json({ success: false, message: "Akses ditolak. Membutuhkan peran admin." });
    }
  };