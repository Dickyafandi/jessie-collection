const express = require("express");
const db = require("../config/database");

const {
    authenticateToken,
    requireAdmin,
    requireAdminOrStaff
} = require("../middleware/auth");

const router = express.Router();

function parsePositiveInteger(
    value,
    fieldName
) {
    const number = Number(value);

    if (
        !Number.isInteger(number) ||
        number <= 0
    ) {
        throw new Error(
            `${fieldName} harus berupa angka bulat lebih dari 0`
        );
    }

    return number;
}

function parseSalePrice(value) {
    const price = Number(value);

    if (
        !Number.isFinite(price) ||
        price <= 0
    ) {
        throw new Error(
            "Harga jual tidak valid"
        );
    }

    return price;
}

function parseProductId(value) {
    const id = Number(value);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        throw new Error(
            "product_id tidak valid"
        );
    }

    return id;
}

function parseMovementDate(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return new Date()
            .toISOString()
            .slice(0, 10);
    }

    const date =
        String(value).trim();

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
            date
        )
    ) {
        throw new Error(
            "movement_date harus berformat YYYY-MM-DD"
        );
    }

    return date;
}

function parseNotes(value) {
    if (
        value === undefined ||
        value === null
    ) {
        return null;
    }

    const notes =
        String(value).trim();

    if (notes.length > 500) {
        throw new Error(
            "Catatan terlalu panjang"
        );
    }

    return notes || null;
}


// ============================================================
// STOK MASUK
// POST /api/stock/in
// ADMIN + STAFF
// ============================================================

router.post(
    "/in",
    authenticateToken,
    requireAdminOrStaff,
    async (req, res) => {
        let connection;

        try {
            const productId =
                parseProductId(
                    req.body?.product_id
                );

            const qty =
                parsePositiveInteger(
                    req.body?.quantity,
                    "quantity"
                );

            const movementDate =
                parseMovementDate(
                    req.body?.movement_date
                );

            const notes =
                parseNotes(
                    req.body?.notes
                );

            connection =
                await db.getConnection();

            await connection.beginTransaction();

            const [products] =
                await connection.query(
                    `
                    SELECT
                        id,
                        stock
                    FROM products
                    WHERE id = ?
                    FOR UPDATE
                    `,
                    [productId]
                );

            if (products.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    message:
                        "Produk tidak ditemukan"
                });
            }

            const product =
                products[0];

            const stockBefore =
                Number(
                    product.stock
                );

            const stockAfter =
                stockBefore + qty;

            await connection.query(
                `
                UPDATE products
                SET stock = ?
                WHERE id = ?
                `,
                [
                    stockAfter,
                    productId
                ]
            );

            await connection.query(
                `
                INSERT INTO stock_movements
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
                VALUES (
                    ?,
                    'IN',
                    ?,
                    0,
                    0,
                    ?,
                    ?,
                    ?
                )
                `,
                [
                    productId,
                    qty,
                    movementDate,
                    notes,
                    req.user.id
                ]
            );

            await connection.commit();

            return res.json({
                success: true,
                message:
                    "Stok masuk berhasil",
                data: {
                    product_id:
                        productId,
                    stock_before:
                        stockBefore,
                    quantity:
                        qty,
                    stock_after:
                        stockAfter
                }
            });

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }

            if (
                error.message.includes(
                    "harus berupa"
                ) ||
                error.message.includes(
                    "tidak valid"
                ) ||
                error.message.includes(
                    "berformat"
                ) ||
                error.message.includes(
                    "terlalu panjang"
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        error.message
                });
            }

            console.error(
                "STOK IN ERROR:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Terjadi kesalahan server"
            });

        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
);


// ============================================================
// STOK TERJUAL / STOK KELUAR
// POST /api/stock/out
// ADMIN + STAFF
//
// Staff BOLEH input sale_price,
// tetapi tidak menerima sale_price / total_sale
// pada response.
// ============================================================

