```md
# Payment Gateway (UPI + Card) + Hosted Checkout

A Dockerized payment gateway simulation (Razorpay/Stripe-style) that lets **merchants** create orders and accept **UPI/Card** payments, and lets **customers** complete payments on a hosted checkout page.

---

## Tech Stack

- Backend: Node.js, Express
- Database: PostgreSQL
- Frontend Dashboard: React (served via Nginx)
- Checkout Page: React (served via Nginx)
- Containerization: Docker, Docker Compose

---

## High-Level Architecture

### Services (Docker)
- `postgres` (PostgreSQL DB) — persists merchants, orders, payments
- `api` (Node/Express) — REST API, validations, payment simulation, DB access
- `dashboard` (React UI) — merchant dashboard (API creds + transactions)
- `checkout` (React UI) — hosted checkout page for customers

### Flow Overview
1. Merchant creates an **Order** via API using API Key/Secret headers.
2. Customer opens hosted checkout: `/checkout?orderid=...`
3. Checkout creates a **Payment** (UPI/Card), API sets status to `processing`.
4. API waits (delay), then updates payment status to `success` or `failed`.
5. Checkout polls payment status and shows Success/Failure UI.

---

## Features Implemented

- Merchant API authentication using headers:
  - `X-Api-Key`
  - `X-Api-Secret`
- Order:
  - Create Order
  - Get Order by ID
- Payments:
  - Create Payment (UPI/Card)
  - Get Payment by ID
  - Validation:
    - UPI VPA format validation
    - Card Luhn check
    - Card network detection
    - Expiry validation
  - Status lifecycle: `processing -> success/failed`
- Deterministic Test Mode for evaluation:
  - `TESTMODE=true`
  - `TESTPAYMENTSUCCESS=true|false`
  - `TESTPROCESSINGDELAY=1000` (ms)

---

## Folder Structure (Example)

```text
payment-gateway/
  docker-compose.yml
  README.md
  .env.example
  backend/
    Dockerfile
    package.json
    src/...
  frontend/
    Dockerfile
    package.json
    src/...
  checkout-page/
    Dockerfile
    package.json
    src/...
```

---

## Setup & Run (Docker)

### Prerequisites
- Docker
- Docker Compose

### Start the full project
From project root:

```bash
docker-compose up -d --build
```

### Services & Ports
- API: `http://localhost:8000`
- Dashboard: `http://localhost:3000`
- Checkout: `http://localhost:3001`

### Stop
```bash
docker-compose down
```

---

## Environment Variables

Create an `.env.example` (or ensure values are configured in `docker-compose.yml`).

### Minimum required (recommended)
```env
PORT=8000
DATABASE_URL=postgresql://gatewayuser:gatewaypass@postgres:5432/paymentgateway

# Seed test merchant (used by evaluator + dashboard)
TESTMERCHANTEMAIL=test@example.com
TESTAPIKEY=keytestabc123
TESTAPISECRET=secrettestxyz789

# Test mode for deterministic evaluation
TESTMODE=true
TESTPAYMENTSUCCESS=true
TESTPROCESSINGDELAY=1000
```

Notes:
- When `TESTMODE=true`, payment outcome is forced by `TESTPAYMENTSUCCESS`.
- When `TESTMODE=false`, payment success is random:
  - UPI: 90% success
  - Card: 95% success

---

## Seeded Test Merchant

On API startup, the backend seeds a test merchant if not already present:

- Email: `test@example.com`
- API Key: `key_test_abc123`
- API Secret: `secret_test_xyz789`

This merchant is used for API testing and dashboard login.

---

## API Usage

Base URL:
```text
http://localhost:8000
```

### 1) Health Check (No Auth)
```http
GET /health
```

### 2) Create Order (Auth required)
```http
POST /api/v1/orders
X-Api-Key: key_test_abc123
X-Api-Secret: secret_test_xyz789
Content-Type: application/json
```

Body:
```json
{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt123",
  "notes": { "customername": "John Doe" }
}
```

### 3) Get Order (Auth required)
```http
GET /api/v1/orders/:orderid
X-Api-Key: key_test_abc123
X-Api-Secret: secret_test_xyz789
```

### 4) Create Payment (Auth required)
```http
POST /api/v1/payments
X-Api-Key: key_test_abc123
X-Api-Secret: secret_test_xyz789
Content-Type: application/json
```

UPI body:
```json
{
  "orderid": "orderXXXXXXXXXXXXXXXX",
  "method": "upi",
  "vpa": "user@paytm"
}
```

Card body:
```json
{
  "orderid": "orderXXXXXXXXXXXXXXXX",
  "method": "card",
  "card": {
    "number": "4111111111111111",
    "expirymonth": 12,
    "expiryyear": 2027,
    "cvv": "123",
    "holdername": "John Doe"
  }
}
```

### 5) Get Payment (Auth required)
```http
GET /api/v1/payments/:paymentid
X-Api-Key: key_test_abc123
X-Api-Secret: secret_test_xyz789
```

### 6) Test Merchant Endpoint (No Auth)
```http
GET /api/v1/test/merchant
```

---

## Checkout Page Usage (Customer)

Open in browser:
```text
http://localhost:3001/checkout?orderid=<ORDER_ID>
```

Steps:
1. Create an order via API.
2. Paste the order id in checkout URL.
3. Select UPI/Card method.
4. Submit payment.
5. Page shows Processing, then Success/Failure.

---

## Dashboard Usage (Merchant)

Open:
```text
http://localhost:3000
```

Login:
- Email: `test@example.com`
- Password: any (password is not validated)

Dashboard shows:
- API Key/Secret
- Transactions list and summary stats

---

## Common Troubleshooting

- If database connection fails inside Docker:
  - Ensure `DATABASE_URL` uses host `postgres` (service name), not `localhost`.
- If frontend routes refresh to 404:
  - Ensure nginx config uses `try_files $uri /index.html;` for SPA routing.
- If payments always succeed:
  - Verify `TESTMODE` and `TESTPAYMENTSUCCESS` env values (in container).

---

## How to Verify Quickly

1. `GET /health` should return healthy + database connected.
2. Create order using headers.
3. Create payment for that order.
4. Open checkout page using the order id and complete payment.
5. Check dashboard transactions.

---
```