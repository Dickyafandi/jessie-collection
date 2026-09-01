const express = require("express");
const db = require("../config/database");
const {
    authenticateToken,
    requireAdmin
} = require("../middleware/auth");

const router = express.Router();

function normalizeCode(value) {
    return String(value || "")
        .trim()
        .toUpperCase();
}

function parseNonNegativeInteger(
    value,
    fieldName
) {
    const number = Number(value);

    if (
        !Number.isInteger(number) ||
        number < 0
    ) {
        throw new Error(
            `${fieldName} harus berupa angka bulat 0 atau lebih`
        );
    }

    return number;
}

function parseNonNegativeNumber(
    value,
    fieldName
) {
    const number = Number(value);

    if (
        !Number.isFinite(number) ||
        number < 0
    ) {
        throw new Error(
            `${fieldName} harus berupa angka 0 atau lebih`
        );
    }

    return number;
}


// ============================================================
// GET SEMUA PRODUK
// GET /api/products
// ============================================================

router.get(
    "/",
    authenticateToken,
    async (req, res) => {
        try {
            const isAdmin =
                req.user.role === "admin";

            const [products] =
                await db.query(`
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
                    JOIN brands b
                        ON b.id = p.brand_id
                    ${
                        isAdmin
                            ? ""
                            : "WHERE p.stock > 0"
                    }
                    ORDER BY
                        b.name ASC,
                        p.code ASC
                `);

            const data = isAdmin
                ? products
                : products.map(
                    product => ({
                        id: Number(
                            product.id
                        ),
                        brand_id: Number(
                            product.brand_id
                        ),
                        brand:
                            product.brand,
                        code:
                            product.code,
                        description:
                            product.description,
                        stock: Number(
                            product.stock
                        )
                    })
                );

            return res.json({
                success: true,
                data
            });

        } catch (error) {
            console.error(
                "GET PRODUCTS ERROR:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Gagal mengambil data produk"
            });
        }
    }
);


// ============================================================
// GET PRODUK BERDASARKAN ID
// GET /api/products/:id
// ============================================================

router.get(
    "/:id",
    authenticateToken,
    async (req, res) => {
        try {
            const productId =
                Number(req.params.id);

            if (
                !Number.isInteger(productId) ||
                productId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "ID produk tidak valid"
                });
            }

            const [products] =
                await db.query(
                    `
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
                    JOIN brands b
                        ON b.id = p.brand_id
                    WHERE p.id = ?
                    LIMIT 1
                    `,
                    [productId]
                );

            if (products.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Produk tidak ditemukan"
                });
            }

            const product =
                products[0];

            if (
                req.user.role !==
                "admin"
            ) {
                if (
                    Number(product.stock) <= 0
                ) {
                    return res.status(404).json({
                        success: false,
                        message:
                            "Produk tidak ditemukan"
                    });
                }

                return res.json({
                    success: true,
                    data: {
                        id: Number(
                            product.id
                        ),
                        brand_id: Number(
                            product.brand_id
                        ),
                        brand:
                            product.brand,
                        code:
                            product.code,
                        description:
                            product.description,
                        stock: Number(
                            product.stock
                        )
                    }
                });
            }

            return res.json({
                success: true,
                data: product
            });

        } catch (error) {
            console.error(
                "GET PRODUCT ERROR:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Gagal mengambil produk"
            });
        }
    }
);


// ============================================================
// TAMBAH PRODUK
// POST /api/products
// ============================================================

