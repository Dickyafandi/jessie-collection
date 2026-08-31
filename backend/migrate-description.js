require("dotenv").config();
const mysql = require("mysql2/promise");
const { DESCRIPTIONS, syncDescriptions } = require("./config/description-data");

async function migrate() {
  let db;
  try {
    console.log("\n======================================");
    console.log(" JESSIE COLLECTION");
    console.log(" GANTI KETERANGAN BARANG");
    console.log("======================================\n");
    console.log("Database :", process.env.DB_NAME);
    console.log("Host     :", process.env.DB_HOST);
    console.log("User     :", process.env.DB_USER);
    console.log("");

    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME,
    });

    console.log("✓ Berhasil terhubung ke database.\n");
    console.log("1. Memastikan kolom description...");
    const result = await syncDescriptions(db, { reset: true });

    console.log("✓ Keterangan lama dikosongkan.");
    console.log(`✓ ${result.mappingCount} kode dimasukkan ulang.`);
    console.log(`✓ ${result.updated} baris produk diperbarui.\n`);

    const [[totals]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN description IS NOT NULL AND TRIM(description) <> '' THEN 1 ELSE 0 END) AS with_description,
        SUM(CASE WHEN description IS NULL OR TRIM(description) = '' THEN 1 ELSE 0 END) AS without_description
      FROM products
    `);

    const [missing] = await db.query(`
      SELECT code, stock
      FROM products
      WHERE description IS NULL OR TRIM(description) = ''
      ORDER BY code
    `);

    console.log("2. Verifikasi:");
    console.log("--------------------------------------");
    console.log(`Total produk        : ${totals.total}`);
    console.log(`Punya keterangan    : ${totals.with_description}`);
    console.log(`Tanpa keterangan    : ${totals.without_description}`);
    console.log("--------------------------------------");

    if (missing.length) {
      console.log("\nKode yang belum punya keterangan (tidak ada di daftar sumber):");
      console.table(missing);
    }

    const [sample] = await db.query(`
      SELECT code, description, stock
      FROM products
      WHERE description IS NOT NULL AND TRIM(description) <> ''
      ORDER BY code
      LIMIT 10
    `);
    console.log("\nContoh hasil:");
    console.table(sample);

    console.log("\n======================================");
    console.log(" UPDATE BERHASIL ✓");
    console.log("======================================");
    console.log("Keterangan lama DIGANTI dengan data baru.");
    console.log("Stok dan harga modal TIDAK diubah.");
    console.log("");
  } catch (error) {
    console.error("\n======================================");
    console.error(" UPDATE GAGAL ✗");
    console.error("======================================");
    console.error(error.message);
    console.error("");
    process.exitCode = 1;
  } finally {
    if (db) await db.end();
  }
}

migrate();