router.post(
    "/out",
    authenticateToken,
    requireAdminOrStaff,
    async (req, res) => {
        let connection;

        try {
            const productId =
                parseProductId(
                    req.body?.product_id
                );

            const qty =
                parsePositiveInteger(
                    req.body?.quantity,
                    "quantity"
                );

            const price =
                parseSalePrice(
                    req.body?.sale_price
                );

            const movementDate =
                parseMovementDate(
                    req.body?.movement_date
                );

            const notes =
                parseNotes(
                    req.body?.notes
                );

            const totalSale =
                qty * price;

            connection =
                await db.getConnection();

            await connection.beginTransaction();

            const [products] =
                await connection.query(
                    `
                    SELECT
                        p.id,
                        p.stock,
                        p.code,
                        b.name AS brand
                    FROM products p
                    JOIN brands b
                        ON b.id = p.brand_id
                    WHERE p.id = ?
                    FOR UPDATE
                    `,
                    [productId]
                );

            if (products.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    message:
                        "Produk tidak ditemukan"
                });
            }

            const product =
                products[0];

            const stockBefore =
                Number(
                    product.stock
                );

            if (stockBefore <= 0) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "Produk tidak bisa dijual karena stok kosong"
                });
            }

            if (
                stockBefore < qty
            ) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "Stok tidak mencukupi",
                    data: {
                        code:
                            product.code,
                        stock_available:
                            stockBefore,
                        quantity_requested:
                            qty
                    }
                });
            }

            const stockAfter =
                stockBefore - qty;

            await connection.query(
                `
                UPDATE products
                SET stock = ?
                WHERE id = ?
                `,
                [
                    stockAfter,
                    productId
                ]
            );

            await connection.query(
                `
                INSERT INTO stock_movements
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
                VALUES (
                    ?,
                    'OUT',
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
                `,
                [
                    productId,
                    qty,
                    price,
                    totalSale,
                    movementDate,
                    notes,
                    req.user.id
                ]
            );

            await connection.commit();

            const responseData = {
                product_id:
                    productId,
                brand:
                    product.brand,
                code:
                    product.code,
                stock_before:
                    stockBefore,
                quantity:
                    qty,
                stock_after:
                    stockAfter
            };

            if (
                req.user.role ===
                "admin"
            ) {
                responseData.sale_price =
                    price;

                responseData.total_sale =
                    totalSale;
            }

            return res.json({
                success: true,
                message:
                    "Stok terjual berhasil dicatat",
                data: responseData
            });

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }

            if (
                error.message.includes(
                    "harus berupa"
                ) ||
                error.message.includes(
                    "tidak valid"
                ) ||
                error.message.includes(
                    "berformat"
                ) ||
                error.message.includes(
                    "terlalu panjang"
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        error.message
                });
            }

            console.error(
                "STOK OUT ERROR:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Terjadi kesalahan server"
            });

        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
);


// ============================================================
// RIWAYAT SEMUA PERGERAKAN
// GET /api/stock/movements
// ADMIN + STAFF
// ============================================================

router.get(
    "/movements",
    authenticateToken,
    requireAdminOrStaff,
    async (req, res) => {
        try {
            const isAdmin =
                req.user.role ===
                "admin";

            const fields = isAdmin
                ? `
                    sm.sale_price,
                    sm.total_sale,
                  `
                : "";

            const [movements] =
                await db.query(
                    `
                    SELECT
                        sm.id,
                        sm.product_id,
                        b.name AS brand,
                        p.code,
                        sm.type,
                        sm.quantity,
                        ${fields}
                        sm.movement_date,
                        sm.notes,
                        sm.created_by,
                        u.username AS created_by_username,
                        sm.created_at
                    FROM stock_movements sm
                    JOIN products p
                        ON p.id = sm.product_id
                    JOIN brands b
                        ON b.id = p.brand_id
                    JOIN users u
                        ON u.id = sm.created_by
                    ORDER BY
                        sm.movement_date DESC,
                        sm.id DESC
                    `
                );

            return res.json({
                success: true,
                data:
                    movements.map(
                        row => ({
                            ...row,
                            id: Number(
                                row.id
                            ),
                            product_id:
                                Number(
                                    row.product_id
                                ),
                            quantity:
                                Number(
                                    row.quantity
                                ),
                            ...(isAdmin
                                ? {
                                    sale_price:
                                        Number(
                                            row.sale_price ||
                                            0
                                        ),
                                    total_sale:
                                        Number(
                                            row.total_sale ||
                                            0
                                        )
                                }
                                : {})
                        })
                    )
            });

        } catch (error) {
            console.error(
                "GET STOCK MOVEMENTS ERROR:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Terjadi kesalahan server"
            });
        }
    }
);


