const DESCRIPTIONS = {
  "AB": "BAJU SPORTT",
  "ACP": "CELANA KATUN COWOK",
  "ASW": "RAJUT SEDANG ( MIX CARDI )",
  "ASWI": "INNER RAJUT TIPIS",
  "BAGL": "TAS",
  "BBC": "GENDONGAN BAYI",
  "BBH": "KORSET",
  "BBHR": "KORSET REGULER",
  "BH": "BRA",
  "BHR": "BRA REGULER",
  "BHT": "BRA SPORT",
  "BHTR": "TANKTOP CUP BRA",
  "BKT": "SELIMUT",
  "BTM": "KESET KAKI",
  "CAS": "KEMEJA COWOK",
  "CLS": "CELANA KULOT",
  "CLT": "RAJUT JALA TEBAL",
  "CP": "CELANA CORDURAY",
  "CWAA": "ANAK TIPIS",
  "CWGG": "DRESS ANAK-ANAK",
  "CWP": "CELANA ANAK-ANAK",
  "CWS": "CELANA PENDEK ANAK",
  "DP": "CELANA 3/4",
  "DWH": "INNER / MANSET HITAM",
  "DWP": "INNER / MANSET WARNA",
  "FC": "SPREI",
  "FS": "FLANEL COWOK",
  "FSR": "FLANEL CEWEK MIX",
  "FTS": "OUTER",
  "HTP": "KARGO PENDEK COWOK",
  "HTPL": "CELANA PENDEK CEWEK",
  "KAF": "FLANEL ANAK",
  "KAKR": "KEMEJA ANAK REGULER",
  "LBA": "BLOUSE TEBAL BKK",
  "LBC": "BLOUSE KATUN",
  "LBCJ": "BLOUSE JEANS",
  "LBCW": "BLOUSE PUTIH",
  "LBJP": "JEANS BIRU",
  "LBM": "BLOUSE MIX",
  "LBML": "BLOUSE MIX PANJANG",
  "LCDS": "JAKET JEANS CEWEK",
  "LCPL": "CELANA KATUN CEWEK",
  "LDCA": "DRESS KATUN",
  "LDH": "DRESS HITAM",
  "LDK": "DRESS KNIT",
  "LDS": "DRESS MIX",
  "LJG": "CELANA PINGGANG KARET",
  "LPP": "CELANA KANTOR CEWEK",
  "LSJ": "ROK JEANS",
  "LSK": "ROK KNITT",
  "LSKK": "RAJUTAN",
  "LSML": "ROK",
  "LTAL": "OBLONG PANJANG",
  "LTB": "KAOS OBLONG PENDEK CEWEK",
  "MAS": "CELANA PENDEK SPORT",
  "MB": "BOXER",
  "MBR": "BOXER REGULER",
  "MCWJ": "CELANA POTONG ANAK",
  "MHPF": "CELANA PENDEK COWOK",
  "MJFL": "JAS HITAM",
  "MPC": "CELANA KATUN POTONGAN",
  "MRN": "KAOS OBLONG PENDEK COWOK",
  "MSTC": "POLO SHIRT",
  "OCL": "JAKET KULIT",
  "OCLB": "JAKET KULIT B",
  "PT": "CELANA DALAM CEWEK",
  "PTR": "CELANA DALAM CEWWEK REGULER",
  "RBTL": "HANDUK",
  "RCA": "COAT KATUN",
  "SKYJ": "SKINNY JEANS ( CELANA PENSIL )",
  "SMC": "BAJU RENANG ANAK",
  "STSW": "BAJU OLAH RAGA / DRY FIT",
  "TCC": "TAPLAK MEJA",
  "TIGH": "LEGGING",
  "TR": "CREWNECK",
  "TRZ": "HOODIE COWOK",
  "TRZB": "HOODIE MIX",
  "TWJL": "TRACKTOP CEWEK",
  "TWJZ": "TRACKTOP",
  "TWP": "CELANA TRAINING",
  "TWS": "TOWEL / HANDUK KECIL",
  "WDRS": "GAUN PESTA",
  "ZJA": "JAKET TEBAL",
  "ZJC": "JAKET TEBAL ANAK-ANAK",
  "ZJL": "JAKET TIPIS",
  "MTSM": "POLO PANJANG",
  "TWZJ": "TRACKTOP"
};

async function ensureDescriptionColumn(db) {
  const [columns] = await db.query("SHOW COLUMNS FROM products LIKE 'description'");
  if (!columns.length) {
    await db.query('ALTER TABLE products ADD COLUMN description TEXT');
  }
}

async function syncDescriptions(db, { reset = true } = {}) {
  await ensureDescriptionColumn(db);
  await db.beginTransaction();
  try {
    if (reset) {
      // Ganti keterangan lama, bukan menambahkan/menyisakan data lama.
      await db.query("UPDATE products SET description = NULL");
    }

    let updated = 0;
    for (const [code, description] of Object.entries(DESCRIPTIONS)) {
      const [result] = await db.query(
        "UPDATE products SET description = ? WHERE UPPER(TRIM(code)) = ?",
        [description, code]
      );
      updated += result.affectedRows;
    }

    await db.commit();
    return { updated, mappingCount: Object.keys(DESCRIPTIONS).length };
  } catch (error) {
    await db.rollback();
    throw error;
  }
}

async function syncDescriptionsOnce(db) {
  await ensureDescriptionColumn(db);

  await db.query(`
    CREATE TABLE IF NOT EXISTS app_migrations (
      name VARCHAR(120) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await db.query(
    "SELECT name FROM app_migrations WHERE name = ? LIMIT 1",
    ["description_catalog_v1"]
  );

  if (rows.length) {
    return {
      updated: 0,
      mappingCount: Object.keys(DESCRIPTIONS).length,
      skipped: true
    };
  }

  const result = await syncDescriptions(db, { reset: true });

  await db.query(
    "INSERT INTO app_migrations (name) VALUES (?)",
    ["description_catalog_v1"]
  );

  return { ...result, skipped: false };
}

module.exports = {
  DESCRIPTIONS,
  ensureDescriptionColumn,
  syncDescriptions,
  syncDescriptionsOnce
};
