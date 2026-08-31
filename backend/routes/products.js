const express = require("express");
const db = require("../config/database");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();


// ============================================================
// GET SEMUA PRODUK
// GET /api/products
// ============================================================
router.get("/", authenticateToken, async (req, res) => {
    try {
        const isAdmin = req.user.role === "admin";

        const [products] = await db.query(`
            SELECT
                p.id,
                p.brand_id,
                b.name AS brand,
                p.code,
                p.description,
                p.stock,
                p.minimum_stock,
                p.cost_price,
                p.created_at,
                p.updated_at
            FROM products p
            JOIN brands b ON b.id = p.brand_id
            ${isAdmin ? "" : "WHERE p.stock > 0"}
            ORDER BY p.id ASC
        `);

        const data = isAdmin
            ? products
            : products.map(p => ({
                id: p.id,
                brand_id: p.brand_id,
                brand: p.brand,
                code: p.code,
                description: p.description,
                stock: p.stock
            }));

        return res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error("GET PRODUCTS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil data produk"
        });
    }
});


// ============================================================
// GET PRODUK BERDASARKAN ID
// GET /api/products/:id
// ============================================================
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT
                p.id,
                p.brand_id,
                b.name AS brand,
                p.code,
                p.description,
                p.stock,
                p.minimum_stock,
                p.cost_price,
                p.created_at,
                p.updated_at
            FROM products p
            JOIN brands b ON b.id = p.brand_id
            WHERE p.id = ?
        `, [req.params.id]);

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Produk tidak ditemukan"
            });
        }

        const product = products[0];

        if (req.user.role !== "admin") {
            if (Number(product.stock) <= 0) {
                return res.status(404).json({
                    success: false,
                    message: "Produk tidak ditemukan"
                });
            }

            return res.json({
                success: true,
                data: {
                    id: product.id,
                    brand_id: product.brand_id,
                    brand: product.brand,
                    code: product.code,
                    description: product.description,
                    stock: product.stock
                }
            });
        }

        return res.json({
            success: true,
            data: product
        });

    } catch (error) {
        console.error("GET PRODUCT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil produk"
        });
    }
});


// ============================================================
// TAMBAH PRODUK
// POST /api/products
// ============================================================
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {
            brand_id,
            code,
            description = null,
            stock = 0,
            minimum_stock = 0,
            cost_price = 0
        } = req.body;

        if (!brand_id || !code) {
            return res.status(400).json({
                success: false,
                message: "brand_id dan code wajib diisi"
            });
        }

        if (Number(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: "stock tidak boleh kurang dari 0"
            });
        }

        if (Number(minimum_stock) < 0) {
            return res.status(400).json({
                success: false,
                message: "minimum_stock tidak boleh kurang dari 0"
            });
        }

        if (Number(cost_price) < 0) {
            return res.status(400).json({
                success: false,
                message: "cost_price tidak boleh kurang dari 0"
            });
        }

        // Cek brand
        const [brands] = await db.query(
            "SELECT id FROM brands WHERE id = ?",
            [brand_id]
        );

        if (brands.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Brand tidak ditemukan"
            });
        }

        // Cek kode produk
        const [existing] = await db.query(
            "SELECT id FROM products WHERE brand_id = ? AND code = ?",
            [brand_id, code]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Produk dengan code tersebut sudah ada pada brand ini"
            });
        }

        const [result] = await db.query(`
            INSERT INTO products
            (
                brand_id,
                code,
                description,
                stock,
                minimum_stock,
                cost_price
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            brand_id,
            code,
            description && String(description).trim()
                ? String(description).trim()
                : null,
            stock,
            minimum_stock,
            cost_price
        ]);

        return res.status(201).json({
            success: true,
            message: "Produk berhasil ditambahkan",
            data: {
                id: result.insertId,
                brand_id: Number(brand_id),
                code,
                description: description && String(description).trim()
                    ? String(description).trim()
                    : null,
                stock: Number(stock),
                minimum_stock: Number(minimum_stock),
                cost_price: Number(cost_price)
            }
        });

    } catch (error) {
        console.error("CREATE PRODUCT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal menambahkan produk"
        });
    }
});


