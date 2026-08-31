function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [summaryData, movementData] = await Promise.all([
        api("/api/stock/summary"),
        api("/api/stock/movements"),
      ]);

      setSummary(summaryData.data);
      setMovements(movementData.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =========================================================
     BULAN & TAHUN BERJALAN
  ========================================================= */

  const currentDate = new Date();

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const currentMonthName = currentDate.toLocaleDateString("id-ID", {
    month: "long",
  });

  const currentMonthLabel = currentDate.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  /* =========================================================
     PENJUALAN BULAN INI
     Mengikuti bulan & tahun sekarang dari BACKEND
  ========================================================= */

  const monthlyRevenue = Number(
    summary?.sales_revenue_this_month || 0
  );

  const monthlySold = Number(
    summary?.items_sold_this_month || 0
  );

  const monthlyTransactions = Number(
    summary?.transactions_this_month || 0
  );

  /* =========================================================
     DATA MOVEMENT BULAN INI
     Dipakai untuk kode paling banyak terjual
  ========================================================= */

  const currentMonthMovements = useMemo(() => {
    return movements.filter((item) => {
      if (item.type !== "OUT") {
        return false;
      }

      const date = new Date(
        item.movement_date || item.created_at
      );

      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    });
  }, [
    movements,
    currentMonth,
    currentYear,
  ]);

  /* =========================================================
     KODE PALING BANYAK TERJUAL BULAN INI
  ========================================================= */

  const bestSellingCodes = useMemo(() => {
    const grouped = {};

    currentMonthMovements.forEach((item) => {
      const code = item.code || "-";

      if (!grouped[code]) {
        grouped[code] = {
          code,
          brand: item.brand || "-",
          quantity: 0,
          revenue: 0,
        };
      }

      grouped[code].quantity += Number(
        item.quantity || 0
      );

      grouped[code].revenue += Number(
        item.total_sale || 0
      );
    });

    return Object.values(grouped)
      .sort((a, b) => {
        if (b.quantity !== a.quantity) {
          return b.quantity - a.quantity;
        }

        return b.revenue - a.revenue;
      })
      .slice(0, 5);
  }, [currentMonthMovements]);

  /* =========================================================
     HISTORY PENJUALAN BULANAN
  ========================================================= */

  const monthlyHistory = useMemo(() => {
    const grouped = {};

    movements
      .filter((item) => item.type === "OUT")
      .forEach((item) => {
        const date = new Date(
          item.movement_date || item.created_at
        );

        const year = date.getFullYear();
        const month = date.getMonth();

        const key = `${year}-${String(
          month + 1
        ).padStart(2, "0")}`;

        if (!grouped[key]) {
          grouped[key] = {
            key,
            year,
            month,
            quantity: 0,
            revenue: 0,
            transactions: 0,
          };
        }

        grouped[key].quantity += Number(
          item.quantity || 0
        );

        grouped[key].revenue += Number(
          item.total_sale || 0
        );

        grouped[key].transactions += 1;
      });

    return Object.values(grouped)
      .sort((a, b) => {
        if (a.year !== b.year) {
          return b.year - a.year;
        }

        return b.month - a.month;
      })
      .slice(0, 12);
  }, [movements]);

  const maxMonthlyRevenue = Math.max(
    ...monthlyHistory.map(
      (item) => item.revenue
    ),
    1
  );

  /* =========================================================
     LOADING / ERROR
  ========================================================= */

  if (loading) {
    return (
      <div className="loading">
        Memuat dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert error">
        {error}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="loading">
        Data dashboard belum tersedia.
      </div>
    );
  }

  /* =========================================================
     TAMPILAN DASHBOARD
  ========================================================= */

  return (
    <>
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="page-head">
        <div>
          <h2>Dashboard TEST 123</h2>
          <div style={{
          marginTop: "10px",
          padding: "12px 16px",
          background: "#f3f4f6",
          borderRadius: "10px",
          fontWeight: "600"
          }}>
          Bulan berjalan: {new Date().toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric"
          })}
          </div>
          <p className="muted">
            Ringkasan persediaan dan penjualan Jessie Collection.
          </p>
        </div>

        <button
          className="secondary"
          onClick={loadDashboard}
        >
          Refresh
        </button>
      </div>

      {/* =====================================================
          RINGKASAN PERSEDIAAN
      ====================================================== */}

      <h3 className="section-title">
        Ringkasan Persediaan
      </h3>

      <div className="stats-grid">
        <StatCard
          label="Total Produk"
          value={formatNumber(
            summary.total_products
          )}
          hint="SKU aktif"
        />

        <StatCard
          label="Total Stok"
          value={formatNumber(
            summary.total_stock
          )}
          hint="Unit tersedia"
        />

        <StatCard
          label="Stok Menipis"
          value={formatNumber(
            summary.low_stock_products
          )}
          hint="Perlu diperhatikan"
        />

        <StatCard
          label="Stok Habis"
          value={formatNumber(
            summary.out_of_stock_products
          )}
          hint="Perlu restock"
        />

        <StatCard
          label="Total Stok Masuk"
          value={formatNumber(
            summary.total_stock_in
          )}
          hint="Semua transaksi masuk"
        />

        <StatCard
          label="Total Stok Terjual"
          value={formatNumber(
            summary.total_stock_out
          )}
          hint="Semua transaksi terjual"
        />
      </div>

      {/* =====================================================
          PENJUALAN BULAN BERJALAN
      ====================================================== */}

      <div className="section-head">
        <div>
          <h3 className="section-title">
            Penjualan {currentMonthLabel}
          </h3>

          <p className="muted">
            Data otomatis mengikuti bulan dan tahun yang sedang berjalan.
          </p>
        </div>
      </div>

      <div className="stats-grid sales-stats">
        <StatCard
          label="Pendapatan Bulan Ini"
          value={formatRupiah(
            monthlyRevenue
          )}
          hint={currentMonthLabel}
        />

        <StatCard
          label="Barang Terjual"
          value={formatNumber(
            monthlySold
          )}
          hint={`Total unit ${currentMonthLabel}`}
        />

        <StatCard
          label="Transaksi Penjualan"
          value={formatNumber(
            monthlyTransactions
          )}
          hint={`Transaksi ${currentMonthLabel}`}
        />
      </div>

      {/* =====================================================
          GRAFIK PENDAPATAN
      ====================================================== */}

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>
                Grafik Pendapatan Bulanan
              </h3>

              <p className="muted">
                Riwayat pendapatan berdasarkan bulan.
              </p>
            </div>
          </div>

          {!monthlyHistory.length ? (
            <div className="empty">
              Belum ada data penjualan.
            </div>
          ) : (
            <div className="chart">
              {monthlyHistory
                .slice()
                .reverse()
                .map((item) => {
                  const height =
                    Math.max(
                      (item.revenue /
                        maxMonthlyRevenue) *
                        100,
                      item.revenue > 0
                        ? 8
                        : 2
                    );

                  const monthLabel =
                    new Date(
                      item.year,
                      item.month,
                      1
                    ).toLocaleDateString(
                      "id-ID",
                      {
                        month: "long",
                      }
                    );

                  return (
                    <div
                      className="chart-column"
                      key={item.key}
                    >
                      <div className="chart-value">
                        {formatRupiah(
                          item.revenue
                        )}
                      </div>

                      <div className="chart-track">
                        <div
                          className="chart-bar"
                          style={{
                            height: `${height}%`,
                          }}
                          title={`${monthLabel} ${item.year}: ${formatRupiah(
                            item.revenue
                          )}`}
                        />
                      </div>

                      <small>
                        {monthLabel.slice(0, 3)}
                        <br />
                        {item.year}
                      </small>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* ===================================================
            KODE PALING BANYAK TERJUAL
        ==================================================== */}

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>
                Kode Paling Banyak Terjual
              </h3>

              <p className="muted">
                {currentMonthLabel}
              </p>
            </div>
          </div>

          {!bestSellingCodes.length ? (
            <div className="empty">
              Belum ada penjualan bulan ini.
            </div>
          ) : (
            <div className="ranking-list">
              {bestSellingCodes.map(
                (item, index) => (
                  <div
                    className="ranking-item"
                    key={item.code}
                  >
                    <div className="ranking-number">
                      {index + 1}
                    </div>

                    <div className="ranking-info">
                      <strong>
                        {item.code}
                      </strong>

                      <small>
                        {item.brand}
                      </small>
                    </div>

                    <div className="ranking-value">
                      <strong>
                        {formatNumber(
                          item.quantity
                        )}
                      </strong>

                      <small>
                        terjual
                      </small>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          HISTORY PENJUALAN BULANAN
      ====================================================== */}

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>
              History Penjualan Bulanan
            </h3>

            <p className="muted">
              Riwayat penjualan berdasarkan bulan dan tahun.
            </p>
          </div>
        </div>

        {!monthlyHistory.length ? (
          <div className="empty">
            Belum ada history penjualan.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Bulan</th>
                  <th>Tahun</th>
                  <th>Barang Terjual</th>
                  <th>Transaksi</th>
                  <th>Pendapatan</th>
                </tr>
              </thead>

              <tbody>
                {monthlyHistory.map(
                  (item) => {
                    const monthLabel =
                      new Date(
                        item.year,
                        item.month,
                        1
                      ).toLocaleDateString(
                        "id-ID",
                        {
                          month: "long",
                        }
                      );

                    return (
                      <tr
                        key={item.key}
                      >
                        <td>
                          <b>
                            {monthLabel}
                          </b>
                        </td>

                        <td>
                          {item.year}
                        </td>

                        <td>
                          {formatNumber(
                            item.quantity
                          )}{" "}
                          barang
                        </td>

                        <td>
                          {formatNumber(
                            item.transactions
                          )}
                        </td>

                        <td>
                          <b>
                            {formatRupiah(
                              item.revenue
                            )}
                          </b>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}