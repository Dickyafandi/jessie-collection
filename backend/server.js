const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const db = require("./config/database");
const { syncDescriptionsOnce } = require("./config/description-data");

const authRoutes = require("./routes/auth");
const stockRoutes = require("./routes/stock");
const productRoutes = require("./routes/products");
const catalogRoutes = require("./routes/catalog");

const app = express();

app.use(cors());
app.use(express.json());

/*
|--------------------------------------------------------------------------
| HELPER: baca user dari JWT
|--------------------------------------------------------------------------
*/

function getTokenUser(req) {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
        return null;
    }

    const token = header.slice(7);

    try {
        return jwt.verify(
            token,
            process.env.JWT_SECRET
        );
    } catch {
        return null;
    }
}

/*
|--------------------------------------------------------------------------
| PUBLIC CATALOG
|--------------------------------------------------------------------------
| Customer/tamu tidak perlu login.
| Hanya mendapatkan:
| - brand
| - kode
| - keterangan
| - stok > 0
|--------------------------------------------------------------------------
*/

app.use("/api/catalog", catalogRoutes);

/*
|--------------------------------------------------------------------------
| ROLE SECURITY
|--------------------------------------------------------------------------
*/

app.use("/api", (req, res, next) => {
    const user = getTokenUser(req);
    const role = user?.role || null;

    /*
     * Produk:
     * - GET boleh untuk user login
     * - POST / PUT / PATCH / DELETE hanya admin
     */
    if (
        role === "staff" &&
        req.path.startsWith("/products") &&
        ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
    ) {
        return res.status(403).json({
            success: false,
            message: "Akses hanya untuk admin."
        });
    }

    /*
     * Dashboard summary hanya admin.
     */
    if (
        role === "staff" &&
        req.path === "/stock/summary"
    ) {
        return res.status(403).json({
            success: false,
            message: "Dashboard hanya tersedia untuk admin."
        });
    }

    /*
     * Staff tetap boleh:
     * - POST /stock/in
     * - POST /stock/out
     * - GET  /stock/movements
     *
     * Tetapi data uang tidak boleh keluar dari endpoint
     * movements untuk Staff.
     */
    if (
        role === "staff" &&
        req.path === "/stock/movements"
    ) {
        const originalJson = res.json.bind(res);

        res.json = payload => {
            const removeMoney = value => {
                if (
                    value === null ||
                    value === undefined
                ) {
                    return value;
                }

                if (typeof value === "string") {
                    return value
                        .replace(
                            /Harga jual:\s*Rp\s*[\d.,]+\s*\|?\s*/gi,
                            ""
                        )
                        .replace(
                            /Total penjualan:\s*Rp\s*[\d.,]+\s*\|?\s*/gi,
                            ""
                        )
                        .replace(
                            /Harga modal:\s*Rp\s*[\d.,]+\s*\|?\s*/gi,
                            ""
                        )
                        .trim();
                }

                if (
                    typeof value !== "object"
                ) {
                    return value;
                }

                if (Array.isArray(value)) {
                    return value.map(removeMoney);
                }

                const output = {};

                for (
                    const [key, item]
                    of Object.entries(value)
                ) {
                    const lowerKey =
                        key.toLowerCase();

                    /*
                     * Jangan kirim field uang ke Staff.
                     */
                    if (
                        lowerKey.includes("sale_price") ||
                        lowerKey.includes("selling_price") ||
                        lowerKey.includes("total_sale") ||
                        lowerKey.includes("total_penjualan") ||
                        lowerKey.includes("revenue") ||
                        lowerKey.includes("pendapatan") ||
                        lowerKey.includes("cost_price") ||
                        lowerKey.includes("harga_modal") ||
                        lowerKey.includes("harga_jual")
                    ) {
                        continue;
                    }

                    output[key] =
                        removeMoney(item);
                }

                return output;
            };

            return originalJson(
                removeMoney(payload)
            );
        };
    }

    next();
});

/*
|--------------------------------------------------------------------------
| BASIC ROUTES
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Jessie Collection API berjalan"
    });
});

/*
|--------------------------------------------------------------------------
| API ROUTES
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/products", productRoutes);

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

const PORT =
    process.env.PORT || 3000;

async function start() {
    let connection;

    try {
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

        connection.release();

        app.listen(PORT, () => {
            console.log(
                `Jessie Collection API berjalan di http://localhost:${PORT}`
            );
        });

    } catch (error) {
        if (connection) {
            connection.release();
        }

        console.error(
            "Gagal menyiapkan database:",
            error.message
        );

        process.exit(1);
    }
}

start();