// ============================================================
// EDIT PRODUK
// PUT /api/products/:id
//
// Bisa mengubah:
// - brand_id
// - code
// - stock
// - cost_price
// ============================================================
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {
            brand_id,
            code,
            description,
            stock,
            cost_price
        } = req.body;

        const productId = req.params.id;

        // Cek produk
        const [products] = await db.query(
            "SELECT id FROM products WHERE id = ?",
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Produk tidak ditemukan"
            });
        }

        // Validasi brand jika dikirim
        if (brand_id !== undefined) {
            const [brands] = await db.query(
                "SELECT id FROM brands WHERE id = ?",
                [brand_id]
            );

            if (brands.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Brand tidak ditemukan"
                });
            }
        }

        // Validasi stock
        if (stock !== undefined && Number(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: "stock tidak boleh kurang dari 0"
            });
        }

        // Validasi harga modal
        if (cost_price !== undefined && Number(cost_price) < 0) {
            return res.status(400).json({
                success: false,
                message: "cost_price tidak boleh kurang dari 0"
            });
        }

        // Cek apakah code baru bentrok
        if (code !== undefined || brand_id !== undefined) {
            const [existing] = await db.query(
                `
                SELECT id
                FROM products
                WHERE brand_id = ?
                AND code = ?
                AND id != ?
                `,
                [
                    brand_id !== undefined
                        ? brand_id
                        : (
                            await db.query(
                                "SELECT brand_id FROM products WHERE id = ?",
                                [productId]
                            )
                        )[0][0].brand_id,
                    code !== undefined
                        ? code
                        : (
                            await db.query(
                                "SELECT code FROM products WHERE id = ?",
                                [productId]
                            )
                        )[0][0].code,
                    productId
                ]
            );

            if (existing.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Produk dengan code tersebut sudah ada pada brand ini"
                });
            }
        }

        const fields = [];
        const values = [];

        if (brand_id !== undefined) {
            fields.push("brand_id = ?");
            values.push(brand_id);
        }

        if (code !== undefined) {
            fields.push("code = ?");
            values.push(code);
        }

        if (description !== undefined) {
            fields.push("description = ?");
            values.push(
                description && String(description).trim()
                    ? String(description).trim()
                    : null
            );
        }

        if (stock !== undefined) {
            fields.push("stock = ?");
            values.push(stock);
        }

        if (cost_price !== undefined) {
            fields.push("cost_price = ?");
            values.push(cost_price);
        }

        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Tidak ada data yang diubah"
            });
        }

        values.push(productId);

        await db.query(
            `UPDATE products SET ${fields.join(", ")} WHERE id = ?`,
            values
        );

        return res.json({
            success: true,
            message: "Produk berhasil diperbarui"
        });

    } catch (error) {
        console.error("UPDATE PRODUCT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal memperbarui produk"
        });
    }
});


// ============================================================
// HAPUS PRODUK
// DELETE /api/products/:id
// ============================================================
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [products] = await db.query(
            "SELECT id, stock FROM products WHERE id = ?",
            [req.params.id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Produk tidak ditemukan"
            });
        }

        // Tidak boleh hapus jika stok masih ada
        if (Number(products[0].stock) > 0) {
            return res.status(400).json({
                success: false,
                message: "Produk tidak bisa dihapus karena stok masih tersedia"
            });
        }

        // Tidak boleh hapus jika sudah punya riwayat stok
        const [movements] = await db.query(
            `
            SELECT id
            FROM stock_movements
            WHERE product_id = ?
            LIMIT 1
            `,
            [req.params.id]
        );

        if (movements.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Produk tidak bisa dihapus karena sudah memiliki riwayat stok"
            });
        }

        await db.query(
            "DELETE FROM products WHERE id = ?",
            [req.params.id]
        );

        return res.json({
            success: true,
            message: "Produk berhasil dihapus"
        });

    } catch (error) {
        console.error("DELETE PRODUCT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal menghapus produk"
        });
    }
});


module.exports = router;