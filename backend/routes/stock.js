const express = require("express");
const db = require("../config/database");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| STOK MASUK
|--------------------------------------------------------------------------
| POST /api/stock/in
|
| Menambah stok produk.
| Harga jual TIDAK dipakai di sini karena ini khusus stok masuk.
*/
router.post("/in", authenticateToken, requireAdmin, async (req, res) => {
    let connection;

    try {
        const {
            product_id,
            quantity,
            movement_date,
            notes
        } = req.body;

        if (!product_id || quantity === undefined || quantity === null) {
            return res.status(400).json({
                success: false,
                message: "product_id dan quantity wajib diisi"
            });
        }

        const qty = Number(quantity);

        if (!Number.isInteger(qty) || qty <= 0) {
            return res.status(400).json({
                success: false,
                message: "quantity harus berupa angka bulat lebih dari 0"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [products] = await connection.query(
            "SELECT id, stock FROM products WHERE id = ? FOR UPDATE",
            [product_id]
        );

        if (products.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Produk tidak ditemukan"
            });
        }

        const product = products[0];

        const stockBefore = Number(product.stock);
        const stockAfter = stockBefore + qty;

        await connection.query(
            "UPDATE products SET stock = ? WHERE id = ?",
            [stockAfter, product_id]
        );

        await connection.query(
            `INSERT INTO stock_movements
            (
                product_id,
                type,
                quantity,
                sale_price,
                total_sale,
                movement_date,
                notes,
                created_by
            )
            VALUES (?, 'IN', ?, 0, 0, ?, ?, ?)`,
            [
                product_id,
                qty,
                movement_date || new Date().toISOString().slice(0, 10),
                notes || null,
                req.user.id
            ]
        );

        await connection.commit();

        return res.json({
            success: true,
            message: "Stok masuk berhasil",
            data: {
                product_id: Number(product_id),
                stock_before: stockBefore,
                quantity: qty,
                stock_after: stockAfter
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("STOK IN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
});


/*
|--------------------------------------------------------------------------
| STOK TERJUAL / STOK KELUAR
|--------------------------------------------------------------------------
| POST /api/stock/out
|
| Body:
| {
|   "product_id": 1,
|   "quantity": 5,
|   "sale_price": 10000,
|   "movement_date": "2026-08-27",
|   "notes": "Penjualan customer"
| }
|
| Otomatis:
| total_sale = quantity * sale_price
|
| Stok tidak boleh dijual jika stok kosong/tidak mencukupi.
*/
router.post("/out", authenticateToken, requireAdmin, async (req, res) => {
    let connection;

    try {
        const {
            product_id,
            quantity,
            sale_price,
            movement_date,
            notes
        } = req.body;

        if (!product_id || quantity === undefined || quantity === null) {
            return res.status(400).json({
                success: false,
                message: "product_id dan quantity wajib diisi"
            });
        }

        if (sale_price === undefined || sale_price === null || sale_price === "") {
            return res.status(400).json({
                success: false,
                message: "Harga jual wajib diisi"
            });
        }

        const qty = Number(quantity);
        const price = Number(sale_price);

        if (!Number.isInteger(qty) || qty <= 0) {
            return res.status(400).json({
                success: false,
                message: "quantity harus berupa angka bulat lebih dari 0"
            });
        }

        if (!Number.isFinite(price) || price < 0) {
            return res.status(400).json({
                success: false,
                message: "Harga jual tidak valid"
            });
        }

        const totalSale = qty * price;

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [products] = await connection.query(
            `
            SELECT
                p.id,
                p.stock,
                p.code,
                b.name AS brand
            FROM products p
            JOIN brands b ON b.id = p.brand_id
            WHERE p.id = ?
            FOR UPDATE
            `,
            [product_id]
        );

        if (products.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Produk tidak ditemukan"
            });
        }

        const product = products[0];
        const stockBefore = Number(product.stock);

        if (stockBefore <= 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Produk tidak bisa dijual karena stok kosong"
            });
        }

        if (stockBefore < qty) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Stok tidak mencukupi",
                data: {
                    code: product.code,
                    stock_available: stockBefore,
                    quantity_requested: qty
                }
            });
        }

        const stockAfter = stockBefore - qty;

        await connection.query(
            "UPDATE products SET stock = ? WHERE id = ?",
            [stockAfter, product_id]
        );

        await connection.query(
            `INSERT INTO stock_movements
            (
                product_id,
                type,
                quantity,
                sale_price,
                total_sale,
                movement_date,
                notes,
                created_by
            )
            VALUES (?, 'OUT', ?, ?, ?, ?, ?, ?)`,
            [
                product_id,
                qty,
                price,
                totalSale,
                movement_date || new Date().toISOString().slice(0, 10),
                notes || null,
                req.user.id
            ]
        );

        await connection.commit();

        return res.json({
            success: true,
            message: "Stok terjual berhasil dicatat",
            data: {
                product_id: Number(product_id),
                brand: product.brand,
                code: product.code,
                stock_before: stockBefore,
                quantity: qty,
                stock_after: stockAfter,
                sale_price: price,
                total_sale: totalSale
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("STOK OUT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
});


/*
|--------------------------------------------------------------------------
| RIWAYAT SEMUA PERGERAKAN STOK
|--------------------------------------------------------------------------
| GET /api/stock/movements
|
| Menampilkan stok masuk DAN stok terjual.
*/
router.get("/movements", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [movements] = await db.query(`
            SELECT
                sm.id,
                sm.product_id,
                b.name AS brand,
                p.code,
                sm.type,
                sm.quantity,
                sm.sale_price,
                sm.total_sale,
                sm.movement_date,
                sm.notes,
                sm.created_by,
                u.username AS created_by_username,
                sm.created_at
            FROM stock_movements sm
            JOIN products p ON p.id = sm.product_id
            JOIN brands b ON b.id = p.brand_id
            JOIN users u ON u.id = sm.created_by
            ORDER BY sm.movement_date DESC, sm.id DESC
        `);

        return res.json({
            success: true,
            data: movements
        });

    } catch (error) {
        console.error("GET STOCK MOVEMENTS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
});


/*
|--------------------------------------------------------------------------
| RIWAYAT STOK MASUK
|--------------------------------------------------------------------------
| GET /api/stock/in
|
| Khusus semua transaksi stok masuk.
*/
router.get("/in", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [movements] = await db.query(`
            SELECT
                sm.id,
                sm.product_id,
                b.name AS brand,
                p.code,
                sm.quantity,
                sm.movement_date,
                sm.notes,
                sm.created_by,
                u.username AS created_by_username,
                sm.created_at
            FROM stock_movements sm
            JOIN products p ON p.id = sm.product_id
            JOIN brands b ON b.id = p.brand_id
            JOIN users u ON u.id = sm.created_by
            WHERE sm.type = 'IN'
            ORDER BY sm.movement_date DESC, sm.id DESC
        `);

        return res.json({
            success: true,
            data: movements
        });

    } catch (error) {
        console.error("GET STOCK IN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil riwayat stok masuk"
        });
    }
});


/*
|--------------------------------------------------------------------------
| RIWAYAT STOK TERJUAL
|--------------------------------------------------------------------------
| GET /api/stock/out
|
| Khusus semua transaksi penjualan/stok keluar.
*/
router.get("/out", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [movements] = await db.query(`
            SELECT
                sm.id,
                sm.product_id,
                b.name AS brand,
                p.code,
                sm.quantity,
                sm.sale_price,
                sm.total_sale,
                sm.movement_date,
                sm.notes,
                sm.created_by,
                u.username AS created_by_username,
                sm.created_at
            FROM stock_movements sm
            JOIN products p ON p.id = sm.product_id
            JOIN brands b ON b.id = p.brand_id
            JOIN users u ON u.id = sm.created_by
            WHERE sm.type = 'OUT'
            ORDER BY sm.movement_date DESC, sm.id DESC
        `);

        return res.json({
            success: true,
            data: movements
        });

    } catch (error) {
        console.error("GET STOCK OUT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil riwayat stok terjual"
        });
    }
});


