import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import * as XLSX from "xlsx";
import "./styles.css";

const API =
  import.meta.env.VITE_API_URL ||
  "/api";

async function api(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(API + path, {
    ...options,
    headers
  });

  const data = await res
    .json()
    .catch(() => ({
      success: false,
      message: "Respons server tidak valid"
    }));

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Request gagal");
  }

  return data;
}

async function publicApi(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });

  const data = await res
    .json()
    .catch(() => ({
      success: false,
      message: "Respons server tidak valid"
    }));

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Request gagal");
  }

  return data;
}

function money(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function parseSalePrice(notes = "") {
  const match = String(notes).match(/Harga jual:\s*Rp\s*([\d.,]+)/i);

  if (!match) return 0;

  return (
    Number(
      match[1]
        .replace(/\./g, "")
        .replace(/,/g, "")
    ) || 0
  );
}

function getSalePrice(row) {
  /*
   * PRIORITAS:
   * 1. sale_price dari database
   * 2. harga dari notes untuk kompatibilitas transaksi lama
   */
  const databasePrice = Number(row?.sale_price || 0);

  if (databasePrice > 0) {
    return databasePrice;
  }

  return parseSalePrice(row?.notes || "");
}

function getSaleTotal(row) {
  /*
   * PRIORITAS:
   * 1. total_sale dari database
   * 2. hitung quantity x sale_price
   */
  const databaseTotal = Number(row?.total_sale || 0);

  if (databaseTotal > 0) {
    return databaseTotal;
  }

  const price = getSalePrice(row);
  const quantity = Number(row?.quantity || 0);

  return price * quantity;
}

function formatDate(value) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function ClearableInput({
  value,
  onChange,
  showPasswordToggle = false,
  ...props
}) {
  const [passwordVisible, setPasswordVisible] =
    useState(false);

  const inputType =
    showPasswordToggle
      ? (passwordVisible ? "text" : "password")
      : props.type;

  return (
    <div
      className="input-clear-wrap"
      style={
        showPasswordToggle
          ? { position: "relative" }
          : undefined
      }
    >
      <input
        value={value}
        onChange={onChange}
        {...props}
        type={inputType}
        style={
          showPasswordToggle
            ? { paddingRight: "76px" }
            : undefined
        }
      />

      {showPasswordToggle && (
        <button
          type="button"
          onClick={() =>
            setPasswordVisible(v => !v)
          }
          aria-label={
            passwordVisible
              ? "Sembunyikan password"
              : "Lihat password"
          }
          style={{
            position: "absolute",
            right: value !== "" ? "34px" : "8px",
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: "4px 6px",
            fontSize: "13px"
          }}
        >
          {passwordVisible ? "Sembunyikan" : "Lihat"}
        </button>
      )}

      {value !== "" && (
        <button
          type="button"
          className="clear-input"
          onClick={() =>
            onChange({
              target: {
                value: ""
              }
            })
          }
          aria-label="Kosongkan"
        >
          ×
        </button>
      )}
    </div>
  );
}

function ClearableTextarea({
  value,
  onChange,
  ...props
}) {
  return (
    <div className="input-clear-wrap textarea-wrap">
      <textarea
        value={value}
        onChange={onChange}
        {...props}
      />

      {value !== "" && (
        <button
          type="button"
          className="clear-input"
          onClick={() =>
            onChange({
              target: {
                value: ""
              }
            })
          }
          aria-label="Kosongkan"
        >
          ×
        </button>
      )}
    </div>
  );
}


/* ============================================================
  LOGIN
============================================================ */

function Login({ onLogin, onGuest }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <GlobalAppStyles />
      <div className="login-page">
      <div className="login-card">
        <div className="brand-mark">JC</div>

        <h1>Jessie Collection</h1>

        <p>
          Jual Pakaian Ball Import.
        </p>

        <form onSubmit={submit}>
          <label>
            Username

            <ClearableInput
              value={username}
              onChange={e =>
                setUsername(e.target.value)
              }
            />
          </label>

          <label>
            Password

            <ClearableInput
              type="password"
              value={password}
              onChange={e =>
                setPassword(e.target.value)
              }
              showPasswordToggle
            />
          </label>

          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          <button
            className="primary wide"
            disabled={loading}
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>

          <button
            type="button"
            className="guest-catalog-button"
            onClick={() => onGuest()}
          >
            👀 Lihat Katalog
          </button>


                </form>
      </div>
      </div>
    </>
  );
}

/* ============================================================
   GUEST CATALOG
============================================================ */

function GuestCatalog({ onBack }) {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API}/catalog`
      );

      const data = await res
        .json()
        .catch(() => ({
          success: false,
          message: "Respons server tidak valid"
        }));

      if (!res.ok || data.success === false) {
        throw new Error(
          data.message || "Gagal memuat katalog"
        );
      }

      setProducts(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();

    if (!keyword) {
      return products;
    }

    return products.filter(product =>
      [
        product.brand,
        product.code,
        product.description
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [products, q]);

  return (
    <div className="guest-catalog-page">
      <header className="guest-catalog-header">
        <div className="guest-brand">
          <div className="brand-mark">
            JC
          </div>

          <div>
            <b>Jessie Collection</b>
            <span>Ready Stock Catalog</span>
          </div>
        </div>

        <button
          type="button"
          className="guest-back-button"
          onClick={onBack}
        >
          ← Kembali Login
        </button>
      </header>

      <section className="guest-catalog-hero">
        <span className="eyebrow">
          JESSIE COLLECTION
        </span>

        <h1>
          Koleksi Ready Stock
        </h1>

        <p>
          Lihat kode barang, keterangan,
          dan stok yang tersedia.
        </p>

        <div className="guest-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Cari kode, brand, atau keterangan..."
            value={q}
            onChange={e =>
              setQ(e.target.value)
            }
          />

          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Bersihkan pencarian"
            >
              ×
            </button>
          )}
        </div>
      </section>

      <main className="guest-catalog-content">
        {loading && (
          <div className="guest-state">
            Memuat katalog...
          </div>
        )}

        {error && !loading && (
          <div className="guest-state guest-error">
            <strong>
              Katalog tidak dapat dimuat.
            </strong>

            <span>{error}</span>

            <button
              type="button"
              className="primary"
              onClick={load}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          !filtered.length && (
            <div className="guest-state">
              {q
                ? "Barang yang dicari tidak ditemukan."
                : "Belum ada barang ready stock."}
            </div>
          )}

        {!loading &&
          !error &&
          filtered.length > 0 && (
            <div className="guest-product-grid">
              {filtered.map(product => (
                <article
                  className="guest-product-card"
                  key={product.id}
                >
                  <div className="guest-product-top">
                    <span className="guest-product-brand">
                      {product.brand}
                    </span>

                    <span className="guest-stock-badge">
                      {Number(product.stock).toLocaleString(
                        "id-ID"
                      )}{" "}
                      unit
                    </span>
                  </div>

                  <h2>
                    {product.code}
                  </h2>

                  <p>
                    {product.description ||
                      "Belum ada keterangan."}
                  </p>

                  <a
                    className="guest-wa-button"
                    href={`https://wa.me/6281319467739?text=${encodeURIComponent(
                      `Halo Jessie Collection, saya mau tanya stok ${product.code} (${product.brand}).`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="guest-wa-icon">
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          fill="currentColor"
                          d="M20.52 3.48A11.82 11.82 0 0 0 12.08.05 11.84 11.84 0 0 0 1.79 17.68L.06 24l6.48-1.7a11.84 11.84 0 0 0 17.41-10.38 11.84 11.84 0 0 0-3.43-8.44Zm-8.44 18.25a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.84 1.01 1.03-3.74-.24-.39a9.89 9.89 0 1 1 8.44 4.71Zm5.42-7.41c-.3-.15-1.75-.87-2.02-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.11 3.22 5.12 4.52.72.31 1.28.49 1.72.63.72.23 1.37.2 1.89.12.58-.09 1.75-.72 2-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"
                        />
                      </svg>
                    </span>

                    Tanya via WhatsApp
                  </a>
                </article>
              ))}
            </div>
          )}
      </main>
    </div>
  );
}


/* ============================================================
   NAVIGATION
============================================================ */

