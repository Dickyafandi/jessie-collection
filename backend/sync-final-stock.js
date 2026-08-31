const pool = require("./config/database");

const HY = [
  [
    "AB",
    "BAJU SPORTT",
    9
  ],
  [
    "ACP",
    "CELANA KATUN COWOK",
    37
  ],
  [
    "ASW",
    "RAJUT SEDANG ( MIX CARDI )",
    21
  ],
  [
    "ASWI",
    "INNER RAJUT TIPIS",
    22
  ],
  [
    "BAGL",
    "TAS",
    0
  ],
  [
    "BBC",
    "GENDONGAN BAYI",
    8
  ],
  [
    "BBH",
    "KORSET",
    9
  ],
  [
    "BBHR",
    "KORSET REGULER",
    10
  ],
  [
    "BH",
    "BRA",
    11
  ],
  [
    "BHR",
    "BRA REGULER",
    10
  ],
  [
    "BHT",
    "BRA SPORT",
    1
  ],
  [
    "BHTR",
    "TANKTOP CUP BRA",
    1
  ],
  [
    "BKT",
    "SELIMUT",
    6
  ],
  [
    "BTM",
    "KESET KAKI",
    1
  ],
  [
    "CAS",
    "KEMEJA COWOK",
    16
  ],
  [
    "CLS",
    "CELANA KULOT",
    5
  ],
  [
    "CLT",
    "RAJUT JALA TEBAL",
    0
  ],
  [
    "CP",
    "CELANA CORDURAY",
    18
  ],
  [
    "CWAA",
    "ANAK TIPIS",
    4
  ],
  [
    "CWGG",
    "DRESS ANAK-ANAK",
    23
  ],
  [
    "CWP",
    "CELANA ANAK-ANAK",
    4
  ],
  [
    "CWS",
    "CELANA PENDEK ANAK",
    49
  ],
  [
    "DP",
    "CELANA 3/4",
    20
  ],
  [
    "DWH",
    "INNER / MANSET HITAM",
    1
  ],
  [
    "DWP",
    "INNER / MANSET WARNA",
    1
  ],
  [
    "FC",
    "SPREI",
    9
  ],
  [
    "FS",
    "FLANEL COWOK",
    6
  ],
  [
    "FSR",
    "FLANEL CEWEK MIX",
    15
  ],
  [
    "FTS",
    "OUTER",
    4
  ],
  [
    "HTP",
    "KARGO PENDEK COWOK",
    8
  ],
  [
    "HTPL",
    "CELANA PENDEK CEWEK",
    8
  ],
  [
    "KAF",
    "FLANEL ANAK",
    1
  ],
  [
    "KAKR",
    "KEMEJA ANAK REGULER",
    0
  ],
  [
    "LBA",
    "BLOUSE TEBAL BKK",
    8
  ],
  [
    "LBC",
    "BLOUSE KATUN",
    14
  ],
  [
    "LBCJ",
    "BLOUSE JEANS",
    0
  ],
  [
    "LBCW",
    "BLOUSE PUTIH",
    0
  ],
  [
    "LBJP",
    "JEANS BIRU",
    69
  ],
  [
    "LBM",
    "BLOUSE MIX",
    92
  ],
  [
    "LBML",
    "BLOUSE MIX PANJANG",
    5
  ],
  [
    "LCDS",
    "JAKET JEANS CEWEK",
    3
  ],
  [
    "LCPL",
    "CELANA KATUN CEWEK",
    177
  ],
  [
    "LDCA",
    "DRESS KATUN",
    51
  ],
  [
    "LDH",
    "DRESS HITAM",
    6
  ],
  [
    "LDK",
    "DRESS KNIT",
    10
  ],
  [
    "LDS",
    "DRESS MIX",
    134
  ],
  [
    "LJG",
    "CELANA PINGGANG KARET",
    30
  ],
  [
    "LPP",
    "CELANA KANTOR CEWEK",
    47
  ],
  [
    "LSJ",
    "ROK JEANS",
    2
  ],
  [
    "LSK",
    "ROK KNITT",
    8
  ],
  [
    "LSKK",
    "RAJUTAN",
    54
  ],
  [
    "LSML",
    "ROK",
    43
  ],
  [
    "LTAL",
    "OBLONG PANJANG",
    1
  ],
  [
    "LTB",
    "KAOS OBLONG PENDEK CEWEK",
    47
  ],
  [
    "MAS",
    "CELANA PENDEK SPORT",
    2
  ],
  [
    "MB",
    "BOXER",
    3
  ],
  [
    "MBR",
    "BOXER REGULER",
    8
  ],
  [
    "MCWJ",
    "CELANA POTONG ANAK",
    13
  ],
  [
    "MHPF",
    "CELANA PENDEK COWOK",
    56
  ],
  [
    "MJFL",
    "JAS HITAM",
    32
  ],
  [
    "MPC",
    "CELANA KATUN POTONGAN",
    16
  ],
  [
    "MRN",
    "KAOS OBLONG PENDEK COWOK",
    4
  ],
  [
    "MSTC",
    "POLO SHIRT",
    22
  ],
  [
    "OCL",
    "JAKET KULIT",
    1
  ],
  [
    "OCLB",
    "JAKET KULIT B",
    0
  ],
  [
    "PT",
    "CELANA DALAM CEWEK",
    1
  ],
  [
    "PTR",
    "CELANA DALAM CEWWEK REGULER",
    2
  ],
  [
    "RBTL",
    "HANDUK",
    25
  ],
  [
    "RCA",
    "COAT KATUN",
    7
  ],
  [
    "SKYJ",
    "SKINNY JEANS ( CELANA PENSIL )",
    4
  ],
  [
    "SMC",
    "BAJU RENANG ANAK",
    1
  ],
  [
    "STSW",
    "BAJU OLAH RAGA / DRY FIT",
    5
  ],
  [
    "TCC",
    "TAPLAK MEJA",
    2
  ],
  [
    "TIGH",
    "LEGGING",
    3
  ],
  [
    "TR",
    "CREWNECK",
    10
  ],
  [
    "TRZ",
    "HOODIE COWOK",
    34
  ],
  [
    "TRZB",
    "HOODIE MIX",
    28
  ],
  [
    "TWJL",
    "TRACKTOP CEWEK",
    1
  ],
  [
    "TWJZ",
    "TRACKTOP",
    0
  ],
  [
    "TWP",
    "CELANA TRAINING",
    2
  ],
  [
    "TWS",
    "TOWEL / HANDUK KECIL",
    1
  ],
  [
    "WDRS",
    "GAUN PESTA",
    2
  ],
  [
    "ZJA",
    "JAKET TEBAL",
    12
  ],
  [
    "ZJC",
    "JAKET TEBAL ANAK-ANAK",
    5
  ],
  [
    "ZJL",
    "JAKET TIPIS",
    2
  ]
];
const HONGYANG = [
  [
    "ACP",
    "CELANA KATUN COWOK",
    10
  ],
  [
    "BAGL",
    "TAS",
    2
  ],
  [
    "BBC",
    "GENDONGAN BAYI",
    5
  ],
  [
    "BH",
    "BRA",
    2
  ],
  [
    "BHR",
    "BRA REGULER",
    2
  ],
  [
    "CAS",
    "KEMEJA COWOK",
    3
  ],
  [
    "CLS",
    "CELANA KULOT",
    10
  ],
  [
    "CWAA",
    "ANAK TIPIS",
    5
  ],
  [
    "CWGG",
    "DRESS ANAK-ANAK",
    5
  ],
  [
    "CWS",
    "CELANA PENDEK ANAK",
    5
  ],
  [
    "HTP",
    "KARGO PENDEK COWOK",
    2
  ],
  [
    "HTPL",
    "CELANA PENDEK CEWEK",
    2
  ],
  [
    "LBC",
    "BLOUSE KATUN",
    5
  ],
  [
    "LBJP",
    "CELANA JEANS CEWEK",
    5
  ],
  [
    "LBM",
    "BLOUSE MIX",
    12
  ],
  [
    "LCDS",
    "JAKET JEANS",
    1
  ],
  [
    "LCPL",
    "CELANA KATUN CEWEK",
    10
  ],
  [
    "LDS",
    "DRESS MIX",
    10
  ],
  [
    "LSKK",
    "RAJUTAN",
    5
  ],
  [
    "LSML",
    "ROK",
    10
  ],
  [
    "LTB",
    "KAOS OBLONG PENDEK CEWEK",
    10
  ],
  [
    "MAS",
    "CELANA PENDEK SPORT",
    2
  ],
  [
    "MB",
    "BOXER",
    2
  ],
  [
    "MBR",
    "BOXER REGULER",
    2
  ],
  [
    "MHPF",
    "CELANA PENDEK COWOK",
    5
  ],
  [
    "MRN",
    "KAOS OBLONG PENDEK COWOK",
    2
  ],
  [
    "MSTC",
    "POLO SHIRT",
    2
  ],
  [
    "MTSM",
    "POLO PANJANG",
    2
  ],
  [
    "TR",
    "CREWNECK",
    5
  ],
  [
    "TRZ",
    "HOODIE COWOK",
    5
  ],
  [
    "TRZB",
    "HOODIE MIX",
    5
  ],
  [
    "TWP",
    "CELANA TRAINING",
    2
  ],
  [
    "TWZJ",
    "TRACKTOP",
    5
  ],
  [
    "ZJA",
    "JAKET TEBAL",
    5
  ],
  [
    "ZJL",
    "JAKET TIPIS",
    5
  ]
];

