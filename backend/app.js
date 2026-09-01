const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const db = require("./config/database");
const {
    syncDescriptionsOnce
} = require("./config/description-data");

const authRoutes = require("./routes/auth");
const stockRoutes = require("./routes/stock");
const productRoutes = require("./routes/products");
const catalogRoutes = require("./routes/catalog");

const app = express();


// ============================================================
// BASIC SECURITY
// ============================================================

app.disable("x-powered-by");

app.use(
    helmet()
);


// ============================================================
// CORS
// ============================================================

const allowedOrigins = (
    process.env.FRONTEND_URL || ""
)
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {

            // Request tanpa Origin:
            // curl, Postman, server-to-server, dll.
            if (!origin) {
                return callback(null, true);
            }

            // Kalau belum ada FRONTEND_URL,
            // jangan izinkan cross-origin browser.
            if (allowedOrigins.length === 0) {
                return callback(
                    new Error(
                        "Origin tidak diizinkan"
                    )
                );
            }

            if (
                allowedOrigins.includes(origin)
            ) {
                return callback(null, true);
            }

            return callback(
                new Error(
                    "Origin tidak diizinkan"
                )
            );
        },

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);


// ============================================================
// BODY PARSER
// ============================================================

app.use(
    express.json({
        limit: "100kb"
    })
);


// ============================================================
// PUBLIC CATALOG
// ============================================================

app.use(
    "/api/catalog",
    catalogRoutes
);


// ============================================================
// BASIC ROUTES
// ============================================================

app.get(
    "/",
    (req, res) => {
        return res.json({
            success: true,
            message:
                "Jessie Collection API berjalan"
        });
    }
);

app.get(
    "/api/health",
    (req, res) => {
        return res.json({
            success: true,
            message: "OK"
        });
    }
);


// ============================================================
// API ROUTES
// ============================================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/stock",
    stockRoutes
);

app.use(
    "/api/products",
    productRoutes
);


// ============================================================
// 404 HANDLER
// ============================================================

app.use(
    (req, res) => {
        return res.status(404).json({
            success: false,
            message:
                "Endpoint tidak ditemukan"
        });
    }
);


// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
    (error, req, res, next) => {
        console.error(
            "API ERROR:",
            error.message
        );

        if (
            error.message ===
            "Origin tidak diizinkan"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Origin tidak diizinkan"
            });
        }

        if (
            error.type ===
            "entity.too.large"
        ) {
            return res.status(413).json({
                success: false,
                message:
                    "Request terlalu besar"
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Terjadi kesalahan server"
        });
    }
);


// ============================================================
// DATABASE INITIALIZATION
// ============================================================

let initializationPromise = null;

async function initialize() {

    // Hindari initialization berulang
    // dalam instance/container yang sama.
    if (!initializationPromise) {
        initializationPromise =
            initializeDatabase();
    }

    return initializationPromise;
}

async function initializeDatabase() {

    let connection;

    try {

        // JWT wajib ada.
        if (!process.env.JWT_SECRET) {
            throw new Error(
                "JWT_SECRET belum dikonfigurasi."
            );
        }

        // Minimal 32 karakter.
        if (
            String(
                process.env.JWT_SECRET
            ).length < 32
        ) {
            throw new Error(
                "JWT_SECRET minimal 32 karakter."
            );
        }

        connection =
            await db.getConnection();

        const result =
            await syncDescriptionsOnce(
                connection
            );

        console.log(
            result.skipped
                ? "Keterangan produk sudah pernah disiapkan; tidak menimpa edit manual."
                : `Keterangan produk disiapkan otomatis: ${result.updated} baris dari ${result.mappingCount} kode.`
        );

    } finally {

        if (connection) {
            connection.release();
        }

    }
}


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    app,
    initialize
};