// ============================================================
// RIWAYAT STOK MASUK
// GET /api/stock/in
// ADMIN + STAFF
// ============================================================

router.get(
    "/in",
    authenticateToken,
    requireAdminOrStaff,
    async (req, res) => {
        try {
            const [movements] =
                await db.query(`
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
                    JOIN products p
                        ON p.id = sm.product_id
                    JOIN brands b
                        ON b.id = p.brand_id
                    JOIN users u
                        ON u.id = sm.created_by
                    WHERE sm.type = 'IN'
                    ORDER BY
                        sm.movement_date DESC,
                        sm.id DESC
                `);

            return res.json({
                success: true,
                data: movements.map(
                    row => ({
                        ...row,
                        id: Number(
                            row.id
                        ),
                        product_id:
                            Number(
                                row.product_id
                            ),
                        quantity:
                            Number(
                                row.quantity
                            )
                    })
                )
            });

        } catch (error) {
            console.error(
                "GET STOCK IN ERROR:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Gagal mengambil riwayat stok masuk"
            });
        }
    }
);


// ============================================================
// RIWAYAT STOK TERJUAL
// GET /api/stock/out
// ADMIN + STAFF
// ============================================================

router.get(
    "/out",
    authenticateToken,
    requireAdminOrStaff,
    async (req, res) => {
        try {
            const isAdmin =
                req.user.role ===
                "admin";

            const fields = isAdmin
                ? `
                    sm.sale_price,
                    sm.total_sale,
                  `
                : "";

            const [movements] =
                await db.query(
                    `
                    SELECT
                        sm.id,
                        sm.product_id,
                        b.name AS brand,
                        p.code,
                        sm.quantity,
                        ${fields}
                        sm.movement_date,
                        sm.notes,
                        sm.created_by,
                        u.username AS created_by_username,
                        sm.created_at
                    FROM stock_movements sm
                    JOIN products p
                        ON p.id = sm.product_id
                    JOIN brands b
                        ON b.id = p.brand_id
                    JOIN users u
                        ON u.id = sm.created_by
                    WHERE sm.type = 'OUT'
                    ORDER BY
                        sm.movement_date DESC,
                        sm.id DESC
                    `
                );

            return res.json({
                success: true,
                data:
                    movements.map(
                        row => ({
                            ...row,
                            id: Number(
                                row.id
                            ),
                            product_id:
                                Number(
                                    row.product_id
                                ),
                            quantity:
                                Number(
                                    row.quantity
                                ),
                            ...(isAdmin
                                ? {
                                    sale_price:
                                        Number(
                                            row.sale_price ||
                                            0
                                        ),
                                    total_sale:
                                        Number(
                                            row.total_sale ||
                                            0
                                        )
                                }
                                : {})
                        })
                    )
            });

        } catch (error) {
            console.error(
                "GET STOCK OUT ERROR:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Gagal mengambil riwayat stok terjual"
            });
        }
    }
);


// ============================================================
// SUMMARY STOK
// ADMIN ONLY
// GET /api/stock/summary
// ============================================================