/*
|--------------------------------------------------------------------------
| SUMMARY STOK
|--------------------------------------------------------------------------
| GET /api/stock/summary
|
| Mengambil:
| - total produk
| - total stok
| - stok minimum
| - stok kosong
| - total stok masuk
| - total stok terjual
| - pendapatan bulan ini
| - barang terjual bulan ini
| - transaksi bulan ini
*/
router.get("/summary", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [summary] = await db.query(`
            SELECT
                COUNT(*) AS total_products,

                COALESCE(
                    SUM(stock),
                    0
                ) AS total_stock,

                COALESCE(
                    SUM(
                        CASE
                            WHEN stock <= minimum_stock THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS low_stock_products,

                COALESCE(
                    SUM(
                        CASE
                            WHEN stock = 0 THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS out_of_stock_products

            FROM products
        `);

        const [movements] = await db.query(`
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN type = 'IN' THEN quantity
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_stock_in,

                COALESCE(
                    SUM(
                        CASE
                            WHEN type = 'OUT' THEN quantity
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_stock_out

            FROM stock_movements
        `);

        const [monthlySales] = await db.query(`
            SELECT
                COALESCE(SUM(quantity), 0) AS items_sold_this_month,
                COALESCE(SUM(total_sale), 0) AS sales_revenue_this_month,
                COUNT(*) AS transactions_this_month

            FROM stock_movements

            WHERE type = 'OUT'

            AND YEAR(movement_date) = YEAR(CURDATE())

            AND MONTH(movement_date) = MONTH(CURDATE())
        `);

        return res.json({
            success: true,
            data: {
                total_products: Number(summary[0].total_products),
                total_stock: Number(summary[0].total_stock),
                low_stock_products: Number(summary[0].low_stock_products),
                out_of_stock_products: Number(summary[0].out_of_stock_products),

                total_stock_in: Number(movements[0].total_stock_in),
                total_stock_out: Number(movements[0].total_stock_out),

                items_sold_this_month:
                    Number(monthlySales[0].items_sold_this_month),

                sales_revenue_this_month:
                    Number(monthlySales[0].sales_revenue_this_month),

                transactions_this_month:
                    Number(monthlySales[0].transactions_this_month)
            }
        });

    } catch (error) {
        console.error("GET STOCK SUMMARY ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil summary stok"
        });
    }
});