async function ensureDescriptionColumn(conn) {
  const [rows] = await conn.query(`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'description'
  `);

  if (Number(rows[0].count) === 0) {
    await conn.query(
      "ALTER TABLE products ADD COLUMN description VARCHAR(255) NULL AFTER code"
    );
    console.log("✓ Kolom description dibuat.");
  }
}

async function getBrandId(conn, brandName) {
  const [rows] = await conn.execute(
    `SELECT id, name
     FROM brands
     WHERE UPPER(TRIM(name)) = UPPER(TRIM(?))
     LIMIT 1`,
    [brandName]
  );

  if (!rows.length) {
    throw new Error(`Brand "${brandName}" tidak ditemukan di database.`);
  }

  return Number(rows[0].id);
}

async function updateBrand(conn, brandName, rows) {
  const brandId = await getBrandId(conn, brandName);

  console.log(`Brand ${brandName} -> brand_id ${brandId}`);

  for (const [code, description, targetStock] of rows) {
    const [products] = await conn.execute(
      `SELECT id
       FROM products
       WHERE brand_id = ?
         AND UPPER(TRIM(code)) = ?
       ORDER BY id ASC`,
      [brandId, code]
    );

    if (!products.length) {
      console.log(`! ${brandName} ${code}: produk tidak ditemukan`);
      continue;
    }

    // Satu kode di Excel = satu stok akhir.
    // Kalau database punya duplikat kode, stok target hanya ditempatkan
    // pada baris pertama; baris duplikat dibuat 0 agar tidak menggandakan stok.
    const firstId = products[0].id;

    await conn.execute(
      `UPDATE products
       SET stock = ?, description = ?
       WHERE id = ?`,
      [Number(targetStock), description, firstId]
    );

    if (products.length > 1) {
      const duplicateIds = products.slice(1).map(row => row.id);
      const placeholders = duplicateIds.map(() => "?").join(",");

      await conn.execute(
        `UPDATE products
         SET stock = ?, description = ?
         WHERE id IN (${placeholders})`,
        [0, description, ...duplicateIds]
      );

      console.log(
        `✓ ${brandName} ${code} -> ${targetStock} unit (${products.length} baris, duplikat dinolkan)`
      );
    } else {
      console.log(
        `✓ ${brandName} ${code} -> ${targetStock} unit`
      );
    }
  }

  return brandId;
}

