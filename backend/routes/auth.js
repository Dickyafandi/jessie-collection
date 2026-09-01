const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const db = require("../config/database");

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Terlalu banyak percobaan login. Silakan coba lagi nanti."
    }
});

router.post("/login", loginLimiter, async (req, res) => {
    try {
        const username = String(
            req.body?.username || ""
        ).trim();

        const password = String(
            req.body?.password || ""
        );

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username dan password wajib diisi"
            });
        }

        if (username.length > 100 || password.length > 200) {
            return res.status(400).json({
                success: false,
                message: "Data login tidak valid"
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET belum dikonfigurasi.");

            return res.status(500).json({
                success: false,
                message: "Konfigurasi autentikasi server belum siap"
            });
        }

        const [users] = await db.query(
            `
            SELECT
                id,
                username,
                password,
                role
            FROM users
            WHERE username = ?
            LIMIT 1
            `,
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Username atau password salah"
            });
        }

        const user = users[0];

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Username atau password salah"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.json({
            success: true,
            message: "Login berhasil",
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error(
            "LOGIN ERROR:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});

module.exports = router;