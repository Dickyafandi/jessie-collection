const express = require("express");
const pool = require("../config/database");

const router = express.Router();

// Public catalog: hanya barang yang masih punya stok.
// Tidak mengirim harga modal, harga jual, atau data transaksi.
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id,
        p.brand_id,
        b.name AS brand,
        p.code,
        p.description,
        p.stock
      FROM products p
      JOIN brands b ON b.id = p.brand_id
      WHERE p.stock > 0
      ORDER BY b.name ASC, p.code ASC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("PUBLIC CATALOG ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Gagal memuat katalog."
    });
  }
});

module.exports = router;