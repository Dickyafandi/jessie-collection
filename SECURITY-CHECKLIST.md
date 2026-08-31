# Production Security Checklist

## Secrets
- [ ] `.env` is ignored by Git
- [ ] No database password is committed
- [ ] No JWT secret is committed
- [ ] Production secrets live only in hosting environment variables

## API
- [ ] Public catalog exposes only brand, code, description, and available stock
- [ ] Staff cannot access admin dashboard/summary endpoints
- [ ] Staff cannot create, update, or delete products unless explicitly intended
- [ ] Staff history does not include cost price, sale price, totals, or revenue
- [ ] Authentication endpoints have rate limiting
- [ ] Product and stock inputs are validated
- [ ] CORS is restricted to the production frontend origin

## Database
- [ ] Database is not accessed directly from the browser
- [ ] Production database is private/managed
- [ ] Database credentials are stored as environment variables
- [ ] Backups are enabled

## Frontend
- [ ] Production API URL does not use localhost
- [ ] No secrets are embedded in client-side JavaScript
- [ ] HTTPS is enabled
- [ ] Guest catalog does not expose internal fields

## Authentication
- [ ] JWT has an expiration time
- [ ] Passwords are hashed
- [ ] Consider secure HttpOnly cookies for long-lived authentication instead of localStorage
