import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No token or wrong format");
    return res.status(401).json({ 
      success: false, 
      message: "Token tidak ditemukan atau format salah" 
    });
  }

  const token = authHeader.split(" ")[1];
  console.log("Received token:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token structure:", Object.keys(decoded));

    // Standardisasi identifikasi user/admin
    if (!decoded.id && !decoded.adminId) {
      throw new Error("Token tidak mengandung identitas user/admin");
    }

    // Simpan data decoded ke request
    req.user = decoded;
    
    // Prioritaskan adminId jika ada
    if (decoded.adminId) {
      req.adminId = decoded.adminId;
      req.userId = decoded.adminId; // Untuk kompatibilitas
      console.log("Admin access detected:", decoded.adminId);
    } else {
      req.userId = decoded.id;
      console.log("User access detected:", decoded.id);
    }

    next();
  } catch (error) {
    console.error("Auth error:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    const response = {
      success: false,
      message: "Autentikasi gagal"
    };

    if (error.name === 'TokenExpiredError') {
      response.message = "Token telah kadaluarsa";
    } else if (error.name === 'JsonWebTokenError') {
      response.message = "Token tidak valid";
    }

    // Tambahkan detail error di development
    if (process.env.NODE_ENV === 'development') {
      response.error = error.message;
      response.stack = error.stack;
    }

    return res.status(401).json(response);
  }
};

export default authMiddleware;