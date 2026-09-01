const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Token tidak ditemukan"
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Token tidak ditemukan"
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET belum dikonfigurasi.");

        return res.status(500).json({
            success: false,
            message: "Konfigurasi autentikasi server belum siap"
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token tidak valid atau sudah expired"
        });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Akses hanya untuk admin"
        });
    }

    next();
}

function requireAdminOrStaff(req, res, next) {
    if (
        !req.user ||
        !["admin", "staff"].includes(req.user.role)
    ) {
        return res.status(403).json({
            success: false,
            message: "Akses hanya untuk admin atau staff"
        });
    }

    next();
}

module.exports = {
    authenticateToken,
    requireAdmin,
    requireAdminOrStaff
};