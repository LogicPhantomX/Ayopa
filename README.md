# 🐄 Ayopa Marketplace Backend

<p align="center">

![NestJS](https://img.shields.io/badge/NestJS-v11-E0234E?style=for-the-badge&logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?style=for-the-badge&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker)
![License](https://img.shields.io/badge/License-Private-black?style=for-the-badge)

</p>

---

## 📖 Overview

**Ayopa Marketplace Backend** powers **Ayopa**, a secure Nigerian livestock marketplace that enables buyers and sellers to trade with confidence using **escrow payments**, **identity verification**, **role-based administration**, and **dispute resolution**.

The platform is designed with security, scalability, and maintainability in mind, following modern backend architecture and enterprise development practices.

---

## 🔗 Monorepo layout (frontend + backend merged)

This repo now contains both halves of Ayopá:

```
apps/
  api/   ← this NestJS backend (unchanged)
  web/   ← the React/Vite frontend (moved in from the AI Studio export)
packages/
  shared/
```

**Running both together locally:**

```bash
npm install                      # installs all workspaces (root, apps/api, apps/web)
cp .env.example .env             # fill in real secrets — see required vars below
npm run migration:run
npm run dev:all                  # starts the API on :3000 and the web app on :5173
```

Or separately: `npm run dev` (API only) / `npm run dev:web` (frontend only).

The frontend talks to the backend over HTTP using `VITE_API_BASE_URL` (see
`apps/web/.env.example`), defaulting to `http://localhost:3000/v1` — this
matches the API's URI versioning (`/v1/...`, no global prefix) confirmed in
`apps/api/src/main.ts`. The frontend's dev server was moved to port 5173 so
it no longer collides with the API's default port 3000.

Every endpoint the frontend's `src/api/liveAdapter.ts` calls
(`/auth/otp/request`, `/auth/otp/verify`, `/auth/profile/setup`,
`/auth/refresh`, `/users/me`, `/listings`, `/transactions`,
`/escrow/:id/transition`, `/paystack/initialize`, `/paystack/verify/:reference`,
`/disputes`) was checked against the matching controller in `apps/api` and
lines up on path and payload shape.

⚠️ `docs/GAP_ANALYSIS.md` is stale — it describes an `AuthController` that
was later fixed. Worth deleting or refreshing so it doesn't mislead the next
person (or AI) working on this repo.

---

# ✨ Core Features

## 🔐 Authentication & Security

- Phone OTP Authentication
- Email Authentication
- RS256 JWT Authentication
- Refresh Token Rotation
- Admin TOTP Authentication
- Account Lockout Protection
- Rate Limiting
- Role-Based Access Control (RBAC)
- Append-Only Audit Logging

---

## 🛒 Marketplace

- Buyer & Seller Accounts
- Livestock Listings
- Search & Filtering
- Categories
- Soft Delete Support
- Transaction History

---

## 💰 Escrow System

- Secure Escrow Transactions
- Escrow State Machine
- Automatic 48-Hour Release
- Partial Release
- Final Release
- Refund Handling
- Escrow Freeze During Disputes

---

## 💳 Payments

Integrated with **Paystack**

Supports:

- Transaction Initialization
- Transaction Verification
- Webhook Verification (HMAC SHA512)
- Bank Listing
- Transfer Recipients
- Payout Transfers
- Dual Approval for High-Value Payouts

---

## 🪪 KYC

- Seller Verification
- PAR Upload Flow
- OCI-Ready Document Storage
- Identity Verification Stubs
- Full Audit Trail

---

## ⚖️ Dispute Resolution

- Raise Dispute
- Seller Response Window
- Evidence Submission
- Admin Resolution
- Buyer Refund
- Seller Release
- Single Appeal Enforcement

---

## 📊 Audit & Compliance

- Immutable Audit Logs
- Repository-Level RBAC
- Environment Validation
- Production Redis Enforcement
- Soft Deletes
- Full Activity Tracking

---

# 🏗️ Tech Stack

| Technology | Purpose |
|------------|---------|
| NestJS | Backend Framework |
| TypeScript | Programming Language |
| PostgreSQL | Primary Database |
| Redis | OTP & Token Storage |
| TypeORM | ORM |
| JWT (RS256) | Authentication |
| Paystack | Payment Processing |
| Docker | Local Development |
| Jest | Testing |
| Swagger | API Documentation |

---

# 🏛️ System Architecture

```text
                     Client Applications
                             │
              ┌──────────────┴──────────────┐
              │                             │
       Web Frontend                  Admin Dashboard
              │                             │
              └──────────────┬──────────────┘
                             │
                     NestJS REST API
                             │
 ┌───────────────┬───────────────┬───────────────┐
 │               │               │               │
PostgreSQL     Redis         Paystack       SMS / Email
```

---

# 📂 Project Structure

```text
apps/
└── api/
    ├── src/
    │   ├── common/
    │   ├── config/
    │   ├── database/
    │   ├── health/
    │   ├── modules/
    │   │   ├── auth/
    │   │   ├── users/
    │   │   ├── listings/
    │   │   ├── transactions/
    │   │   ├── payments/
    │   │   ├── escrow/
    │   │   ├── paystack/
    │   │   ├── disputes/
    │   │   ├── kyc/
    │   │   └── audit/
    │   ├── app.module.ts
    │   └── main.ts
    └── package.json
```

---

# 🚀 Getting Started

## Clone

```bash
git clone https://github.com/Lagosboy006/Ayopa-backend.git

cd Ayopa-backend
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Environment

Copy the example file.

```bash
cp .env.example .env
```

Fill in the required environment variables.

---

## Generate JWT Keys

```bash
openssl genrsa -out private.pem 2048

openssl rsa -in private.pem -pubout -out public.pem
```

Copy both keys into your `.env`.

---

## Start PostgreSQL & Redis

```bash
docker compose up -d postgres redis
```

---

## Run Database Migrations

```bash
npm run migration:run --workspace apps/api
```

---

## Start Development Server

```bash
npm run dev
```

---

# 🌐 API Documentation

Swagger is available when running locally.

```
http://localhost:3000/docs
```

---

# 🔑 Required Environment Variables

## Database

```text
DATABASE_URL
```

or

```text
DB_HOST
DB_PORT
DB_USERNAME
DB_PASSWORD
DB_NAME
```

---

## Authentication

```text
JWT_PRIVATE_KEY
JWT_PUBLIC_KEY
JWT_TTL
```

---

## Redis

```text
REDIS_URL
```

---

## Paystack

```text
PAYSTACK_SECRET_KEY
PAYSTACK_WEBHOOK_SECRET
```

---

## Communication

```text
SMS_API_KEY
EMAIL_FROM
```

---

# 👥 User Roles

- Buyer
- Seller
- Provisional User
- Administrator
- Finance Officer
- Verification Agent

Role-based access control is enforced throughout the application.

---

# 📱 Authentication Flow

```text
Request OTP
      │
      ▼
Verify OTP
      │
      ▼
Existing User?
 ┌───────────────┐
 │               │
Yes             No
 │               │
 ▼               ▼
Login      Create Provisional User
                 │
                 ▼
         Complete Profile
                 │
                 ▼
          Buyer / Seller
                 │
                 ▼
        Marketplace Access
```

---

# 💸 Escrow Workflow

```text
Listing Created
        │
        ▼
Buyer Places Order
        │
        ▼
Payment Verified
        │
        ▼
Funds Held in Escrow
        │
        ▼
Seller Delivers
        │
        ▼
Buyer Confirms
        │
        ▼
Funds Released

OR

Buyer Opens Dispute
        │
        ▼
Admin Resolution
        │
        ▼
Refund / Release
```

---

# 🧪 Testing

Run all tests:

```bash
npm run test --workspace apps/api
```

Run build:

```bash
npm run build
```

### Current Verification Status

| Metric | Status |
|--------|--------|
| Test Suites | ✅ 13 Passed |
| Tests | ✅ 86 Passed |
| Skipped | 1 (Live PostgreSQL Only) |
| Build | ✅ Successful |
| TypeScript | ✅ Clean Compile |

---

# 🔒 Security Features

- RS256 JWT Authentication
- Refresh Token Rotation
- Redis-backed OTP Storage
- Admin TOTP Authentication
- Account Lockout Protection
- Append-Only Audit Logging
- Rate Limiting
- Soft Deletes
- Environment Validation
- Webhook Signature Verification

---

# 🚀 Deployment Checklist

- Configure PostgreSQL
- Configure Redis
- Configure Paystack
- Configure SMTP
- Configure SMS Provider
- Generate JWT RS256 Keys
- Run Database Migrations
- Configure Environment Variables
- Start Application

---

# 🤝 Contributing

This repository is currently private.

Contributors should:

1. Create a feature branch.
2. Follow the existing coding standards.
3. Ensure all tests pass.
4. Submit a Pull Request for review.

---

# 📄 License

This project is proprietary and confidential.

Copyright © Ayopa Marketplace.

All rights reserved.