function GlobalAppStyles() {
  return (
    <style>{`
      :root {
        --jc-bg: #f7f0ec;
        --jc-surface: #fffaf7;
        --jc-surface-2: #f1e2e0;
        --jc-primary: #742d3d;
        --jc-primary-soft: #b96d7b;
        --jc-text: #2a2428;
        --jc-muted: #7d6f75;
        --jc-border: #e8d9d5;
      }

      body {
        background:
          radial-gradient(circle at 12% 8%, #f1dce1 0, transparent 28%),
          radial-gradient(circle at 92% 4%, #eadfce 0, transparent 26%),
          var(--jc-bg);
      }

      .app,
      .guest-main-only {
        background:
          radial-gradient(circle at 12% 8%, #f1dce1 0, transparent 28%),
          radial-gradient(circle at 92% 4%, #eadfce 0, transparent 26%),
          var(--jc-bg);
      }

      .app-sidebar {
        position: relative;
        z-index: 40;
        transition: transform .22s ease;
      }

      .sidebar-collapsed .app-sidebar {
        display: none;
      }

      .sidebar-collapsed main {
        width: 100%;
        max-width: none;
        margin-left: 0;
        padding-left: 0;
      }

      .sidebar-collapsed .content {
        width: 100%;
        max-width: none;
      }

      .sidebar-collapsed .dashboard-shell {
        width: 100%;
        max-width: none;
      }
      .sidebar-reopen-button,
      .mobile-menu-button {
        position: fixed;
        z-index: 70;
        width: 42px;
        height: 42px;
        border: 1px solid var(--jc-border);
        border-radius: 12px;
        background: var(--jc-surface);
        color: var(--jc-primary);
        box-shadow: 0 10px 28px rgba(86,42,51,.14);
        font-size: 18px;
        cursor: pointer;
      }

      .sidebar-reopen-button {
        left: 14px;
        top: 18px;
        display: grid;
        place-items: center;
      }

      .mobile-menu-button {
        left: 14px;
        top: 18px;
        display: none;
      }

      .sidebar-hide-button {
        margin-left: auto;
        width: 30px;
        height: 30px;
        border: 0;
        border-radius: 9px;
        background: rgba(255,255,255,.09);
        color: inherit;
        cursor: pointer;
        font-size: 20px;
      }

      .sidebar-backdrop {
        display: none;
      }

      .user-section-label {
        margin: 2px 12px 7px;
        color: #a38f96;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .12em;
        text-transform: uppercase;
      }

      .whatsapp-logo {
        width: 20px;
        height: 20px;
        display: inline-grid;
        place-items: center;
        flex: 0 0 auto;
      }

      .whatsapp-logo svg {
        width: 100%;
        height: 100%;
        fill: currentColor;
      }

      .social-link {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 11px 12px;
        margin-bottom: 10px;
        border-radius: 10px;
        text-decoration: none;
        color: inherit;
        background: rgba(255,255,255,.07);
        transition: .15s ease;
      }

      .social-link:hover {
        background: rgba(255,255,255,.14);
        transform: translateY(-1px);
      }

      .guest-catalog-button {
        width: 100%;
        margin-top: 10px;
        padding: 11px 14px;
        border: 1px solid var(--jc-border);
        border-radius: 12px;
        background: var(--jc-surface);
        color: var(--jc-primary);
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }

      .guest-catalog-button:hover {
        background: var(--jc-surface-2);
      }

      .guest-main-only {
        min-height: 100vh;
      }

      /* Modern login */
      .login-page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 30px 18px;
        background:
          radial-gradient(circle at 14% 10%, #f3dce3 0, transparent 31%),
          radial-gradient(circle at 88% 8%, #eee2cf 0, transparent 28%),
          linear-gradient(135deg, #f7f0ec 0%, #fffaf7 52%, #f3e5e2 100%);
      }

      .login-card {
        width: min(620px, calc(100% - 36px));
        box-sizing: border-box;
        padding: 52px;
        border: 1px solid #eadbd8;
        border-radius: 24px;
        background: rgba(255, 250, 247, .95);
        box-shadow: 0 28px 75px rgba(85, 43, 52, .12);
        backdrop-filter: blur(12px);
      }

      .login-card .brand-mark {
        width: 54px;
        height: 54px;
        margin-bottom: 18px;
        background: #742d3d;
        color: #fff;
        box-shadow: 0 12px 28px rgba(116, 45, 61, .22);
      }

      .login-card h1 {
        margin: 0 0 10px;
        color: #2a2428;
        font-size: clamp(34px, 4.5vw, 46px);
        letter-spacing: -.035em;
      }

      .login-card > p {
        margin: 0 0 30px;
        color: #7d6f75;
        font-size: 18px;
        line-height: 1.55;
      }

      .login-card form {
        display: grid;
        gap: 20px;
      }

      .login-card label {
        display: grid;
        gap: 8px;
        color: #4f3d43;
        font-size: 15px;
        font-weight: 800;
      }

      .login-card input {
        width: 100%;
        min-height: 62px;
        padding: 0 16px;
        font-size: 16px;
        box-sizing: border-box;
        border: 1px solid #decacc;
        border-radius: 13px;
        background: #fffdfb;
        color: #2a2428;
        outline: none;
      }

      .login-card input:focus {
        border-color: #b96d7b;
        box-shadow: 0 0 0 4px rgba(185, 109, 123, .12);
      }

      .login-card .primary.wide {
        min-height: 62px;
        font-size: 16px;
        border-radius: 14px;
        background: #742d3d;
        border-color: #742d3d;
        box-shadow: 0 12px 26px rgba(116, 45, 61, .18);
      }

      .login-card .primary.wide:hover {
        background: #843649;
      }

      .login-card .guest-catalog-button {
        width: 100%;
        min-height: 62px;
        font-size: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        margin-top: 2px;
        padding: 0 16px;
        border: 1px solid #d9c0c4;
        border-radius: 13px;
        background: #fffaf7;
        color: #742d3d;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
        transition: .16s ease;
      }

      .login-card .guest-catalog-button:hover {
        transform: translateY(-1px);
        border-color: #b96d7b;
        background: #f6e9e9;
      }

      .login-card .alert.error {
        margin: 0;
        border-radius: 11px;
      }

      .dark-mode .login-page {
        background:
          radial-gradient(circle at 14% 10%, #39252e 0, transparent 31%),
          radial-gradient(circle at 88% 8%, #302a22 0, transparent 28%),
          #171419;
      }

      .dark-mode .login-card {
        background: rgba(33, 29, 36, .97);
        border-color: #3b313a;
      }

      .dark-mode .login-card h1,
      .dark-mode .login-card label {
        color: #f7edf0;
      }

      .dark-mode .login-card .guest-catalog-button {
        background: #8c3b4c;
        border-color: #a95a6d;
        color: #fff;
        box-shadow: 0 10px 24px rgba(140, 59, 76, .22);
      }

      .dark-mode .login-card .guest-catalog-button:hover {
        background: #9c4658;
        color: #fff;
      }

      .dark-mode .login-card .input-clear-wrap button:not(.clear-input) {
        color: #f7edf0 !important;
      }

      .dark-mode .login-card .clear-input {
        color: #6b6570 !important;
      }

      .dark-mode .login-card > p {
        color: #c4b7bf;
      }

      .dark-mode .login-card input {
        background: #211d24;
        border-color: #4a3b45;
        color: #f7edf0;
      }

      .dark-mode .login-card .guest-catalog-button {
        background: #211d24;
        border-color: #4a3b45;
        color: #f3dbe1;
      }

      @media (max-width: 768px) {
        .login-page {
          padding: 24px 16px;
        }

        .login-card {
          width: min(600px, 100%);
          padding: 40px 30px;
          border-radius: 22px;
        }

        .login-card h1 {
          font-size: clamp(32px, 8vw, 42px);
        }

        .login-card > p {
          font-size: 16px;
        }

        .login-card input {
          min-height: 58px;
        }
      }

      @media (max-width: 480px) {
        .login-page {
          place-items: start center;
          min-height: 100svh;
          padding: 18px 12px;
        }

        .login-card {
          width: 100%;
          padding: 32px 22px 28px;
          border-radius: 20px;
        }

        .login-card .brand-mark {
          width: 50px;
          height: 50px;
          margin-bottom: 14px;
        }

        .login-card > p {
          margin-bottom: 22px;
        }

        .login-card form {
          gap: 14px;
        }

        .login-card input,
        .login-card .primary.wide,
        .login-card .guest-catalog-button {
          min-height: 56px;
          font-size: 15px;
        }
      }


      /* =========================================================
         MOBILE PRODUCTS
         Tabel desktop -> kartu produk pada HP.
         Tidak mengubah JSX / struktur Page.
      ========================================================= */

      @media (max-width: 760px) {
        /* Products: toolbar langsung diikuti table-wrap */
        .toolbar + .table-wrap {
          display: block;
          overflow: visible;
          border: 0;
          background: transparent;
          box-shadow: none;
        }

        .toolbar + .table-wrap > table {
          min-width: 0;
          width: 100%;
          display: block;
          border-collapse: separate;
        }

        .toolbar + .table-wrap > table thead {
          display: none;
        }

        .toolbar + .table-wrap > table tbody {
          display: grid;
          gap: 12px;
        }

        .toolbar + .table-wrap > table tr {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0 14px;
          padding: 16px;
          border: 1px solid var(--jc-border);
          border-radius: 15px;
          background: var(--jc-surface);
          box-shadow: 0 8px 22px rgba(100,65,70,.06);
        }

        .toolbar + .table-wrap > table td {
          display: block;
          min-width: 0;
          padding: 0;
          border: 0;
          font-size: 13px;
          white-space: normal;
        }

        .toolbar + .table-wrap > table td:nth-child(1) {
          grid-column: 1;
          grid-row: 1;
        }

        .toolbar + .table-wrap > table td:nth-child(1) b {
          display: block;
          color: var(--jc-primary-soft);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .toolbar + .table-wrap > table td:nth-child(2) {
          grid-column: 1;
          grid-row: 2;
          margin-top: 4px;
        }

        .toolbar + .table-wrap > table td:nth-child(2) b {
          display: block;
          color: var(--jc-primary);
          font-size: 22px;
          line-height: 1.1;
        }

        .toolbar + .table-wrap > table td:nth-child(3) {
          grid-column: 1 / -1;
          grid-row: 3;
          margin-top: 13px;
          padding-top: 12px;
          border-top: 1px solid var(--jc-border);
        }

        .toolbar + .table-wrap > table td:nth-child(3)::before {
          content: "KETERANGAN";
          display: block;
          margin-bottom: 5px;
          color: var(--jc-muted);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .05em;
        }

        .toolbar + .table-wrap > table td:nth-child(4) {
          grid-column: 2;
          grid-row: 1 / span 2;
          align-self: start;
          justify-self: end;
          padding: 6px 9px;
          border-radius: 999px;
          background: var(--jc-surface-2);
          color: var(--jc-primary);
          font-size: 11px;
          font-weight: 900;
          white-space: nowrap;
        }

        .toolbar + .table-wrap > table td:nth-child(5),
        .toolbar + .table-wrap > table td:nth-child(6) {
          grid-row: 4;
          margin-top: 13px;
          padding-top: 12px;
          border-top: 1px solid var(--jc-border);
        }

        .toolbar + .table-wrap > table td:nth-child(5) {
          grid-column: 1;
        }

        .toolbar + .table-wrap > table td:nth-child(6) {
          grid-column: 2;
          justify-self: end;
        }

        .toolbar + .table-wrap > table td:nth-child(5)::before {
          content: "HARGA MODAL";
          display: block;
          margin-bottom: 4px;
          color: var(--jc-muted);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .05em;
        }

        .toolbar + .table-wrap > table td:nth-child(6)::before {
          content: "STATUS";
          display: block;
          margin-bottom: 4px;
          color: var(--jc-muted);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .05em;
        }

        .toolbar + .table-wrap > table td:nth-child(3),
        .toolbar + .table-wrap > table td:nth-child(5) {
          overflow-wrap: anywhere;
        }

        .toolbar + .table-wrap > .empty {
          margin-top: 10px;
          padding: 30px 16px;
          border: 1px dashed var(--jc-border);
          border-radius: 15px;
          background: var(--jc-surface);
        }
      }

      @media (max-width: 480px) {
        .toolbar + .table-wrap > table tr {
          padding: 14px;
        }

        .toolbar + .table-wrap > table td:nth-child(2) b {
          font-size: 20px;
        }

        .toolbar + .table-wrap > table td:nth-child(4) {
          font-size: 10px;
        }
      }

      .dark-mode .toolbar + .table-wrap > table tr {
        background: #211d24;
        border-color: #3b313a;
      }

      .dark-mode .toolbar + .table-wrap > table td:nth-child(2) b {
        color: #e8b7c1;
      }

      .dark-mode .toolbar + .table-wrap > table td:nth-child(4) {
        background: #302630;
        color: #e8b7c1;
      }

      .guest-catalog-page {
        max-width: 1220px;
        margin: 0 auto;
        padding: 42px 28px 64px;
      }

      .guest-catalog-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 28px;
      }

      .guest-catalog-top h1 {
        margin: 6px 0 8px;
        font-size: clamp(30px, 5vw, 48px);
        color: var(--jc-primary);
      }

      .guest-catalog-top p {
        margin: 0;
        color: var(--jc-muted);
      }

      .guest-catalog-search {
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 780px;
        padding: 4px 14px;
        margin-bottom: 28px;
        border: 1px solid var(--jc-border);
        border-radius: 14px;
        background: rgba(255,250,247,.92);
        box-shadow: 0 12px 36px rgba(100,65,70,.08);
      }

      .guest-catalog-search > span {
        font-size: 20px;
        color: var(--jc-primary-soft);
      }

      .guest-product-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
      }

      .guest-product-card {
        display: flex;
        flex-direction: column;
        min-height: 220px;
        padding: 20px;
        border: 1px solid var(--jc-border);
        border-radius: 18px;
        background: rgba(255,250,247,.97);
        box-shadow: 0 14px 36px rgba(100,65,70,.08);
      }

      .guest-product-brand {
        color: var(--jc-primary-soft);
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .guest-product-card > strong {
        margin-top: 8px;
        font-size: 25px;
        color: var(--jc-primary);
      }

      .guest-product-card > p {
        flex: 1;
        margin: 10px 0 20px;
        color: #5f545a;
        line-height: 1.5;
      }

      .guest-product-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .guest-product-bottom > span {
        font-weight: 800;
        color: var(--jc-text);
      }

      .guest-whatsapp-button {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 38px;
        padding: 0 13px;
        border-radius: 11px;
        background: #8c3b4c;
        color: #fff;
        text-decoration: none;
        font-weight: 800;
      }

      .guest-whatsapp-button .whatsapp-logo {
        width: 18px;
        height: 18px;
      }

      .guest-empty {
        grid-column: 1 / -1;
        padding: 50px 20px;
        border: 1px dashed var(--jc-border);
        border-radius: 18px;
        background: rgba(255,250,247,.75);
        text-align: center;
        color: var(--jc-muted);
      }

      .dark-mode body {
        background: #171419;
      }

      .dark-mode .app,
      .dark-mode .guest-main-only {
        background:
          radial-gradient(circle at 12% 8%, #39282f 0, transparent 28%),
          radial-gradient(circle at 92% 4%, #302a23 0, transparent 26%),
          #171419;
        color: #f7edf0;
      }

      .dark-mode .panel,
      .dark-mode .stat,
      .dark-mode .table-wrap,
      .dark-mode .form-card,
      .dark-mode .guest-product-card,
      .dark-mode .guest-catalog-search,
      .dark-mode .guest-empty {
        background: #211d24;
        border-color: #3b313a;
        color: #f7edf0;
      }

      .dark-mode .guest-product-card > p,
      .dark-mode .guest-catalog-top p {
        color: #c8bcc2;
      }

      .dark-mode .guest-catalog-top h1,
      .dark-mode .guest-product-card > strong {
        color: #e8b7c1;
      }

      .dark-mode .sidebar-reopen-button,
      .dark-mode .mobile-menu-button,
      .dark-mode .guest-catalog-button {
        background: #211d24;
        border-color: #3b313a;
        color: #f3dbe1;
      }

      @media (max-width: 980px) {
        .mobile-menu-button {
          display: grid;
          place-items: center;
        }

        .sidebar-reopen-button {
          display: none;
        }

        .app-sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          width: min(300px, 86vw);
          transform: translateX(0);
          box-shadow: 18px 0 44px rgba(20,20,24,.18);
        }

        .sidebar-collapsed .app-sidebar {
          display: block;
          transform: translateX(-110%);
        }

        .sidebar-open .sidebar-backdrop {
          display: block;
          position: fixed;
          inset: 0;
          z-index: 30;
          border: 0;
          background: rgba(12,10,14,.36);
        }

        .sidebar-open .mobile-menu-button {
          display: none;
        }

        .sidebar-hide-button {
          display: inline-grid;
          place-items: center;
        }

        .guest-product-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 680px) {
        .guest-catalog-page {
          padding: 28px 16px 48px;
        }

        .guest-catalog-top {
          flex-direction: column;
        }

        .guest-product-grid {
          grid-template-columns: 1fr;
        }

        .guest-product-card {
          min-height: 200px;
        }

        .guest-product-bottom {
          align-items: stretch;
          flex-direction: column;
        }

        .guest-whatsapp-button {
          justify-content: center;
        }
      }
    `}</style>
  );
}