router.get(
    "/summary",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const [summary] =
                await db.query(`
                    SELECT
                        COUNT(*) AS total_products,

                        COALESCE(
                            SUM(stock),
                            0
                        ) AS total_stock,

                        COALESCE(
                            SUM(
                                CASE
                                    WHEN stock <= minimum_stock
                                    THEN 1
                                    ELSE 0
                                END
                            ),
                            0
                        ) AS low_stock_products,

                        COALESCE(
                            SUM(
                                CASE
                                    WHEN stock = 0
                                    THEN 1
                                    ELSE 0
                                END
                            ),
                            0
                        ) AS out_of_stock_products

                    FROM products
                `);

            const [movements] =
                await db.query(`
                    SELECT
                        COALESCE(
                            SUM(
                                CASE
                                    WHEN type = 'IN'
                                    THEN quantity
                                    ELSE 0
                                END
                            ),
                            0
                        ) AS total_stock_in,

                        COALESCE(
                            SUM(
                                CASE
                                    WHEN type = 'OUT'
                                    THEN quantity
                                    ELSE 0
                                END
                            ),
                            0
                        ) AS total_stock_out

                    FROM stock_movements
                `);

            const [monthlySales] =
                await db.query(`
                    SELECT
                        COALESCE(
                            SUM(quantity),
                            0
                        ) AS items_sold_this_month,

                        COALESCE(
                            SUM(total_sale),
                            0
                        ) AS sales_revenue_this_month,

                        COUNT(*) AS transactions_this_month

                    FROM stock_movements

                    WHERE type = 'OUT'

                    AND YEAR(movement_date)
                        = YEAR(CURDATE())

                    AND MONTH(movement_date)
                        = MONTH(CURDATE())
                `);

            return res.json({
                success: true,
                data: {
                    total_products:
                        Number(
                            summary[0]
                                .total_products
                        ),

                    total_stock:
                        Number(
                            summary[0]
                                .total_stock
                        ),

                    low_stock_products:
                        Number(
                            summary[0]
                                .low_stock_products
                        ),

                    out_of_stock_products:
                        Number(
                            summary[0]
                                .out_of_stock_products
                        ),

                    total_stock_in:
                        Number(
                            movements[0]
                                .total_stock_in
                        ),

                    total_stock_out:
                        Number(
                            movements[0]
                                .total_stock_out
                        ),

                    items_sold_this_month:
                        Number(
                            monthlySales[0]
                                .items_sold_this_month
                        ),

                    sales_revenue_this_month:
                        Number(
                            monthlySales[0]
                                .sales_revenue_this_month
                        ),

                    transactions_this_month:
                        Number(
                            monthlySales[0]
                                .transactions_this_month
                        )
                }
            });

        } catch (error) {
            console.error(
                "GET STOCK SUMMARY ERROR:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Gagal mengambil summary stok"
            });
        }
    }
);


// ============================================================
// HISTORY PENJUALAN PER BULAN
// ADMIN ONLY
// ============================================================

router.get(
    "/sales-history",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const [history] =
                await db.query(`
                    SELECT
                        DATE_FORMAT(
                            movement_date,
                            '%Y-%m'
                        ) AS month,

                        SUM(quantity)
                            AS items_sold,

                        SUM(total_sale)
                            AS revenue,

                        COUNT(*)
                            AS transactions

                    FROM stock_movements

                    WHERE type = 'OUT'

                    GROUP BY
                        YEAR(movement_date),
                        MONTH(movement_date)

                    ORDER BY
                        YEAR(movement_date)
                            DESC,
                        MONTH(movement_date)
                            DESC
                `);

            return res.json({
                success: true,
                data: history.map(
                    item => ({
                        month:
                            item.month,

                        items_sold:
                            Number(
                                item.items_sold
                            ),

                        revenue:
                            Number(
                                item.revenue
                            ),

                        transactions:
                            Number(
                                item.transactions
                            )
                    })
                )
            });

        } catch (error) {
            console.error(
                "GET SALES HISTORY ERROR:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Gagal mengambil history penjualan"
            });
        }
    }
);


// ============================================================
// PRODUK / KODE TERLARIS
// ADMIN ONLY
// ============================================================

router.get(
    "/top-products",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            let limit =
                Number(
                    req.query.limit || 10
                );

            if (
                !Number.isInteger(
                    limit
                ) ||
                limit <= 0
            ) {
                limit = 10;
            }

            if (limit > 100) {
                limit = 100;
            }

            const [products] =
                await db.query(
                    `
                    SELECT
                        p.id
                            AS product_id,
                        b.name
                            AS brand,
                        p.code,

                        SUM(
                            sm.quantity
                        )
                            AS total_quantity_sold,

                        SUM(
                            sm.total_sale
                        )
                            AS total_revenue,

                        COUNT(sm.id)
                            AS total_transactions

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
                        total_quantity_sold
                            DESC,
                        total_revenue
                            DESC

                    LIMIT ?
                    `,
                    [limit]
                );

            return res.json({
                success: true,
                data:
                    products.map(
                        item => ({
                            product_id:
                                Number(
                                    item.product_id
                                ),
                            brand:
                                item.brand,
                            code:
                                item.code,
                            total_quantity_sold:
                                Number(
                                    item.total_quantity_sold
                                ),
                            total_revenue:
                                Number(
                                    item.total_revenue
                                ),
                            total_transactions:
                                Number(
                                    item.total_transactions
                                )
                        })
                    )
            });

        } catch (error) {
            console.error(
                "GET TOP PRODUCTS ERROR:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Gagal mengambil produk terlaris"
            });
        }
    }
);

module.exports = router;