async function main() {
  const conn = await pool.getConnection();

  try {
    console.log("");
    console.log("==============================================");
    console.log(" JESSIE COLLECTION");
    console.log(" GANTI STOK AKHIR + KETERANGAN 26 AGUSTUS");
    console.log("==============================================");
    console.log("");

    await conn.beginTransaction();

    await ensureDescriptionColumn(conn);

    console.log("1. Mengganti data HY JP56...");
    await updateBrand(conn, "HY JP56", HY);

    console.log("2. Mengganti data HONGYANG...");
    await updateBrand(conn, "HONGYANG", HONGYANG);

    // Hapus produk percobaan TEST001 bila tidak punya transaksi.
    const [testRows] = await conn.query(`
      SELECT p.id
      FROM products p
      JOIN brands b ON b.id = p.brand_id
      WHERE UPPER(TRIM(b.name)) = 'HONGYANG'
        AND UPPER(TRIM(p.code)) = 'TEST001'
      LIMIT 1
    `);

    if (testRows.length) {
      const testId = testRows[0].id;

      const [mov] = await conn.execute(
        "SELECT COUNT(*) AS count FROM stock_movements WHERE product_id = ?",
        [testId]
      );
      const [sales] = await conn.execute(
        "SELECT COUNT(*) AS count FROM sales WHERE product_id = ?",
        [testId]
      );

      if (Number(mov[0].count) === 0 && Number(sales[0].count) === 0) {
        await conn.execute("DELETE FROM products WHERE id = ?", [testId]);
        console.log("✓ Produk percobaan TEST001 dihapus.");
      } else {
        console.log("! TEST001 tidak dihapus karena sudah punya transaksi.");
      }
    }

    await conn.commit();

    const [totals] = await conn.query(`
      SELECT
        UPPER(TRIM(b.name)) AS brand,
        COUNT(*) AS products,
        COALESCE(SUM(p.stock), 0) AS total_stock
      FROM products p
      JOIN brands b ON b.id = p.brand_id
      GROUP BY b.id, b.name
      ORDER BY b.id
    `);

    const [grand] = await conn.query(`
      SELECT COUNT(*) AS products, COALESCE(SUM(stock), 0) AS total_stock
      FROM products
    `);

    console.log("");
    console.log("==============================================");
    console.log(" HASIL");
    console.log("==============================================");

    for (const row of totals) {
      console.log(
        `${row.brand.padEnd(12)} : ${Number(row.total_stock).toLocaleString("id-ID")} unit (${row.products} produk)`
      );
    }

    console.log("----------------------------------------------");
    console.log(
      `TOTAL        : ${Number(grand[0].total_stock).toLocaleString("id-ID")} unit (${grand[0].products} produk)`
    );
    console.log("");

    if (
      Number(grand[0].total_stock) === 1613 &&
      totals.some(
        x => x.brand === "HONGYANG" && Number(x.total_stock) === 170
      ) &&
      totals.some(
        x => x.brand === "HY JP56" && Number(x.total_stock) === 1443
      )
    ) {
      console.log("✓ DATA SESUAI EXCEL: HY JP56 1443 + HONGYANG 170 = 1613");
    } else {
      console.log("! Total belum sesuai target. Cek hasil di atas.");
    }

    console.log("✓ Keterangan barang ikut diperbarui.");
    console.log("✓ Stok akhir ikut diperbarui.");
    console.log("✓ Data lama untuk produk yang sama DIGANTI, bukan ditambah.");
    console.log("");
  } catch (error) {
    await conn.rollback();
    console.error("");
    console.error("MIGRASI GAGAL:", error.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

main();