const navItems = [
  ["dashboard", "Dashboard", "⌂"],
  ["products", "Produk", "▦"],
  ["add-product", "Tambah Produk", "+"],
  ["in", "Stok Masuk", "↓"],
  ["sold", "Stok Terjual", "↑"],
  ["history", "Riwayat Stok", "◷"]
];

const staffAllowedPages = new Set([
  "products",
  "in",
  "sold",
  "history"
]);

function Layout({
  page,
  setPage,
  user,
  onLogout,
  children
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const isGuest = user?.role === "guest";

  if (isGuest) {
    return (
      <>
        <GlobalAppStyles />
        <main className="guest-main-only">
        {children}
        </main>
      </>
    );
  }

  const visibleNavItems = isAdmin
    ? navItems
    : navItems.filter(([id]) =>
        staffAllowedPages.has(id)
      );

  function goToPage(nextPage) {
    if (
      isAdmin ||
      (isStaff && staffAllowedPages.has(nextPage))
    ) {
      setPage(nextPage);
      setSidebarOpen(false);
    }
  }

  return (
    <>
      <GlobalAppStyles />
      <div
        className={`app ${
        sidebarOpen
          ? "sidebar-open"
          : "sidebar-collapsed"
      }`}
    >
      {!sidebarOpen && (
        <button
          type="button"
          className="sidebar-reopen-button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Tampilkan menu"
          title="Tampilkan menu"
        >
          ☰
        </button>
      )}

      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Buka menu"
      >
        ☰
      </button>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Tutup menu"
        />
      )}

      <aside className="app-sidebar">
        <div className="logo">
          <div className="brand-mark small">
            JC
          </div>

          <div className="logo-copy">
            <b>Jessie</b>
            <span>Collection</span>
          </div>

          <button
            type="button"
            className="sidebar-hide-button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Sembunyikan menu"
            title="Sembunyikan menu"
          >
            ‹
          </button>
        </div>

        <nav>
          {visibleNavItems.map(
            ([id, label, icon]) => (
              <button
                key={id}
                className={
                  page === id
                    ? "active"
                    : ""
                }
                onClick={() =>
                  goToPage(id)
                }
              >
                <span className="nav-icon">
                  {icon}
                </span>

                {label}
              </button>
            )
          )}
        </nav>

        <div className="side-bottom">
          <a
            className="social-link whatsapp-link"
            href="https://wa.me/6281319467739"
            target="_blank"
            rel="noreferrer"
          >
            <span
              className="whatsapp-logo"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 2.4A9.6 9.6 0 0 0 3.7 17l-1.2 4.4 4.5-1.2A9.6 9.6 0 1 0 12 2.4Zm0 17.2c-1.4 0-2.7-.4-3.8-1.1l-.3-.2-2.7.7.7-2.6-.2-.3A7.7 7.7 0 1 1 12 19.6Zm4.2-5.6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-1.3-.7-2.2-1.2-3.1-2.7-.2-.3.2-.3.5-1 .1-.2.1-.4 0-.5 0-.1-.5-1.2-.7-1.7-.2-.4-.4-.4-.5-.4h-.4c-.1 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.4c.1.2 1.6 2.5 3.9 3.4.5.2.9.3 1.2.4.5-.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1Z" />
              </svg>
            </span>

            <span>WhatsApp</span>
          </a>

          <div className="user-section-label">
            {user.username}
          </div>

          <div className="user-chip">
            <div className="avatar">
              {user.username
                ?.[0]
                ?.toUpperCase()}
            </div>

            <div>
              <b>{user.username}</b>
              <span>Account</span>
            </div>
          </div>

          <button
            className="logout"
            onClick={onLogout}
          >
            Keluar
          </button>
        </div>
      </aside>

      <main>{children}</main>
      </div>
    </>
  );
}

/* ============================================================
   DASHBOARD
============================================================ */

function getMonthTitle(year, monthIndex) {
  const name = new Date(
    Number(year),
    Number(monthIndex),
    1
  ).toLocaleDateString("id-ID", {
    month: "long"
  });

  return (
    name.charAt(0).toUpperCase() +
    name.slice(1) +
    ` ${year}`
  );
}

function getMovementDateParts(value) {
  const raw = String(value || "").slice(0, 10);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    return {
      year: Number(match[1]),
      month: Number(match[2]) - 1
    };
  }

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return {
    year: d.getFullYear(),
    month: d.getMonth()
  };
}

function buildMonthlySales(rows) {
  const grouped = {};

  rows.forEach(row => {
    if (row.type !== "OUT") {
      return;
    }

    const parts = getMovementDateParts(
      row.movement_date || row.created_at
    );

    if (!parts) {
      return;
    }

    const year = parts.year;
    const month = parts.month;
    const code = row.code || "-";

    const key =
      `${year}-${String(month + 1).padStart(2, "0")}-${code}`;

    if (!grouped[key]) {
      grouped[key] = {
        year,
        month,
        code,
        brand: row.brand || "-",
        units: 0,
        transactions: 0,
        revenue: 0
      };
    }

    grouped[key].units += Number(
      row.quantity || 0
    );

    grouped[key].transactions += 1;
    grouped[key].revenue += getSaleTotal(row);
  });

  return Object.values(grouped).sort((a, b) => {
    if (b.year !== a.year) {
      return b.year - a.year;
    }

    if (b.month !== a.month) {
      return b.month - a.month;
    }

    return a.code.localeCompare(b.code);
  });
}

function downloadSalesExcel(
  rows,
  monthFilter = null
) {
  const filtered = monthFilter
    ? rows.filter(
        row =>
          row.year === monthFilter.year &&
          row.month === monthFilter.month
      )
    : rows;

  if (!filtered.length) {
    window.alert(
      monthFilter
        ? "Belum ada penjualan pada bulan tersebut."
        : "Belum ada data penjualan."
    );
    return;
  }

  const workbook = XLSX.utils.book_new();

  const allData = filtered.map(row => ({
    Bulan: getMonthTitle(
      row.year,
      row.month
    ),
    "Kode Barang": row.code,
    Brand: row.brand,
    "Unit Terjual": row.units,
    Transaksi: row.transactions,
    Pendapatan: row.revenue
  }));

  const allSheet =
    XLSX.utils.json_to_sheet(allData);

  allSheet["!cols"] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 }
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    allSheet,
    monthFilter ? "Rekap Bulan" : "Semua Bulan"
  );

  if (!monthFilter) {
    const monthMap = {};

    filtered.forEach(row => {
      const key =
        `${row.year}-${String(row.month + 1).padStart(2, "0")}`;

      if (!monthMap[key]) {
        monthMap[key] = [];
      }

      monthMap[key].push(row);
    });

    Object.values(monthMap)
      .sort(
        (a, b) =>
          b[0].year - a[0].year ||
          b[0].month - a[0].month
      )
      .forEach(monthRows => {
        const first = monthRows[0];

        const sheetData = monthRows.map(row => ({
          "Kode Barang": row.code,
          Brand: row.brand,
          "Unit Terjual": row.units,
          Transaksi: row.transactions,
          Pendapatan: row.revenue
        }));

        const sheet =
          XLSX.utils.json_to_sheet(sheetData);

        sheet["!cols"] = [
          { wch: 18 },
          { wch: 18 },
          { wch: 16 },
          { wch: 14 },
          { wch: 20 }
        ];

        let sheetName =
          getMonthTitle(
            first.year,
            first.month
          ).replace(/ /g, "-");

        sheetName = sheetName
          .replace(/[:\\/?*\[\]]/g, "")
          .slice(0, 31);

        XLSX.utils.book_append_sheet(
          workbook,
          sheet,
          sheetName
        );
      });
  }

  const suffix = monthFilter
    ? `${String(monthFilter.year)}-${String(
        monthFilter.month + 1
      ).padStart(2, "0")}`
    : "semua-bulan";

  XLSX.writeFile(
    workbook,
    `Rekap-Penjualan-${suffix}.xlsx`
  );
}