router.post(
    "/",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const brandId =
                Number(req.body?.brand_id);

            const code =
                normalizeCode(
                    req.body?.code
                );

            const description =
                req.body?.description == null
                    ? null
                    : String(
                        req.body.description
                    ).trim();

            const stock =
                parseNonNegativeInteger(
                    req.body?.stock ?? 0,
                    "stock"
                );

            const minimumStock =
                parseNonNegativeInteger(
                    req.body?.minimum_stock ?? 0,
                    "minimum_stock"
                );

            const costPrice =
                parseNonNegativeNumber(
                    req.body?.cost_price ?? 0,
                    "cost_price"
                );

            if (
                !Number.isInteger(brandId) ||
                brandId <= 0 ||
                !code
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "brand_id dan code wajib diisi"
                });
            }

            if (code.length > 100) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Kode produk terlalu panjang"
                });
            }

            if (description && description.length > 1000) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Keterangan produk terlalu panjang"
                });
            }

            const [brands] =
                await db.query(
                    `
                    SELECT id
                    FROM brands
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [brandId]
                );

            if (brands.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Brand tidak ditemukan"
                });
            }

            const [existing] =
                await db.query(
                    `
                    SELECT id
                    FROM products
                    WHERE brand_id = ?
                    AND UPPER(code) = ?
                    LIMIT 1
                    `,
                    [brandId, code]
                );

            if (existing.length > 0) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Produk dengan code tersebut sudah ada pada brand ini"
                });
            }

            const [result] =
                await db.query(
                    `
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
                    `,
                    [
                        brandId,
                        code,
                        description || null,
                        stock,
                        minimumStock,
                        costPrice
                    ]
                );

            return res.status(201).json({
                success: true,
                message:
                    "Produk berhasil ditambahkan",
                data: {
                    id: Number(
                        result.insertId
                    ),
                    brand_id: brandId,
                    code,
                    description:
                        description || null,
                    stock,
                    minimum_stock:
                        minimumStock,
                    cost_price:
                        costPrice
                }
            });

        } catch (error) {
            if (
                error.message.includes(
                    "harus berupa"
                ) ||
                error.message.includes(
                    "terlalu panjang"
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            console.error(
                "CREATE PRODUCT ERROR:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Gagal menambahkan produk"
            });
        }
    }
);


// ============================================================
// EDIT PRODUK
// PUT /api/products/:id
// ============================================================

router.put(
    "/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const productId =
                Number(req.params.id);

            if (
                !Number.isInteger(productId) ||
                productId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "ID produk tidak valid"
                });
            }

            const [currentRows] =
                await db.query(
                    `
                    SELECT
                        id,
                        brand_id,
                        code
                    FROM products
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [productId]
                );

            if (currentRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Produk tidak ditemukan"
                });
            }

            const current =
                currentRows[0];

            const nextBrandId =
                req.body?.brand_id !== undefined
                    ? Number(
                        req.body.brand_id
                    )
                    : Number(
                        current.brand_id
                    );

            const nextCode =
                req.body?.code !== undefined
                    ? normalizeCode(
                        req.body.code
                    )
                    : normalizeCode(
                        current.code
                    );

            if (
                !Number.isInteger(
                    nextBrandId
                ) ||
                nextBrandId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "brand_id tidak valid"
                });
            }

            if (!nextCode) {
                return res.status(400).json({
                    success: false,
                    message:
                        "code tidak boleh kosong"
                });
            }

            if (nextCode.length > 100) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Kode produk terlalu panjang"
                });
            }

            if (
                req.body?.description !==
                undefined &&
                req.body.description !== null &&
                String(
                    req.body.description
                ).trim().length > 1000
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Keterangan produk terlalu panjang"
                });
            }

            if (
                req.body?.brand_id !==
                undefined
            ) {
                const [brands] =
                    await db.query(
                        `
                        SELECT id
                        FROM brands
                        WHERE id = ?
                        LIMIT 1
                        `,
                        [nextBrandId]
                    );

                if (
                    brands.length === 0
                ) {
                    return res.status(404).json({
                        success: false,
                        message:
                            "Brand tidak ditemukan"
                    });
                }
            }

            if (
                req.body?.stock !==
                undefined
            ) {
                parseNonNegativeInteger(
                    req.body.stock,
                    "stock"
                );
            }

            if (
                req.body?.cost_price !==
                undefined
            ) {
                parseNonNegativeNumber(
                    req.body.cost_price,
                    "cost_price"
                );
            }

            const [existing] =
                await db.query(
                    `
                    SELECT id
                    FROM products
                    WHERE brand_id = ?
                    AND UPPER(code) = ?
                    AND id != ?
                    LIMIT 1
                    `,
                    [
                        nextBrandId,
                        nextCode,
                        productId
                    ]
                );

            if (existing.length > 0) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Produk dengan code tersebut sudah ada pada brand ini"
                });
            }

            const fields = [];
            const values = [];

            if (
                req.body?.brand_id !==
                undefined
            ) {
                fields.push(
                    "brand_id = ?"
                );
                values.push(
                    nextBrandId
                );
            }

            if (
                req.body?.code !==
                undefined
            ) {
                fields.push(
                    "code = ?"
                );
                values.push(
                    nextCode
                );
            }

            if (
                req.body?.description !==
                undefined
            ) {
                const description =
                    req.body.description == null
                        ? null
                        : String(
                            req.body.description
                        ).trim();

                fields.push(
                    "description = ?"
                );
                values.push(
                    description || null
                );
            }

            if (
                req.body?.stock !==
                undefined
            ) {
                const stock =
                    parseNonNegativeInteger(
                        req.body.stock,
                        "stock"
                    );

                fields.push(
                    "stock = ?"
                );
                values.push(stock);
            }

            if (
                req.body?.cost_price !==
                undefined
            ) {
                const costPrice =
                    parseNonNegativeNumber(
                        req.body.cost_price,
                        "cost_price"
                    );

                fields.push(
                    "cost_price = ?"
                );
                values.push(
                    costPrice
                );
            }

            if (fields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Tidak ada data yang diubah"
                });
            }

            values.push(productId);

            await db.query(
                `
                UPDATE products
                SET ${fields.join(", ")}
                WHERE id = ?
                `,
                values
            );

            return res.json({
                success: true,
                message:
                    "Produk berhasil diperbarui"
            });

        } catch (error) {
            if (
                error.message.includes(
                    "harus berupa"
                ) ||
                error.message.includes(
                    "terlalu panjang"
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            console.error(
                "UPDATE PRODUCT ERROR:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Gagal memperbarui produk"
            });
        }
    }
);


// ============================================================
// HAPUS PRODUK
// DELETE /api/products/:id
// ============================================================

router.delete(
    "/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const productId =
                Number(req.params.id);

            if (
                !Number.isInteger(productId) ||
                productId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "ID produk tidak valid"
                });
            }

            const [products] =
                await db.query(
                    `
                    SELECT id, stock
                    FROM products
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [productId]
                );

            if (products.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Produk tidak ditemukan"
                });
            }

            if (
                Number(
                    products[0].stock
                ) > 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Produk tidak bisa dihapus karena stok masih tersedia"
                });
            }

            const [movements] =
                await db.query(
                    `
                    SELECT id
                    FROM stock_movements
                    WHERE product_id = ?
                    LIMIT 1
                    `,
                    [productId]
                );

            if (movements.length > 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Produk tidak bisa dihapus karena sudah memiliki riwayat stok"
                });
            }

            await db.query(
                `
                DELETE FROM products
                WHERE id = ?
                `,
                [productId]
            );

            return res.json({
                success: true,
                message:
                    "Produk berhasil dihapus"
            });

        } catch (error) {
            console.error(
                "DELETE PRODUCT ERROR:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Gagal menghapus produk"
            });
        }
    }
);

module.exports = router;