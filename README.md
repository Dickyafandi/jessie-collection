# Jessie Collection

Full-stack inventory, stock movement, sales tracking, and public ready-stock catalog for Jessie Collection.

## Overview
Jessie Collection is a web-based inventory system for an apparel business. It separates access between Admin, Staff, and public visitors so operational users can manage stock without being exposed to financial reporting.

## Features

### Admin
- Dashboard with total product codes and stock overview
- Brand stock distribution with pie chart
- Monthly sales and revenue reporting
- Monthly sales export to Excel
- Product management and descriptions
- Stock in / stock out recording
- Full stock movement history
- Financial visibility

### Staff
- Product catalog and stock availability
- Stock in recording
- Stock out / sales recording
- Stock movement history
- No dashboard access
- No financial values in history views

### Public Catalog
- No login required
- Ready-stock products only
- Search by code, brand, or description
- Stock visibility without internal financial data
- Direct WhatsApp inquiry

## Tech Stack

### Frontend
- React
- Vite
- JavaScript (JSX)
- CSS
- XLSX for Excel export

### Backend
- Node.js
- Express
- REST API
- JWT-based authentication
- MySQL

## Access Model

| Role | Dashboard | Products | Stock In | Stock Out | History | Financial Data |
|---|---:|---:|---:|---:|---:|---:|
| Admin | Yes | Yes | Yes | Yes | Yes | Yes |
| Staff | No | Yes | Yes | Yes | Yes | No |
| Guest | No | Catalog only | No | No | No | No |

## Local Development

### Backend
```bash
cd backend
npm install
node server.js
```

Backend:
`http://localhost:3000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend:
`http://localhost:5173`

## Environment Variables

Do not commit real environment values.

Example:
```env
PORT=3000
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET=
```

## Production Deployment Plan

```text
Vercel
  |
  | HTTPS
  v
Express API
  |
  v
Managed MySQL
```

The frontend must use a production API URL instead of `http://localhost:3000/api`.

## Security Before Production

1. Keep `.env` and credentials out of Git.
2. Enforce Admin/Staff authorization in the backend.
3. Restrict CORS to the production frontend domain.
4. Use HTTPS for frontend and API.
5. Add rate limiting to authentication endpoints.
6. Validate request bodies on product and stock endpoints.
7. Use an expiring JWT or secure cookie-based session strategy.
8. Never return financial fields to Staff/Public endpoints.
9. Never expose the database directly to the browser.
10. Never print secrets or tokens in logs.

## Portfolio

Suggested title:

**Jessie Collection — Inventory & Sales Management System**

Suggested stack line:

`React · Vite · Node.js · Express · MySQL · REST API · JWT`

Add screenshots of:
- Admin dashboard
- Staff inventory view
- Public ready-stock catalog
- Login page

## Status

Under active development and being prepared for production deployment and portfolio presentation.

## Author

**Dickyafandi**

GitHub: https://github.com/Dickyafandi