function Dashboard({ go, theme }) {
  const [s, setS] = useState(null);
  const [m, setM] = useState([]);
  const [products, setProducts] = useState([]);
  const [pulse, setPulse] = useState(false);

  async function load() {
    try {
      const [summary, movements, products] =
        await Promise.all([
          api("/stock/summary"),
          api("/stock/movements"),
          api("/products")
        ]);

      setS(summary.data);
      setM(movements.data);
      setProducts(products.data);
    } catch (e) {
      console.error(
        "DASHBOARD LOAD ERROR:",
        e
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  const now = new Date();

  const currentMonthTitle =
    getMonthTitle(
      now.getFullYear(),
      now.getMonth()
    );

  const monthly = useMemo(() => {
    return m
      .filter(row => {
        if (row.type !== "OUT") {
          return false;
        }

        const parts = getMovementDateParts(
          row.movement_date || row.created_at
        );

        return (
          parts &&
          parts.year === now.getFullYear() &&
          parts.month === now.getMonth()
        );
      })
      .reduce(
        (acc, row) => ({
          revenue:
            acc.revenue +
            getSaleTotal(row),

          units:
            acc.units +
            Number(row.quantity || 0),

          transactions:
            acc.transactions + 1
        }),
        {
          revenue: 0,
          units: 0,
          transactions: 0
        }
      );
  }, [m]);

  const monthlySales = useMemo(
    () => buildMonthlySales(m),
    [m]
  );

  const monthOptions = useMemo(() => {
    const map = {};

    monthlySales.forEach(row => {
      const key =
        `${row.year}-${String(row.month + 1).padStart(2, "0")}`;

      if (!map[key]) {
        map[key] = {
          year: row.year,
          month: row.month
        };
      }
    });

    return Object.values(map).sort(
      (a, b) =>
        b.year - a.year ||
        b.month - a.month
    );
  }, [monthlySales]);

  const currentMonthKey =
    `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

  const [selectedExportMonth, setSelectedExportMonth] =
    useState(currentMonthKey);

  useEffect(() => {
    if (!monthOptions.length) {
      return;
    }

    const exists = monthOptions.some(
      option =>
        `${option.year}-${String(
          option.month + 1
        ).padStart(2, "0")}` ===
        selectedExportMonth
    );

    if (!exists) {
      const first = monthOptions[0];

      setSelectedExportMonth(
        `${first.year}-${String(
          first.month + 1
        ).padStart(2, "0")}`
      );
    }
  }, [monthOptions, selectedExportMonth]);

  const selectedExportMonthParts =
    selectedExportMonth.match(
      /^(\d{4})-(\d{2})$/
    );

  const selectedExportFilter =
    selectedExportMonthParts
      ? {
          year: Number(
            selectedExportMonthParts[1]
          ),
          month:
            Number(
              selectedExportMonthParts[2]
            ) - 1
        }
      : null;

  const monthlyGroups = useMemo(() => {
    const grouped = {};

    monthlySales.forEach(row => {
      const key =
        `${row.year}-${String(row.month + 1).padStart(2, "0")}`;

      if (!grouped[key]) {
        grouped[key] = {
          year: row.year,
          month: row.month,
          rows: [],
          units: 0,
          transactions: 0,
          revenue: 0
        };
      }

      grouped[key].rows.push(row);
      grouped[key].units += row.units;
      grouped[key].transactions +=
        row.transactions;
      grouped[key].revenue += row.revenue;
    });

    return Object.values(grouped).sort(
      (a, b) =>
        b.year - a.year ||
        b.month - a.month
    );
  }, [monthlySales]);

  const brandStock = useMemo(() => {
    const grouped = {};

    products.forEach(product => {
      const brand = String(product.brand || "Lainnya").trim() || "Lainnya";
      const stock = Math.max(0, Number(product.stock || 0));

      if (!grouped[brand]) {
        grouped[brand] = 0;
      }

      grouped[brand] += stock;
    });

    return Object.entries(grouped)
      .map(([brand, stock]) => ({ brand, stock }))
      .filter(item => item.stock > 0)
      .sort((a, b) => b.stock - a.stock);
  }, [products]);

  const totalBrandStock = brandStock.reduce(
    (sum, item) => sum + item.stock,
    0
  );

  const primaryBrandStock = brandStock[0]?.stock || 0;
  const secondaryBrandStock = brandStock[1]?.stock || 0;

  const pieStops = useMemo(() => {
    if (!totalBrandStock) {
      return "conic-gradient(#e5e7eb 0 100%)";
    }

    let cursor = 0;
    const stops = brandStock.slice(0, 6).map((item, index) => {
      const next = cursor + (item.stock / totalBrandStock) * 100;
      const color = index % 2 === 0 ? "#17181b" : "#d9a441";
      const result = `${color} ${cursor}% ${next}%`;
      cursor = next;
      return result;
    });

    if (cursor < 100) {
      stops.push(`#e5e7eb ${cursor}% 100%`);
    }

    return `conic-gradient(${stops.join(", ")})`;
  }, [brandStock, totalBrandStock]);

  const stockByBrandName = name =>
    brandStock.find(
      item =>
        item.brand.trim().toUpperCase() === name.trim().toUpperCase()
    )?.stock || 0;

  const hongyangStock = stockByBrandName("HONGYANG");
  const hyStock =
    stockByBrandName("HY JP56") ||
    stockByBrandName("HY") ||
    secondaryBrandStock;

  const refresh = async () => {
    setPulse(true);

    await load();

    setTimeout(() => {
      setPulse(false);
    }, 650);
  };

  return (
    <Page
      title="Dashboard"
      subtitle="Ringkasan persediaan dan penjualan Jessie Collection."
      action={
        <div className="page-head-actions">
          <button
            className="ghost"
            onClick={refresh}
          >
            ↻ Refresh
          </button>

          <button
            className="theme-toggle"
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("jc-theme-toggle"))
            }
            title="Ganti tema"
          >
            {theme === "dark" ? "☀️ Terang" : "🌙 Gelap"}
          </button>
        </div>
      }
    >
      <style>{`
        :root {
          --jc-bg: #f7f0ec;
          --jc-surface: #fffaf7;
          --jc-surface-2: #f1e2e0;
          --jc-primary: #742d3d;
          --jc-primary-soft: #b96d7b;
          --jc-text: #2a2428;
          --jc-muted: #7d6f75;
          --jc-border: #e8d9d5;
        }

        body {
          background:
            radial-gradient(circle at 12% 8%, #f1dce1 0, transparent 28%),
            radial-gradient(circle at 92% 4%, #eadfce 0, transparent 26%),
            var(--jc-bg);
        }

        .app,
        .guest-main-only {
          background:
            radial-gradient(circle at 12% 8%, #f1dce1 0, transparent 28%),
            radial-gradient(circle at 92% 4%, #eadfce 0, transparent 26%),
            var(--jc-bg);
        }

        .app-sidebar {
          position: relative;
          z-index: 40;
          transition: transform .22s ease;
        }
        /* Desktop sidebar participates in the flex layout. */
        @media (min-width: 981px) {
          .app {
            align-items: stretch;
          }

          .app > main {
            flex: 1 1 auto;
            width: auto;
            min-width: 0;
          }

          .sidebar-collapsed > main {
            width: 100%;
            flex-basis: 100%;
          }
        }



        .sidebar-collapsed .app-sidebar {
          display: none;
        }

        .sidebar-reopen-button,
        .mobile-menu-button {
          position: fixed;
          z-index: 70;
          width: 42px;
          height: 42px;
          border: 1px solid var(--jc-border);
          border-radius: 12px;
          background: var(--jc-surface);
          color: var(--jc-primary);
          box-shadow: 0 10px 28px rgba(86,42,51,.14);
          font-size: 18px;
          cursor: pointer;
        }

        .sidebar-reopen-button {
          left: 14px;
          top: 18px;
          display: grid;
          place-items: center;
        }

        .mobile-menu-button {
          left: 14px;
          top: 18px;
          display: none;
        }

        .sidebar-hide-button {
          margin-left: auto;
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 9px;
          background: rgba(255,255,255,.09);
          color: inherit;
          cursor: pointer;
          font-size: 20px;
        }

        .sidebar-backdrop {
          display: none;
        }

        .user-section-label {
          margin: 2px 12px 7px;
          color: #a38f96;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .whatsapp-logo {
          width: 20px;
          height: 20px;
          display: inline-grid;
          place-items: center;
          flex: 0 0 auto;
        }

        .whatsapp-logo svg {
          width: 100%;
          height: 100%;
          fill: currentColor;
        }

        .social-link {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 11px 12px;
          margin-bottom: 10px;
          border-radius: 10px;
          text-decoration: none;
          color: inherit;
          background: rgba(255,255,255,.07);
          transition: .15s ease;
        }

        .social-link:hover {
          background: rgba(255,255,255,.14);
          transform: translateY(-1px);
        }

        .guest-catalog-button {
          width: 100%;
          margin-top: 10px;
          padding: 11px 14px;
          border: 1px solid var(--jc-border);
          border-radius: 12px;
          background: var(--jc-surface);
          color: var(--jc-primary);
          font: inherit;
          font-weight: 800;
          cursor: pointer;
        }

        .guest-catalog-button:hover {
          background: var(--jc-surface-2);
        }

        .guest-main-only {
          min-height: 100vh;
        }

        .guest-catalog-page {
          max-width: 1220px;
          margin: 0 auto;
          padding: 42px 28px 64px;
        }

        .guest-catalog-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .guest-catalog-top h1 {
          margin: 6px 0 8px;
          font-size: clamp(30px, 5vw, 48px);
          color: var(--jc-primary);
        }

        .guest-catalog-top p {
          margin: 0;
          color: var(--jc-muted);
        }

        .guest-catalog-search {
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 780px;
          padding: 4px 14px;
          margin-bottom: 28px;
          border: 1px solid var(--jc-border);
          border-radius: 14px;
          background: rgba(255,250,247,.92);
          box-shadow: 0 12px 36px rgba(100,65,70,.08);
        }

        .guest-catalog-search > span {
          font-size: 20px;
          color: var(--jc-primary-soft);
        }

        .guest-product-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .guest-product-card {
          display: flex;
          flex-direction: column;
          min-height: 220px;
          padding: 20px;
          border: 1px solid var(--jc-border);
          border-radius: 18px;
          background: rgba(255,250,247,.97);
          box-shadow: 0 14px 36px rgba(100,65,70,.08);
        }

        .guest-product-brand {
          color: var(--jc-primary-soft);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .guest-product-card > strong {
          margin-top: 8px;
          font-size: 25px;
          color: var(--jc-primary);
        }

        .guest-product-card > p {
          flex: 1;
          margin: 10px 0 20px;
          color: #5f545a;
          line-height: 1.5;
        }

        .guest-product-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .guest-product-bottom > span {
          font-weight: 800;
          color: var(--jc-text);
        }

        .guest-whatsapp-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 38px;
          padding: 0 13px;
          border-radius: 11px;
          background: #8c3b4c;
          color: #fff;
          text-decoration: none;
          font-weight: 800;
        }

        .guest-whatsapp-button .whatsapp-logo {
          width: 18px;
          height: 18px;
        }

        .guest-empty {
          grid-column: 1 / -1;
          padding: 50px 20px;
          border: 1px dashed var(--jc-border);
          border-radius: 18px;
          background: rgba(255,250,247,.75);
          text-align: center;
          color: var(--jc-muted);
        }

        .dark-mode body {
          background: #171419;
        }

        .dark-mode .app,
        .dark-mode .guest-main-only {
          background:
            radial-gradient(circle at 12% 8%, #39282f 0, transparent 28%),
            radial-gradient(circle at 92% 4%, #302a23 0, transparent 26%),
            #171419;
          color: #f7edf0;
        }

        .dark-mode .panel,
        .dark-mode .stat,
        .dark-mode .table-wrap,
        .dark-mode .form-card,
        .dark-mode .guest-product-card,
        .dark-mode .guest-catalog-search,
        .dark-mode .guest-empty {
          background: #211d24;
          border-color: #3b313a;
          color: #f7edf0;
        }

        .dark-mode .guest-product-card > p,
        .dark-mode .guest-catalog-top p {
          color: #c8bcc2;
        }

        .dark-mode .guest-catalog-top h1,
        .dark-mode .guest-product-card > strong {
          color: #e8b7c1;
        }

        .dark-mode .sidebar-reopen-button,
        .dark-mode .mobile-menu-button,
        .dark-mode .guest-catalog-button {
          background: #211d24;
          border-color: #3b313a;
          color: #f3dbe1;
        }

        @media (max-width: 980px) {
          .mobile-menu-button {
            display: grid;
            place-items: center;
          }

          .sidebar-reopen-button {
            display: none;
          }

          .app-sidebar {
            position: fixed;
            inset: 0 auto 0 0;
            width: min(300px, 86vw);
            transform: translateX(0);
            box-shadow: 18px 0 44px rgba(20,20,24,.18);
          }

          .sidebar-collapsed .app-sidebar {
            display: block;
            transform: translateX(-110%);
          }

          .sidebar-open .sidebar-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 30;
            border: 0;
            background: rgba(12,10,14,.36);
          }

          .sidebar-open .mobile-menu-button {
            display: none;
          }

          .sidebar-hide-button {
            display: inline-grid;
            place-items: center;
          }

          .guest-product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 680px) {
          .guest-catalog-page {
            padding: 28px 16px 48px;
          }

          .guest-catalog-top {
            flex-direction: column;
          }

          .guest-product-grid {
            grid-template-columns: 1fr;
          }

          .guest-product-card {
            min-height: 200px;
          }

          .guest-product-bottom {
            align-items: stretch;
            flex-direction: column;
          }

          .guest-whatsapp-button {
            justify-content: center;
          }
        }

        .dark-mode {
          background: #111318;
          color: #f4f5f7;
        }

        .dark-mode .app {
          background: #111318;
          color: #f4f5f7;
        }

        .dark-mode main,
        .dark-mode .content {
          background: #111318;
          color: #f4f5f7;
        }

        .dark-mode .page-head p,
        .dark-mode .panel-head p,
        .dark-mode .jc-monthly-title span,
        .dark-mode .jc-monthly-summary,
        .dark-mode .stat small,
        .dark-mode .stat > div > span {
          color: #aeb4bf;
        }

        .dark-mode .panel,
        .dark-mode .stat,
        .dark-mode .table-wrap,
        .dark-mode .form-card {
          background: #1c2027;
          border-color: #343943;
          color: #f4f5f7;
        }

        .dark-mode input,
        .dark-mode select,
        .dark-mode textarea {
          background: #22262e;
          color: #f4f5f7;
          border-color: #343943;
        }

        .dark-mode .ghost,
        .dark-mode .outline-wide {
          background: #22262e;
          color: #f4f5f7;
          border-color: #343943;
        }

        .dark-mode .activity-row,
        .dark-mode td,
        .dark-mode th {
          border-color: #343943;
        }

        .dark-mode .jc-monthly-table th {
          color: #c4c9d2;
        }

        .brand-stock-cards {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin: 18px 0;
        }

        .brand-stock-card {
          padding: 22px 24px;
          border: 1px solid #e8eaed;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 6px 20px rgba(20, 24, 32, .04);
        }

        .brand-stock-card span,
        .brand-stock-card small {
          display: block;
          color: #727983;
        }

        .brand-stock-card span {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .08em;
        }

        .brand-stock-card strong {
          display: block;
          margin: 6px 0 2px;
          font-size: 32px;
          line-height: 1.1;
        }

        .social-link {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 11px 12px;
          margin-bottom: 10px;
          border-radius: 10px;
          text-decoration: none;
          color: inherit;
          background: rgba(255,255,255,.06);
          transition: .15s ease;
        }

        .social-link:hover {
          background: rgba(255,255,255,.12);
          transform: translateY(-1px);
        }

        .social-link span:last-child {
          font-weight: 700;
        }

        .theme-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 12px;
          border: 1px solid #dfe2e6;
          border-radius: 10px;
          background: #fff;
          color: #17181b;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .page-head-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dark-mode .theme-toggle {
          border-color: #343943;
          background: #22262e;
          color: #f4f5f7;
        }

        .dark-mode .brand-stock-card,
        .dark-mode .jc-monthly-select,
        .dark-mode .jc-monthly-group summary,
        .dark-mode .jc-monthly-card,
        .dark-mode .jc-monthly-table-wrap {
          background: #1c2027;
          border-color: #343943;
          color: #f4f5f7;
        }

        .dark-mode .jc-monthly-body {
          background: #15181d;
        }

        .dark-mode .jc-monthly-table th {
          background: #22262e;
        }

        @media (max-width: 700px) {
          .brand-stock-cards {
            grid-template-columns: 1fr;
          }
        }

        .jc-monthly-panel {
          margin-top: 18px;
          overflow: hidden;
        }

        .jc-monthly-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .jc-monthly-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-left: auto;
        }

        .jc-month-select {
          min-width: 190px;
          height: 42px;
          padding: 0 38px 0 12px;
          border: 1px solid #dfe2e6;
          border-radius: 10px;
          background: #fff;
          font: inherit;
          font-weight: 600;
          cursor: pointer;
        }

        .jc-monthly-group {
          border-top: 1px solid #eceef1;
        }

        .jc-monthly-group summary {
          list-style: none;
          cursor: pointer;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
          background: #fff;
        }

        .jc-monthly-group summary::-webkit-details-marker {
          display: none;
        }

        .jc-monthly-group summary::before {
          content: "›";
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          border: 1px solid #e3e5e8;
          border-radius: 50%;
          font-size: 20px;
          line-height: 1;
          transition: transform .15s ease;
        }

        .jc-monthly-group[open] summary::before {
          transform: rotate(90deg);
        }

        .jc-monthly-title {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 230px;
          flex: 1 1 260px;
        }

        .jc-monthly-title strong {
          font-size: 17px;
        }

        .jc-monthly-title span {
          color: #7b818b;
          font-size: 13px;
        }

        .jc-monthly-summary {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 18px;
          flex-wrap: wrap;
          font-size: 13px;
          color: #707680;
        }

        .jc-monthly-summary span {
          white-space: nowrap;
        }

        .jc-monthly-summary b {
          color: #17181b;
        }

        .jc-monthly-body {
          padding: 0 20px 20px;
          background: #fafbfc;
        }

        .jc-monthly-cards {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          padding: 14px 0;
        }

        .jc-monthly-card {
          border: 1px solid #e8eaed;
          border-radius: 10px;
          background: #fff;
          padding: 12px 14px;
        }

        .jc-monthly-card span {
          display: block;
          color: #7b818b;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .jc-monthly-card strong {
          font-size: 17px;
        }

        .jc-monthly-table-wrap {
          overflow-x: auto;
          border: 1px solid #e8eaed;
          border-radius: 10px;
          background: #fff;
        }

        .jc-monthly-table {
          width: 100%;
          min-width: 650px;
          border-collapse: collapse;
        }

        .jc-monthly-table th,
        .jc-monthly-table td {
          padding: 13px 14px;
          text-align: left;
          border-bottom: 1px solid #eef0f2;
          vertical-align: middle;
        }

        .jc-monthly-table th {
          background: #f7f8fa;
          color: #727983;
          font-size: 11px;
          letter-spacing: .04em;
          white-space: nowrap;
        }

        .jc-monthly-table td {
          font-size: 14px;
        }

        .jc-monthly-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .jc-monthly-table td:nth-child(3),
        .jc-monthly-table td:nth-child(4) {
          white-space: nowrap;
        }

        .jc-monthly-table td:last-child {
          text-align: right;
          white-space: nowrap;
        }

        .jc-export-label {
          color: #747a84;
          font-size: 12px;
          font-weight: 600;
        }

        @media (max-width: 900px) {
          .jc-monthly-cards {
            grid-template-columns: 1fr;
          }

          .jc-monthly-summary {
            justify-content: flex-start;
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .jc-monthly-actions {
            width: 100%;
            margin-left: 0;
          }

          .jc-month-select,
          .jc-monthly-actions .primary {
            width: 100%;
          }

          .jc-monthly-group summary {
            padding: 15px;
          }

          .jc-monthly-body {
            padding: 0 15px 15px;
          }
        }
      `}</style>

      <div
        className={`dashboard-shell ${
          pulse ? "pulse" : ""
        }`}
      >
        <section className="hero hero-dashboard">
          <div>
            <span className="eyebrow">
              JESSIE COLLECTION
            </span>

            <h2>
              Selamat datang kembali.
            </h2>

            <p>
              Pantau stok, penjualan, dan
              pendapatan tanpa harus membuka
              banyak halaman.
            </p>

            <div className="hero-actions">
              <button
                className="primary light"
                onClick={() =>
                  go("add-product")
                }
              >
                + Tambah Produk
              </button>

              <button
                className="hero-link"
                onClick={() =>
                  go("sold")
                }
              >
                Catat Penjualan →
              </button>
            </div>
          </div>

          <div className="hero-orb">
            <span>JC</span>
            <i></i>
            <i></i>
            <i></i>
          </div>
        </section>

        <div className="stats dashboard-stats">
          <Stat
            title="Total Kode Barang"
            value={
              s?.total_products ?? "—"
            }
            desc="Kode barang terdaftar"
            icon="▦"
          />

          <Stat
            title="Total Stok"
            value={
              s?.total_stock ?? "—"
            }
            desc="Unit tersedia"
            icon="◈"
          />

          <Stat
            title={`Terjual ${currentMonthTitle}`}
            value={monthly.units}
            desc="Unit terjual"
            icon="↑"
          />

          <Stat
            title={`Pendapatan ${currentMonthTitle}`}
            value={money(monthly.revenue)}
            desc="Dari transaksi terjual"
            icon="Rp"
            moneyValue
          />
        </div>

        <div className="brand-stock-cards">
          <div className="brand-stock-card">
            <span>HONGYANG</span>
            <strong>{hongyangStock.toLocaleString("id-ID")}</strong>
            <small>unit stok</small>
          </div>

          <div className="brand-stock-card">
            <span>HY JP56</span>
            <strong>{hyStock.toLocaleString("id-ID")}</strong>
            <small>unit stok</small>
          </div>
        </div>

        <div className="dashboard-grid">
          <section className="panel chart-panel">
            <div className="panel-head">
              <div>
                <h3>Komposisi Stok Berdasarkan Brand</h3>
                <p>Distribusi jumlah stok setiap brand.</p>
              </div>
            </div>

            <div className="chart-content">
              <div
                className="donut"
                style={{ background: pieStops }}
              >
                <div>
                  <strong>{totalBrandStock.toLocaleString("id-ID")}</strong>
                  <span>unit stok</span>
                </div>
              </div>

              <div className="legend">
                {brandStock.slice(0, 6).map((item, index) => (
                  <Legend
                    key={item.brand}
                    dot={index % 2 === 0 ? "dark" : "warn"}
                    label={item.brand}
                    value={item.stock.toLocaleString("id-ID")}
                  />
                ))}

                {!brandStock.length && (
                  <Empty text="Belum ada data stok." />
                )}
              </div>
            </div>
          </section>

          <section className="panel revenue-panel">
            <div className="panel-head">
              <div>
                <h3>
                  Penjualan {currentMonthTitle}
                </h3>

                <p>
                  Total pendapatan dari
                  barang terjual pada bulan
                  yang sedang berjalan.
                </p>
              </div>

              <span className="trend">
                LIVE
              </span>
            </div>

            <div className="revenue-big">
              {money(monthly.revenue)}
            </div>

            <div className="revenue-meta">
              <div>
                <b>
                  {monthly.units}
                </b>

                <span>
                  unit terjual
                </span>
              </div>

              <div>
                <b>
                  {monthly.transactions}
                </b>

                <span>
                  transaksi tersimpan
                </span>
              </div>
            </div>

            <button
              className="outline-wide"
              onClick={() =>
                go("sold")
              }
            >
              Lihat Penjualan →
            </button>
          </section>
        </div>

        <section className="panel jc-monthly-panel">
          <div className="panel-head jc-monthly-head">
            <div>
              <h3>
                Keseluruhan Penjualan Tiap Bulan
              </h3>

              <p>
                Rekap per bulan dan kode barang.
                Gunakan pilihan bulan untuk melihat
                atau mengunduh laporan Excel.
              </p>
            </div>

            <div className="jc-monthly-actions">
              <div>
                <span className="jc-export-label">
                  Pilih bulan
                </span>

                <select
                  className="jc-month-select"
                  value={selectedExportMonth}
                  onChange={e =>
                    setSelectedExportMonth(
                      e.target.value
                    )
                  }
                >
                  {monthOptions.length ? (
                    monthOptions.map(option => (
                      <option
                        key={`${option.year}-${option.month}`}
                        value={`${option.year}-${String(
                          option.month + 1
                        ).padStart(2, "0")}`}
                      >
                        {getMonthTitle(
                          option.year,
                          option.month
                        )}
                      </option>
                    ))
                  ) : (
                    <option value="">
                      Belum ada penjualan
                    </option>
                  )}
                </select>
              </div>

              <button
                className="primary"
                type="button"
                onClick={() =>
                  downloadSalesExcel(
                    monthlySales,
                    selectedExportFilter
                  )
                }
                disabled={
                  !selectedExportFilter ||
                  !monthlySales.some(
                    row =>
                      row.year ===
                        selectedExportFilter.year &&
                      row.month ===
                        selectedExportFilter.month
                  )
                }
              >
                ↓ Export Excel Bulan Ini
              </button>

              <button
                className="ghost"
                type="button"
                onClick={() =>
                  downloadSalesExcel(
                    monthlySales
                  )
                }
                disabled={!monthlySales.length}
              >
                ↓ Export Excel Semua Bulan
              </button>
            </div>
          </div>

          {monthlyGroups.length ? (
            <div>
              {monthlyGroups.map(
                (group, index) => (
                  <details
                    key={`${group.year}-${group.month}`}
                    className="jc-monthly-group"
                    open={index === 0}
                  >
                    <summary>
                      <div className="jc-monthly-title">
                        <strong>
                          {getMonthTitle(
                            group.year,
                            group.month
                          )}
                        </strong>

                        <span>
                          {group.rows.length} kode barang
                        </span>
                      </div>

                      <div className="jc-monthly-summary">
                        <span>
                          <b>{group.units}</b>{" "}
                          unit terjual
                        </span>

                        <span>
                          <b>
                            {group.transactions}
                          </b>{" "}
                          transaksi
                        </span>

                        <span>
                          <b>
                            {money(group.revenue)}
                          </b>
                        </span>
                      </div>
                    </summary>

                    <div className="jc-monthly-body">
                      <div className="jc-monthly-cards">
                        <div className="jc-monthly-card">
                          <span>
                            Unit terjual
                          </span>

                          <strong>
                            {group.units}
                          </strong>
                        </div>

                        <div className="jc-monthly-card">
                          <span>
                            Transaksi tersimpan
                          </span>

                          <strong>
                            {group.transactions}
                          </strong>
                        </div>

                        <div className="jc-monthly-card">
                          <span>
                            Pendapatan
                          </span>

                          <strong>
                            {money(group.revenue)}
                          </strong>
                        </div>
                      </div>

                      <div className="jc-monthly-table-wrap">
                        <table className="jc-monthly-table">
                          <thead>
                            <tr>
                              <th>KODE BARANG</th>
                              <th>BRAND</th>
                              <th>UNIT TERJUAL</th>
                              <th>TRANSAKSI</th>
                              <th>PENDAPATAN</th>
                            </tr>
                          </thead>

                          <tbody>
                            {group.rows.map(
                              row => (
                                <tr
                                  key={`${row.year}-${row.month}-${row.code}`}
                                >
                                  <td>
                                    <b>
                                      {row.code}
                                    </b>
                                  </td>

                                  <td>
                                    {row.brand}
                                  </td>

                                  <td>
                                    {row.units} unit
                                  </td>

                                  <td>
                                    {row.transactions}
                                  </td>

                                  <td>
                                    <b>
                                      {money(
                                        row.revenue
                                      )}
                                    </b>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </details>
                )
              )}
            </div>
          ) : (
            <Empty text="Belum ada data penjualan." />
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>
                Aktivitas Terbaru
              </h3>

              <p>
                Transaksi stok terakhir.
              </p>
            </div>

            <button
              className="ghost"
              onClick={() =>
                go("history")
              }
            >
              Lihat semua
            </button>
          </div>

          {m.length ? (
            <div className="activity">
              {m
                .slice(0, 6)
                .map(row => (
                  <div
                    className="activity-row"
                    key={row.id}
                  >
                    <span
                      className={`badge ${
                        row.type === "IN"
                          ? "in"
                          : "out"
                      }`}
                    >
                      {row.type === "IN"
                        ? "MASUK"
                        : "TERJUAL"}
                    </span>

                    <div className="activity-main">
                      <b>
                        {row.code}
                      </b>

                      <span>
                        {row.brand}
                      </span>
                    </div>

                    <strong>
                      {row.type === "IN"
                        ? "+"
                        : "−"}
                      {row.quantity}
                    </strong>

                    <small>
                      {formatDate(
                        row.created_at
                      )}
                    </small>
                  </div>
                ))}
            </div>
          ) : (
            <Empty text="Belum ada aktivitas stok." />
          )}
        </section>
      </div>
    </Page>
  );
}

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function Legend({
  dot,
  label,
  value
}) {
  return (
    <div className="legend-row">
      <span
        className={`legend-dot ${dot}`}
      ></span>

      <span>{label}</span>

      <b>{value}</b>
    </div>
  );
}

function Stat({
  title,
  value,
  desc,
  icon,
  moneyValue
}) {
  return (
    <div
      className={`stat ${
        moneyValue
          ? "stat-money"
          : ""
      }`}
    >
      <span className="stat-icon">
        {icon}
      </span>

      <div>
        <span>{title}</span>

        <strong>{value}</strong>

        <small>{desc}</small>
      </div>
    </div>
  );
}


/* ============================================================
   PRODUCTS
============================================================ */

function Products({
  user,
  toast,
  onExitGuest
}) {
  const [products, setProducts] =
    useState([]);

  const [q, setQ] =
    useState("");

  const [edit, setEdit] =
    useState(null);

  const [pickerOpen, setPickerOpen] =
    useState(false);

  const isAdmin =
    user?.role === "admin";

  const isGuest =
    user?.role === "guest";

  const load = () =>
    (isGuest
      ? publicApi("/catalog")
      : api("/products")
    )
      .then(r =>
        setProducts(r.data)
      )
      .catch(e =>
        toast(e.message, "error")
      );

  useEffect(() => {
    load();
  }, [isGuest]);

  const filtered = useMemo(
    () =>
      products
        .filter(p =>
          `${p.code || ""} ${
            p.brand || ""
          } ${
            p.description || ""
          }`
            .toLowerCase()
            .includes(
              q.toLowerCase()
            )
        )
        .filter(p =>
          isAdmin || isGuest
            ? Number(p.stock || 0) > 0 || isAdmin
            : Number(p.stock || 0) > 0
        ),
    [products, q, isAdmin, isGuest]
  );

  function startEdit() {
    if (
      products.length &&
      isAdmin
    ) {
      setPickerOpen(true);
    }
  }

  if (isGuest) {
    return (
      <div className="guest-catalog-page">
        <div className="guest-catalog-top">
          <div>
            <span className="eyebrow">
              JESSIE COLLECTION
            </span>

            <h1>
              Katalog Ready Stock
            </h1>

            <p>
              Lihat barang yang tersedia
              dan hubungi kami untuk
              pemesanan.
            </p>
          </div>

          <button
            type="button"
            className="ghost"
            onClick={onExitGuest}
          >
            Kembali
          </button>
        </div>

        <div className="guest-catalog-search">
          <span>⌕</span>

          <ClearableInput
            placeholder="Cari kode, brand, atau keterangan..."
            value={q}
            onChange={e =>
              setQ(e.target.value)
            }
          />
        </div>

        <div className="guest-product-grid">
          {filtered.map(p => (
            <article
              className="guest-product-card"
              key={p.id}
            >
              <span className="guest-product-brand">
                {p.brand}
              </span>

              <strong>
                {p.code}
              </strong>

              <p>
                {p.description ||
                  "Keterangan belum tersedia."}
              </p>

              <div className="guest-product-bottom">
                <span>
                  {Number(
                    p.stock || 0
                  ).toLocaleString(
                    "id-ID"
                  )}{" "}
                  unit
                </span>

                <a
                  className="guest-whatsapp-button"
                  href={`https://wa.me/6281319467739?text=${encodeURIComponent(
                    `Halo Jessie Collection, saya tertarik dengan ${p.code} - ${p.description || ""}. Apakah masih tersedia?`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span
                    className="whatsapp-logo"
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M12 2.4A9.6 9.6 0 0 0 3.7 17l-1.2 4.4 4.5-1.2A9.6 9.6 0 1 0 12 2.4Zm0 17.2c-1.4 0-2.7-.4-3.8-1.1l-.3-.2-2.7.7.7-2.6-.2-.3A7.7 7.7 0 1 1 12 19.6Zm4.2-5.6c-.2-.1-1.4-.7-1.6-.8-.2.1-.4.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-1.3-.7-2.2-1.2-3.1-2.7-.2-.3.2-.3.5-1 .1-.2.1-.4 0-.5 0-.1-.5-1.2-.7-1.7-.2-.4-.4-.4-.5-.4h-.4c-.1 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.4c.1.2 1.6 2.5 3.9 3.4.5.2.9.3 1.2.4.5-.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1Z" />
                    </svg>
                  </span>

                  WhatsApp
                </a>
              </div>
            </article>
          ))}

          {!filtered.length && (
            <div className="guest-empty">
              Barang ready belum tersedia.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Page
      title="Produk"
      subtitle={
        isAdmin
          ? "Kelola katalog, keterangan barang, dan stok Jessie Collection."
          : "Daftar barang ready dan informasi stok."
      }
      action={
        <div className="head-actions">
          {isAdmin && (
            <button
              className="primary"
              onClick={startEdit}
              disabled={!products.length}
            >
              ✎ Edit Produk
            </button>
          )}

          <button
            className="ghost"
            onClick={load}
          >
            ↻ Refresh
          </button>
        </div>
      }
    >
      <div className="toolbar">
        <div className="search-box">
          <span>⌕</span>

          <ClearableInput
            placeholder="Cari kode, brand, atau keterangan..."
            value={q}
            onChange={e =>
              setQ(e.target.value)
            }
          />
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>BRAND</th>
              <th>KODE</th>
              <th>KETERANGAN</th>
              <th>STOK</th>
              {isAdmin && (
                <>
                  <th>HARGA MODAL</th>
                  <th>STATUS</th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>
                  <b>{p.brand}</b>
                </td>

                <td>
                  <b>{p.code}</b>
                </td>

                <td>
                  {p.description ||
                    "—"}
                </td>

                <td>
                  <b>{p.stock}</b>{" "}
                  unit
                </td>

                {isAdmin && (
                  <>
                    <td>
                      {money(
                        p.cost_price
                      )}
                    </td>

                    <td>
                      <span
                        className={`stock-pill ${
                          p.stock === 0
                            ? "empty"
                            : p.stock <= 5
                            ? "warn"
                            : "ok"
                        }`}
                      >
                        {p.stock === 0
                          ? "KOSONG"
                          : p.stock <= 5
                          ? "MENIPIS"
                          : "TERSEDIA"}
                      </span>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {!filtered.length && (
          <Empty text="Produk tidak ditemukan." />
        )}
      </div>

      {pickerOpen && (
        <ProductPicker
          products={products}
          onClose={() =>
            setPickerOpen(false)
          }
          onSelect={p => {
            setPickerOpen(false);
            setEdit(p);
          }}
        />
      )}

      {edit && (
        <ProductModal
          product={edit}
          products={products}
          onClose={() =>
            setEdit(null)
          }
          onDone={() => {
            setEdit(null);
            load();
          }}
          toast={toast}
        />
      )}
    </Page>
  );
}

/* ============================================================
   PRODUCT PICKER
============================================================ */

function ProductPicker({
  products,
  onClose,
  onSelect
}) {
  const [q, setQ] =
    useState("");

  const filtered =
    products.filter(p =>
      `${p.code} ${p.brand}`
        .toLowerCase()
        .includes(
          q.toLowerCase()
        )
    );

  return (
    <Modal
      title="Pilih Produk yang Akan Diedit"
      onClose={onClose}
    >
      <div className="picker-search">
        <ClearableInput
          value={q}
          onChange={e =>
            setQ(e.target.value)
          }
          placeholder="Cari kode atau brand..."
        />
      </div>

      <div className="product-picker-list">
        {filtered.map(p => (
          <button
            type="button"
            key={p.id}
            className="product-picker-item"
            onClick={() =>
              onSelect(p)
            }
          >
            <span>
              <b>{p.code}</b>

              <small>
                {p.brand} ·{" "}
                {p.stock} unit
              </small>
            </span>

            <span>›</span>
          </button>
        ))}

        {!filtered.length && (
          <Empty text="Produk tidak ditemukan." />
        )}
      </div>
    </Modal>
  );
}


/* ============================================================
   ADD PRODUCT
============================================================ */

function AddProduct({
  toast,
  onDone
}) {
  const [products, setProducts] =
    useState([]);

  const [brand, setBrand] =
    useState("");

  const [code, setCode] =
    useState("");

  const [stock, setStock] =
    useState("");

  const [cost, setCost] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    api("/products")
      .then(r => {
        setProducts(r.data);

        const first = [
          ...new Map(
            r.data.map(x => [
              x.brand_id,
              x.brand
            ])
          ).entries()
        ][0];

        if (first) {
          setBrand(
            String(first[0])
          );
        }
      })
      .catch(e =>
        toast(e.message, "error")
      );
  }, []);

  const brands = [
    ...new Map(
      products.map(x => [
        x.brand_id,
        x.brand
      ])
    ).entries()
  ];

  async function submit(e) {
    e.preventDefault();

    if (!brand || !code.trim()) {
      return toast(
        "Brand dan kode barang wajib diisi.",
        "error"
      );
    }

    if (
      stock === "" ||
      Number(stock) < 0
    ) {
      return toast(
        "Silahkan input stok awal.",
        "error"
      );
    }

    if (
      cost === "" ||
      Number(cost) < 0
    ) {
      return toast(
        "Silahkan input harga modal.",
        "error"
      );
    }

    const normalizedCode = code.trim().toUpperCase();
    const duplicateInBrand = products.some(
      x =>
        String(x.brand_id) === String(brand) &&
        String(x.code || "").trim().toUpperCase() === normalizedCode
    );

    if (duplicateInBrand) {
      return toast(
        `Kode "${normalizedCode}" sudah ada pada brand ini. Gunakan kode lain.`,
        "error"
      );
    }

    setSaving(true);

    try {
      await api("/products", {
        method: "POST",
        body: JSON.stringify({
          brand_id: Number(brand),
          code: normalizedCode,
          stock: Number(stock),
          cost_price: Number(cost)
        })
      });

      toast(
        "Produk berhasil ditambahkan"
      );

      setCode("");
      setStock("");
      setCost("");

      onDone?.();
    } catch (e) {
      toast(
        e.message,
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page
      title="Tambah Produk"
      subtitle="Daftarkan barang baru ke katalog Jessie Collection."
    >
      <div className="form-card form-card-large">
        <div className="form-intro">
          <span className="form-icon">
            +
          </span>

          <div>
            <h3>
              Data Produk Baru
            </h3>

            <p>
              Kode barang akan menjadi
              identitas utama saat stok
              masuk dan penjualan.
            </p>
          </div>
        </div>

        <form onSubmit={submit}>
          <label>
            Brand

            <select
              value={brand}
              onChange={e =>
                setBrand(
                  e.target.value
                )
              }
            >
              {brands.map(
                ([id, name]) => (
                  <option
                    key={id}
                    value={id}
                  >
                    {name}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Kode Barang

            <ClearableInput
              list="new-product-codes"
              value={code}
              onChange={e =>
                setCode(
                  e.target.value.toUpperCase()
                )
              }
              placeholder="Contoh: ACP"
              autoComplete="off"
            />

            <datalist id="new-product-codes">
              {products.map(x => (
                <option
                  key={x.id}
                  value={x.code}
                >
                  {x.brand}
                </option>
              ))}
            </datalist>

            <small className="hint">
              Gunakan saran yang sudah ada
              atau masukkan kode baru.
            </small>
          </label>

          <label>
            Stok Awal

            <ClearableInput
              type="number"
              min="0"
              value={stock}
              onChange={e =>
                setStock(
                  e.target.value
                )
              }
              placeholder="Silahkan input jumlah stok"
            />
          </label>

          <label>
            Harga Modal

            <ClearableInput
              type="number"
              min="0"
              value={cost}
              onChange={e =>
                setCost(
                  e.target.value
                )
              }
              placeholder="Silahkan input harga modal"
            />
          </label>

          <div className="form-actions">
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setCode("");
                setStock("");
                setCost("");
              }}
            >
              Bersihkan
            </button>

            <button
              className="primary"
              disabled={saving}
            >
              {saving
                ? "Menyimpan..."
                : "Simpan Produk"}
            </button>
          </div>
        </form>
      </div>
    </Page>
  );
}


/* ============================================================
   EDIT PRODUCT
============================================================ */

function ProductModal({
  product: p,
  products,
  onClose,
  onDone,
  toast
}) {
  const brands = [
    ...new Map(
      products.map(x => [
        x.brand_id,
        x.brand
      ])
    ).entries()
  ];

  const [brand, setBrand] =
    useState(p.brand_id);

  const [code, setCode] =
    useState(p.code);

  const [stock, setStock] =
    useState(
      String(p.stock ?? "")
    );

  const [cost, setCost] =
    useState(
      String(p.cost_price ?? "")
    );

  const [saving, setSaving] =
    useState(false);

  async function submit(e) {
    e.preventDefault();

    if (
      !code.trim() ||
      stock === "" ||
      cost === ""
    ) {
      return toast(
        "Silahkan lengkapi semua data produk.",
        "error"
      );
    }

    if (
      Number(stock) < 0 ||
      Number(cost) < 0
    ) {
      return toast(
        "Nilai tidak boleh negatif.",
        "error"
      );
    }

    setSaving(true);

    try {
      await api(`/products/${p.id}`, {
        method: "PUT",
        body: JSON.stringify({
          brand_id: Number(brand),
          code: code
            .trim()
            .toUpperCase(),
          stock: Number(stock),
          cost_price: Number(cost)
        })
      });

      toast(
        "Produk berhasil diperbarui"
      );

      onDone();
    } catch (e) {
      toast(
        e.message,
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Edit ${p.code}`}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <label>
          Brand

          <select
            value={brand}
            onChange={e =>
              setBrand(
                e.target.value
              )
            }
          >
            {brands.map(
              ([id, name]) => (
                <option
                  key={id}
                  value={id}
                >
                  {name}
                </option>
              )
            )}
          </select>
        </label>

        <label>
          Kode Barang

          <ClearableInput
            value={code}
            onChange={e =>
              setCode(
                e.target.value.toUpperCase()
              )
            }
            placeholder="Silahkan input kode barang"
          />
        </label>

        <label>
          Stok

          <ClearableInput
            type="number"
            min="0"
            value={stock}
            onChange={e =>
              setStock(
                e.target.value
              )
            }
            placeholder="Silahkan input jumlah stok"
          />
        </label>

        <label>
          Harga Modal

          <ClearableInput
            type="number"
            min="0"
            value={cost}
            onChange={e =>
              setCost(
                e.target.value
              )
            }
            placeholder="Silahkan input harga modal"
          />
        </label>

        <div className="modal-actions">
          <button
            type="button"
            className="ghost"
            onClick={onClose}
          >
            Batal
          </button>

          <button
            className="primary"
            disabled={saving}
          >
            {saving
              ? "Menyimpan..."
              : "Simpan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}


/* ============================================================
   STOCK IN
============================================================ */

function StockIn({ toast, userRole = "admin" }) {
  const [products, setProducts] =
    useState([]);

  const [rows, setRows] =
    useState([]);

  const [open, setOpen] =
    useState(false);

  const [pulse, setPulse] =
    useState(false);

  async function load() {
    try {
      const [p, m] =
        await Promise.all([
          api("/products"),
          api("/stock/movements")
        ]);

      setProducts(p.data);

      setRows(
        m.data.filter(
          x => x.type === "IN"
        )
      );
    } catch (e) {
      toast(
        e.message,
        "error"
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  const refresh = async () => {
    setPulse(true);

    await load();

    setTimeout(() => {
      setPulse(false);
    }, 650);
  };

  return (
    <Page
      title="Stok Masuk"
      subtitle="Semua riwayat barang yang masuk ke persediaan."
      action={
        <div className="head-actions">
          <button
            className="ghost"
            onClick={refresh}
          >
            ↻ Refresh
          </button>

          <button
            className="primary"
            onClick={() =>
              setOpen(true)
            }
          >
            + Tambah Stok
          </button>
        </div>
      }
    >
      <div
        className={
          pulse
            ? "page-pulse"
            : ""
        }
      >
        <StockSummaryStrip
          label="Total barang masuk"
          value={rows.reduce(
            (a, x) =>
              a +
              Number(
                x.quantity || 0
              ),
            0
          )}
          accent="in"
        />

        <MovementTable
          rows={rows}
          type="IN"
        />
      </div>

      {open && (
        <StockInModal
          products={products}
          onClose={() =>
            setOpen(false)
          }
          onDone={() => {
            setOpen(false);
            refresh();
          }}
          toast={toast}
        />
      )}
    </Page>
  );
}


/* ============================================================
   STOCK IN MODAL
============================================================ */

function StockInModal({
  products,
  onClose,
  onDone,
  toast
}) {
  const [code, setCode] =
    useState("");

  const [qty, setQty] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const p = products.find(
    x =>
      x.code.toLowerCase() ===
      code.trim().toLowerCase()
  );

  async function submit(e) {
    e.preventDefault();

    if (!p) {
      return toast(
        "Kode barang tidak ditemukan.",
        "error"
      );
    }

    if (
      qty === "" ||
      Number(qty) <= 0
    ) {
      return toast(
        "Silahkan input jumlah barang.",
        "error"
      );
    }

    setLoading(true);

    try {
      await api("/stock/in", {
        method: "POST",
        body: JSON.stringify({
          product_id: p.id,
          quantity: Number(qty),
          notes
        })
      });

      toast(
        `Stok ${p.code} bertambah ${qty} unit`
      );

      onDone();
    } catch (e) {
      toast(
        e.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Tambah Stok"
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <label>
          Kode Barang

          <ClearableInput
            list="in-codes"
            value={code}
            onChange={e =>
              setCode(
                e.target.value.toUpperCase()
              )
            }
            placeholder="Pilih / ketik kode"
            autoComplete="off"
          />

          <datalist id="in-codes">
            {products.map(x => (
              <option
                key={x.id}
                value={x.code}
              >
                {x.brand}
              </option>
            ))}
          </datalist>
        </label>

        {p && (
          <div className="selected-product">
            <b>{p.code}</b>

            <span>
              {p.brand} · stok sekarang{" "}
              {p.stock} unit
            </span>
          </div>
        )}

        <label>
          Total Barang Masuk

          <ClearableInput
            type="number"
            min="1"
            value={qty}
            onChange={e =>
              setQty(
                e.target.value
              )
            }
            placeholder="Silahkan input jumlah barang"
          />
        </label>

        <label>
          Catatan

          <ClearableTextarea
            value={notes}
            onChange={e =>
              setNotes(
                e.target.value
              )
            }
            placeholder="Contoh: Restock supplier"
          />
        </label>

        <div className="modal-actions">
          <button
            type="button"
            className="ghost"
            onClick={onClose}
          >
            Batal
          </button>

          <button
            className="primary"
            disabled={loading}
          >
            {loading
              ? "Menyimpan..."
              : "Simpan Stok"}
          </button>
        </div>
      </form>
    </Modal>
  );
}


/* ============================================================
   SOLD
============================================================ */

function Sold({ toast, userRole = "admin" }) {
  const [products, setProducts] =
    useState([]);

  const [rows, setRows] =
    useState([]);

  const [open, setOpen] =
    useState(false);

  const [pulse, setPulse] =
    useState(false);

  async function load() {
    try {
      const [p, m] =
        await Promise.all([
          api("/products"),
          api("/stock/movements")
        ]);

      setProducts(p.data);

      setRows(
        m.data.filter(
          x => x.type === "OUT"
        )
      );
    } catch (e) {
      toast(
        e.message,
        "error"
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  const refresh = async () => {
    setPulse(true);

    await load();

    setTimeout(() => {
      setPulse(false);
    }, 650);
  };

  const totalRevenue =
    rows.reduce(
      (total, row) =>
        total + getSaleTotal(row),
      0
    );

  return (
    <Page
      title="Stok Terjual"
      subtitle="Semua riwayat barang yang keluar karena penjualan."
      action={
        <div className="head-actions">
          <button
            className="ghost"
            onClick={refresh}
          >
            ↻ Refresh
          </button>

          <button
            className="primary"
            onClick={() =>
              setOpen(true)
            }
          >
            + Stok Keluar
          </button>
        </div>
      }
    >
      <div
        className={
          pulse
            ? "page-pulse"
            : ""
        }
      >
        {userRole === "admin" && (
          <StockSummaryStrip
            label="Pendapatan tercatat"
            value={money(totalRevenue)}
            accent="out"
            money
          />
        )}

        <MovementTable
          rows={rows}
          type="OUT"
          showSales={userRole === "admin"}
          userRole={userRole}
        />
      </div>

      {open && (
        <SoldModal
          products={products}
          onClose={() =>
            setOpen(false)
          }
          onDone={() => {
            setOpen(false);
            refresh();
          }}
          toast={toast}
        />
      )}
    </Page>
  );
}


/* ============================================================
   SOLD MODAL
============================================================ */

function SoldModal({
  products,
  onClose,
  onDone,
  toast
}) {
  const [code, setCode] =
    useState("");

  const [qty, setQty] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const p = products.find(
    x =>
      x.code.toLowerCase() ===
      code.trim().toLowerCase()
  );

  const unavailable =
    p && p.stock <= 0;

  const total =
    Number(qty || 0) *
    Number(price || 0);

  async function submit(e) {
    e.preventDefault();

    if (!p) {
      return toast(
        "Kode barang tidak ditemukan.",
        "error"
      );
    }

    if (
      qty === "" ||
      Number(qty) <= 0
    ) {
      return toast(
        "Silahkan input jumlah barang.",
        "error"
      );
    }

    if (unavailable) {
      return toast(
        "Stok kosong — barang tidak bisa dijual.",
        "error"
      );
    }

    if (
      Number(qty) > p.stock
    ) {
      return toast(
        `Stok hanya tersisa ${p.stock} unit.`,
        "error"
      );
    }

    if (
      price === "" ||
      Number(price) <= 0
    ) {
      return toast(
        "Harga jual per barang wajib diisi.",
        "error"
      );
    }

    setLoading(true);

    try {
      await api("/stock/out", {
        method: "POST",
        body: JSON.stringify({
          product_id: p.id,
          quantity: Number(qty),
          sale_price: Number(price),
          notes: notes.trim() || null
        })
      });

      toast(
        `${qty} unit ${p.code} dicatat sebagai terjual`
      );

      onDone();
    } catch (e) {
      toast(
        e.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Stok Keluar / Penjualan"
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <label>
          Kode Barang

          <ClearableInput
            list="sold-codes"
            value={code}
            onChange={e =>
              setCode(
                e.target.value.toUpperCase()
              )
            }
            placeholder="Pilih / ketik kode"
            autoComplete="off"
          />

          <datalist id="sold-codes">
            {products.map(x => (
              <option
                key={x.id}
                value={x.code}
              >
                {x.brand}
              </option>
            ))}
          </datalist>
        </label>

        <div
          className={`selected-product ${
            unavailable
              ? "unavailable"
              : ""
          }`}
        >
          {p ? (
            <>
              <b>{p.code}</b>

              <span>
                {p.brand} · stok tersedia{" "}
                <strong>
                  {p.stock}
                </strong>{" "}
                unit
              </span>
            </>
          ) : (
            <span>
              Pilih kode barang untuk
              melihat stok.
            </span>
          )}
        </div>

        <label>
          Total Barang Terjual

          <ClearableInput
            type="number"
            min="1"
            max={
              p?.stock ||
              undefined
            }
            value={qty}
            onChange={e =>
              setQty(
                e.target.value
              )
            }
            placeholder="Silahkan input jumlah barang"
            disabled={unavailable}
          />
        </label>

        <label>
          Harga Jual / Barang

          <ClearableInput
            type="number"
            min="1"
            value={price}
            onChange={e =>
              setPrice(
                e.target.value
              )
            }
            placeholder="Silahkan input harga jual"
            disabled={unavailable}
          />
        </label>

        <div className="sale-total">
          <span>
            Total Penjualan
          </span>

          <strong>
            {money(total)}
          </strong>
        </div>

        <label>
          Catatan

          <ClearableTextarea
            value={notes}
            onChange={e =>
              setNotes(
                e.target.value
              )
            }
            placeholder="Catatan transaksi"
          />
        </label>

        {unavailable && (
          <div className="alert error">
            Stok kosong — barang tidak
            bisa dijual.
          </div>
        )}

        <div className="modal-actions">
          <button
            type="button"
            className="ghost"
            onClick={onClose}
          >
            Batal
          </button>

          <button
            className="primary"
            disabled={
              loading ||
              unavailable
            }
          >
            {loading
              ? "Menyimpan..."
              : "Simpan Penjualan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}


/* ============================================================
   MOVEMENT TABLE
============================================================ */

function MovementTable({
  rows,
  type,
  showSales,
  userRole = "admin"
}) {
  const mixed =
    type === "MIXED";

  return (
    <div className="table-wrap">
      <table className="movement-table">
        <thead>
          <tr>
            <th>TANGGAL</th>

            {mixed && (
              <th>JENIS</th>
            )}

            <th>PRODUK</th>

            <th>QTY</th>

            {showSales && (
              <>
                <th>
                  HARGA / BARANG
                </th>

                <th>
                  TOTAL PENJUALAN
                </th>
              </>
            )}

            <th>
              CATATAN
            </th>

            <th>
              DIBUAT OLEH
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map(row => {
            const price =
              getSalePrice(row);

            const total =
              getSaleTotal(row);

            /*
             * Jangan tampilkan "Harga jual"
             * sebagai catatan lagi karena harga
             * sekarang sudah punya kolom sendiri.
             */
            const note = String(
              row.notes || ""
            )
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

            const isIn =
              row.type === "IN";

            return (
              <tr key={row.id}>
                <td>
                  {formatDate(
                    row.created_at
                  )}
                </td>

                {mixed && (
                  <td>
                    <span
                      className={`badge ${
                        isIn
                          ? "in"
                          : "out"
                      }`}
                    >
                      {isIn
                        ? "MASUK"
                        : "TERJUAL"}
                    </span>
                  </td>
                )}

                <td>
                  <b>
                    {row.code}
                  </b>

                  <span className="sub">
                    {row.brand}
                  </span>
                </td>

                <td>
                  <span
                    className={`qty-chip ${
                      isIn
                        ? "positive"
                        : "negative"
                    }`}
                  >
                    {isIn
                      ? "+"
                      : "−"}
                    {row.quantity}
                  </span>
                </td>

                {showSales && (
                  <>
                    <td>
                      {price
                        ? money(price)
                        : "—"}
                    </td>

                    <td>
                      <b>
                        {total
                          ? money(total)
                          : "—"}
                      </b>
                    </td>
                  </>
                )}

                <td>
                  {note || "—"}
                </td>

                <td>
                  {row.created_by_username}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {!rows.length && (
        <Empty text="Belum ada transaksi." />
      )}
    </div>
  );
}


/* ============================================================
   SUMMARY STRIP
============================================================ */

function StockSummaryStrip({
  label,
  value,
  accent,
  money: isMoney
}) {
  return (
    <div
      className={`summary-strip ${accent}`}
    >
      <span>{label}</span>

      <strong>
        {isMoney
          ? value
          : `${Number(
              value
            ).toLocaleString(
              "id-ID"
            )} unit`}
      </strong>
    </div>
  );
}


/* ============================================================
   HISTORY
============================================================ */

function History({ toast, userRole = "admin" }) {
  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [pulse, setPulse] =
    useState(false);

  const load = async () => {
    setLoading(true);

    try {
      const r =
        await api(
          "/stock/movements"
        );

      setRows(r.data);
    } catch (e) {
      toast(
        e.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const refresh = async () => {
    setPulse(true);

    await load();

    setTimeout(() => {
      setPulse(false);
    }, 650);
  };

  return (
    <Page
      title="Riwayat Stok"
      subtitle="Semua transaksi stok masuk dan barang terjual."
      action={
        <button
          className="ghost"
          onClick={refresh}
          disabled={loading}
        >
          {loading
            ? "Memuat..."
            : "↻ Refresh"}
        </button>
      }
    >
      <div
        className={
          pulse
            ? "page-pulse"
            : ""
        }
      >
        <MovementTable
          rows={rows}
          type="MIXED"
          showSales={false}
          userRole={userRole}
        />
      </div>
    </Page>
  );
}


/* ============================================================
   COMMON
============================================================ */

function StockPage() {
  return null;
}

function Page({
  title,
  subtitle,
  action,
  children
}) {
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        {action}
      </div>

      {children}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={e =>
        e.target ===
          e.currentTarget &&
        onClose()
      }
    >
      <div className="modal">
        <div className="modal-head">
          <h2>{title}</h2>

          <button
            onClick={onClose}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="empty">
      {text}
    </div>
  );
}


/* ============================================================
   APP
============================================================ */

function App() {
  const [user, setUser] =
    useState(() =>
      JSON.parse(
        localStorage.getItem(
          "user"
        ) || "null"
      )
    );
  const [guestMode, setGuestMode] =
  useState(false);
  const [page, setPage] =
    useState(() => {
      const savedUser =
        JSON.parse(
          localStorage.getItem(
            "user"
          ) || "null"
        );

      if (
        savedUser?.role ===
        "staff"
      ) {
        return "products";
      }

      if (
        savedUser?.role ===
        "guest"
      ) {
        return "products";
      }

      return "dashboard";
    });

  const [toastMsg, setToastMsg] =
    useState(null);

  const [theme, setTheme] =
    useState(
      () =>
        localStorage.getItem(
          "jc-theme"
        ) || "light"
    );

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark-mode",
      theme === "dark"
    );

    localStorage.setItem(
      "jc-theme",
      theme
    );
  }, [theme]);

  useEffect(() => {
    const handler = () =>
      setTheme(current =>
        current === "dark"
          ? "light"
          : "dark"
      );

    window.addEventListener(
      "jc-theme-toggle",
      handler
    );

    return () =>
      window.removeEventListener(
        "jc-theme-toggle",
        handler
      );
  }, []);

  function toast(
    message,
    type = "success"
  ) {
    setToastMsg({
      message,
      type
    });

    clearTimeout(
      window.__jcToast
    );

    window.__jcToast =
      setTimeout(() => {
        setToastMsg(null);
      }, 3200);
  }

  function logout() {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    setUser(null);
    setPage("dashboard");
  }

  function exitGuestCatalog() {
    setUser(null);
    setPage("dashboard");
  }

  if (!user) {
  if (guestMode) {
    return (
      <GuestCatalog
        onBack={() =>
          setGuestMode(false)
        }
      />
    );
  }

  return (
    <Login
      onLogin={nextUser => {
        setUser(nextUser);
        setGuestMode(false);

        setPage(
          nextUser?.role === "staff"
            ? "products"
            : "dashboard"
        );
      }}
          onGuest={() =>
          setGuestMode(true)
        }
      />
    );
  }

  const isAdmin =
    user.role === "admin";
  const isStaff =
    user.role === "staff";
  const isGuest =
    user.role === "guest";

  const safePage = isGuest
    ? "products"
    : isStaff &&
        !staffAllowedPages.has(
          page
        )
      ? "products"
      : page;

  let body;

  if (
    safePage === "dashboard" &&
    isAdmin
  ) {
    body = (
      <Dashboard
        go={setPage}
        theme={theme}
      />
    );
  } else if (
    safePage === "products"
  ) {
    body = (
      <Products
        user={user}
        toast={toast}
        onExitGuest={
          exitGuestCatalog
        }
      />
    );
  } else if (
    safePage === "add-product" &&
    isAdmin
  ) {
    body = (
      <AddProduct
        toast={toast}
      />
    );
  } else if (
    safePage === "in" &&
    (isAdmin || isStaff)
  ) {
    body = (
      <StockIn
        toast={toast}
        userRole={user.role}
      />
    );
  } else if (
    safePage === "sold" &&
    (isAdmin || isStaff)
  ) {
    body = (
      <Sold
        toast={toast}
        userRole={user.role}
      />
    );
  } else if (
    safePage === "history" &&
    (isAdmin || isStaff)
  ) {
    body = (
      <History
        toast={toast}
        userRole={user.role}
      />
    );
  } else {
    body = (
      <Products
        user={user}
        toast={toast}
        onExitGuest={
          exitGuestCatalog
        }
      />
    );
  }

  return (
    <Layout
      page={safePage}
      setPage={setPage}
      user={user}
      onLogout={logout}
    >
      {body}

      {toastMsg && (
        <div
          className={`toast ${toastMsg.type}`}
        >
          {toastMsg.message}
        </div>
      )}
    </Layout>
  );
}

createRoot(
  document.getElementById("root")
).render(<App />);