/*
|--------------------------------------------------------------------------
| HISTORY PENJUALAN PER BULAN
|--------------------------------------------------------------------------
| GET /api/stock/sales-history
|
| Contoh:
| 2026-08 -> 125 barang -> Rp8.750.000
| 2026-07 -> 98 barang  -> Rp6.420.000
*/
router.get("/sales-history", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [history] = await db.query(`
            SELECT
                DATE_FORMAT(movement_date, '%Y-%m') AS month,
                SUM(quantity) AS items_sold,
                SUM(total_sale) AS revenue,
                COUNT(*) AS transactions

            FROM stock_movements

            WHERE type = 'OUT'

            GROUP BY
                YEAR(movement_date),
                MONTH(movement_date)

            ORDER BY
                YEAR(movement_date) DESC,
                MONTH(movement_date) DESC
        `);

        return res.json({
            success: true,
            data: history.map(item => ({
                month: item.month,
                items_sold: Number(item.items_sold),
                revenue: Number(item.revenue),
                transactions: Number(item.transactions)
            }))
        });

    } catch (error) {
        console.error("GET SALES HISTORY ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil history penjualan"
        });
    }
});


/*
|--------------------------------------------------------------------------
| PRODUK / KODE TERLARIS
|--------------------------------------------------------------------------
| GET /api/stock/top-products
|
| Default:
| Mengambil 10 kode produk dengan jumlah terjual terbanyak.
|
| Bisa menggunakan:
| /api/stock/top-products?limit=10
*/
router.get("/top-products", authenticateToken, requireAdmin, async (req, res) => {
    try {
        let limit = Number(req.query.limit || 10);

        if (!Number.isInteger(limit) || limit <= 0) {
            limit = 10;
        }

        if (limit > 100) {
            limit = 100;
        }

        const [products] = await db.query(
            `
            SELECT
                p.id AS product_id,
                b.name AS brand,
                p.code,
                SUM(sm.quantity) AS total_quantity_sold,
                SUM(sm.total_sale) AS total_revenue,
                COUNT(sm.id) AS total_transactions

            FROM stock_movements sm

            JOIN products p
                ON p.id = sm.product_id

            JOIN brands b
                ON b.id = p.brand_id

            WHERE sm.type = 'OUT'

            GROUP BY
                p.id,
                b.name,
                p.code

            ORDER BY
                total_quantity_sold DESC,
                total_revenue DESC

            LIMIT ?
            `,
            [limit]
        );

        return res.json({
            success: true,
            data: products.map(item => ({
                product_id: Number(item.product_id),
                brand: item.brand,
                code: item.code,
                total_quantity_sold:
                    Number(item.total_quantity_sold),
                total_revenue:
                    Number(item.total_revenue),
                total_transactions:
                    Number(item.total_transactions)
            }))
        });

    } catch (error) {
        console.error("GET TOP PRODUCTS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Gagal mengambil produk terlaris"
        });
    }
});


module.exports = router;