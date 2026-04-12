# Inventory Management System

A production-grade, full-stack inventory management and point-of-sale (POS) application with OCR bill extraction, credit-based sales tracking, and real-time analytics.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [Workflows](#workflows)
- [Async Processing](#async-processing)
- [Environment Setup](#environment-setup)
- [Getting Started](#getting-started)
- [Key Engineering Decisions](#key-engineering-decisions)
- [Limitations & TODOs](#limitations--todos)

---

## Overview

### What It Does

This system manages a retail/wholesale business with:

- **Inventory Management**: Track products by barcode, stock levels, pricing, and categories with low-stock alerts
- **Sales & Billing**: Real-time POS with cash and credit payment modes, invoice generation, and item deduction
- **Customer Credit System**: Optional credit sales with automatic due tracking, overdue detection, and credit ledger management
- **OCR Bill Extraction**: Parse bill images using PaddleOCR to auto-fill inventory items
- **Report Generation**: Async job-based CSV reports (sales, inventory, customer, daily summary)
- **Dashboard Analytics**: Real-time KPIs (today's sales, items sold, cash vs. credit split, low-stock alerts)
- **Real-time Notifications**: WebSocket-based event streaming for report completion and alerts

### Use Cases

1. **Retail Shop Owner**: Manage inventory daily, process sales, track customer credit
2. **Wholesale Business**: Bulk sales, credit management, analytics dashboard
3. **Multi-user Shop**: Each user sees isolated inventory and sales data
4. **Reporting**: Generate periodic reports for accounting and inventory reconciliation

---

## Architecture

### High-Level View

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                       │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐      │
│  │ Sales    │ Inv.     │ Customers│Dashboard │Reports  │      │
│  │ (React)  │ Manager  │ Credit   │ (KPIs)   │ Gen.    │      │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘      │
│          ↓ TanStack Query (React Query) ↓                      │
└─────────────────────────────────────────────────────────────────┘
                           ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                            │
│  Clerk Auth Middleware → User Isolation via userId             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ API Layer (v1)                                           │  │
│  │ ├─ Inventory (CRUD, filters, search, low-stock)         │  │
│  │ ├─ Sales (create invoice, deduct stock, payment method) │  │
│  │ ├─ Customers (CRUD, credit ledger management)           │  │
│  │ ├─ Dashboard (KPI aggregation, low-stock list)          │  │
│  │ ├─ Reports (trigger async gen, download)               │  │
│  │ ├─ Notifications (list, read status, WebSocket events)  │  │
│  │ └─ Realtime (WebSocket, event streaming)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Services                                                 │  │
│  │ ├─ bill_extraction.py (PaddleOCR for image parsing)     │  │
│  │ ├─ cloudinary_service.py (bill image uploads)           │  │
│  │ ├─ openrouter_service.py (LLM for report structuring)   │  │
│  │ ├─ realtime.py (Redis pub/sub for events)               │  │
│  │ └─ seed_data.py (demo data generation)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Data Access                                              │  │
│  │ ├─ MongoDB (sales, inventory, customers, credit ledger) │  │
│  │ ├─ Redis (session cache, event subscriptions)           │  │
│  │ └─ Cloudinary (bill image storage)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                    ↓ RabbitMQ (Celery Broker)
┌─────────────────────────────────────────────────────────────────┐
│              Async Workers (Celery)                             │
│  ├─ report_generation_task (fetch data → LLM → CSV → notify)   │
│  └─ retry logic (3 max retries, 10s delay, dead letter)        │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interactions

**Sales Flow:**
1. Frontend sends `CreateSaleRequest` (items, payment method,  customer)
2. Backend validates inventory availability per item
3. Stock deducted from `inventory_items` collection
4. Invoice created in `sales_invoices` collection
5. If **credit** payment: `credit_ledger` entry created/updated
6. If **cash**: sale finalized immediately
7. Notification published via Redis (real-time event)
8. Frontend receives updated inventory state via React Query

**Report Generation Flow:**
1. Frontend calls `POST /dashboard/reports/generate` (type, dateRange)
2. Backend creates report doc (status: "queued") → returns 202 Accepted
3. Celery task pushed to RabbitMQ
4. Worker fetches data (sales, inventory, customers) → calls OpenRouter LLM
5. LLM structures data → CSV generated → stored in `generated_reports/`
6. Report status updated to "completed"
7. Redis pub/sub publishes completion event
8. WebSocket broadcasts to user → notification badge
9. Report downloadable via signed URL

**Real-time Events:**
- Redis pub/sub channel: `realtime_events`
- Events trigger via `publish_realtime_event(user_id, event_type, data)`
- WebSocket listener (`listen_for_realtime_events`) reads channel
- `RealtimeConnectionManager` dispatches to connected sockets
- Event types: `notification`, `report_completed`, `inventory_updated`

---

## Core Features

### 1. Inventory Management
- **CRUD**: Create, read, update, delete products
- **Barcode-based tracking**: Validate barcode uniqueness (userId + barcode index)
- **Stock management**: Manual stock updates, deduction on sales
- **Filtering**: Search by name/barcode, filter by category, low-stock flag
- **Categories**: Dynamic category extraction from inventory

### 2. Sales & Invoicing
- **Invoice generation**: Unique ID format `INV-YYYYMMDD-XXXXX`
- **Payment modes**: 
  - **Cash**: Deduct stock, finalize immediately
  - **Credit**: Track due amount,  `creditUntil` date
- **Cart logic**: Multi-item support, line-item totals, discounts
- **Stock deduction**: Atomic per sale (fails if insufficient stock)

### 3. Customer Credit System
- **Credit ledger**: Track issued credit, outstanding balance, invoices
- **Credit status**: `clear` (no balance), `due` (balance + valid until), `overdue` (date passed)
- **Manual override**: `status` field allows explicit status set (overrides auto-calculation)
- **Metrics**: Total customers, customers with due, total outstanding, overdue count

### 4. OCR Bill Extraction
- **PaddleOCR**: Local OCR (no external API calls), supports English
- **Table parsing**: Detects bill structure, identifies item table headers/boundaries
- **Row extraction**: Normalizes columns, filters header rows, returns structured data
- **Images**: Uploaded to Cloudinary; local OCR processes downloaded files

### 5. Report Generation
- **Types**: Sales (all invoices), Inventory (product snapshots), Customer (customer + credit), Daily Summary (metrics)
- **Date range**: User-specified start/end dates
- **Async generation**: Celery job with max 3 retries, 10s retry delay
- **CSV output**: Generated and stored at `/app/generated_reports/{userId}/report_*.csv`
- **LLM structuring**: OpenRouter API structures raw data into report rows
- **Downloadable**: Direct file download via `/dashboard/reports/{report_id}/download`

### 6. Dashboard Analytics
- **KPI Metrics**:
  - Today's sales total (today only, UTC-based)
  - Items sold count
  - Total transactions
  - Cash vs. Credit split
- **Low-stock alerts**: List products where `stock <= lowStockThreshold`
- **Recent reports**: List generated reports (limit: 10)

### 7. Real-time Notifications
- **WebSocket**: Persistent connection for real-time events
- **Event types**: `report_ready`, `error`, `info`, custom types
- **Storage**: Notifications collection with `isRead` flag
- **Pub/sub**: Redis channel broadcasts to all active connections for a user
- **Graceful degradation**: Events logged but not blocking if Redis unavailable

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.1.7 (React 19.2.3)
- **State management**: TanStack Query 5.90.21 (server state)
- **Forms**: React Hook Form 7.71.2 + Zod 4.3.6 validation
- **Styling**: Tailwind CSS 4 + CSS Modules
- **HTTP Client**: Axios 1.13.6
- **Auth**: Clerk NextJS 7.0.5
- **Icons**: Lucide React 0.577.0
- **PDF Export**: jsPDF 4.2.1 + html2canvas 1.4.1
- **Animation**: Motion 12.38.0
- **Theme**: next-themes 0.4.6

### Backend
- **Framework**: FastAPI (async/await with Starlette)
- **Server**: Uvicorn (containerized)
- **Database**: MongoDB (Motor async driver)
- **Cache/Broker**: Redis (session, pub/sub, Celery result backend)
- **Message Queue**: RabbitMQ (Celery broker)
- **Task Queue**: Celery (async task execution)
- **Auth**: Clerk JWT verification
- **Image Storage**: Cloudinary (URL-based CDN)
- **OCR**: PaddleOCR (local, pre-trained models)
- **LLM Integration**: OpenRouter API (structured data generation)

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx 
- **Database**: MongoDB Atlas (or self-hosted)
- **Cache**: Redis 7-alpine
- **Message Queue**: RabbitMQ 3-management

---

## Project Structure

```
Inventory Management/
├── docker-compose.yml              # Service definitions (frontend, backend, redis, rabbitmq)
├── nginx/                          # Reverse proxy config 
│
├── frontend/                       # Next.js React app
│   ├── app/                        # App router & pages
│   │   ├── page.tsx               # Home/landing page
│   │   └── dashboard/             # Dashboard layout & pages
│   │       ├── sales/             # Sales & invoicing UI
│   │       ├── inventory/         # Inventory manager
│   │       ├── customers/         # Customer credit manager
│   │       ├── reports/           # Report generation & history
│   │       └── settings/          # App settings
│   ├── components/                # React components
│   │   ├── dashboard/             # Dashboard-specific components
│   │   ├── onboarding/            # Onboarding dialogs
│   │   └── ui/                    # Reusable UI primitives
│   ├── lib/                       # Business logic (no React)
│   │   ├── api/                   # HTTP client & API functions
│   │   │   ├── sales.ts           # Sales API client
│   │   │   ├── inventory.ts       # Inventory API client
│   │   │   ├── customers.ts       # Customer API client
│   │   │   ├── dashboard.ts       # Dashboard API client
│   │   │   ├── notifications.ts   # Notification API client
│   │   │   ├── seed.ts            # Seed data API
│   │   │   └── http-client.ts     # Axios instance with auth interceptor
│   │   ├── contracts/             # TypeScript interfaces (MongoDB-first DTOs)
│   │   │   ├── sales.ts           # Invoice, CartItem, Customer types
│   │   │   ├── inventory.ts       # Product types
│   │   │   ├── customers.ts       # Customer & CreditLedger types
│   │   │   ├── dashboard.ts       # KPI, Report types
│   │   │   ├── notifications.ts   # Notification types
│   │   │   ├── health.ts          # Health check response
│   │   │   └── common.ts          # Base types (MongoEntityBase, Pagination)
│   │   ├── queries/               # React Query hooks
│   │   │   ├── use-sales-query.ts
│   │   │   ├── use-inventory-query.ts
│   │   │   ├── use-customers-query.ts
│   │   │   └── query-keys.ts      # Query key factory
│   │   ├── forms/                 # Zod schemas + form defaults
│   │   │   ├── sales.ts           # Sales form schema
│   │   │   ├── inventory.ts       # Inventory form schema
│   │   │   └── dashboard.ts       # Report generation schema
│   │   ├── mappers/               # Data transformation
│   │   │   ├── dashboard-mappers.ts
│   │   │   └── sales-mappers.ts
│   │   ├── demo/                  # Fallback demo data
│   │   │   ├── sales-sample-data.ts
│   │   │   ├── inventory-sample-data.ts
│   │   │   └── dashboard-sample-data.ts
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── utils/                 # Utility functions
│   │   └── config/                # App configuration
│   ├── public/                    # Static assets
│   └── package.json
│
├── backend/                       # FastAPI Python app
│   ├── Dockerfile                 # Python container config
│   ├── requirements.txt           # Python dependencies
│   ├── main.py                    # Entry point (imports from app.main)
│   ├── app/
│   │   ├── main.py                # FastAPI app setup (lifespan, middleware, routers)
│   │   │
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── router.py       # Main router aggregation
│   │   │   │   └── endpoints/      # Route handlers by domain
│   │   │   │       ├── health.py   # GET health check
│   │   │   │       ├── inventory.py # Inventory CRUD & search
│   │   │   │       ├── sales.py    # Sales create, history, invoice retrieval
│   │   │   │       ├── customers.py # Customer & credit ledger management
│   │   │   │       ├── dashboard.py # KPI, low-stock, reports, generation
│   │   │   │       ├── notifications.py # List, read notifications
│   │   │   │       ├── realtime.py # WebSocket event streaming
│   │   │   │       └── seed.py     # Data seeding for demos
│   │   │   └── deps.py             # Dependency injection (get_mongo_db, etc.)
│   │   │
│   │   ├── core/
│   │   │   ├── config.py           # Settings (Pydantic BaseSettings)
│   │   │   ├── middleware.py       # ClerkAuthMiddleware (JWT verification)
│   │   │   ├── jwt.py              # Clerk JWT verification logic
│   │   │   └── celery_app.py       # Celery instance & config (RabbitMQ broker)
│   │   │
│   │   ├── db/
│   │   │   ├── mongo.py            # Motor async MongoDB connection
│   │   │   └── redis.py            # Redis async connection
│   │   │
│   │   ├── models/                 # (empty—schemas are the DTOs)
│   │   │
│   │   ├── schemas/                # Pydantic models (request/response DTOs)
│   │   │   ├── inventory.py       # InventoryProduct, requests
│   │   │   ├── sales.py           # Invoice, CartItem, CreateSaleRequest
│   │   │   ├── customers.py       # Customer, CreditLedger, requests
│   │   │   ├── dashboard.py       # KPI, Report, GenerateReportRequest
│   │   │   └── notifications.py   # NotificationItem
│   │   │
│   │   ├── services/               # Business logic & external integrations
│   │   │   ├── bill_extraction.py  # PaddleOCR table parsing
│   │   │   ├── cloudinary_service.py # Image upload to CDN
│   │   │   ├── openrouter_service.py # LLM API for report structuring
│   │   │   ├── realtime.py         # Redis pub/sub & WebSocket manager
│   │   │   └── seed_data.py        # Sample data generation
│   │   │
│   │   ├── workers/                # Celery async tasks
│   │   │   └── report_tasks.py     # generate_report_task (fetch data → LLM → CSV)
│   │   │
│   │   └── utils/                  # (reserved for future utilities)
│   │
│   ├── Default_models/            # Pre-trained OCR models
│   │   ├── det/                    # Detection model files
│   │   │   ├── inference.pdmodel
│   │   │   ├── inference.pdiparams
│   │   │   └── inference.pdiparams.info
│   │   └── rec/                    # Recognition model files
│   │       ├── inference.pdmodel
│   │       ├── inference.pdiparams
│   │       └── inference.pdiparams.info
│   │
│   ├── generated_reports/         # Report CSV output directory
│   │   └── {userId}/              # Organized by user
│   │       └── report_*.csv        # Generated reports
│   │
│   └── README.md                  # Backend API documentation
```

---

## Data Models

### Core Collections (MongoDB)

#### 1. **inventory_items**
```json
{
  "_id": ObjectId,
  "userId": "clerk_user_123",
  "name": "Widget A",
  "barcode": "SKU-001",
  "stock": 50,
  "price": 99.99,
  "category": "Widgets",
  "lowStockThreshold": 10,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```
**Indexes**: `(userId, barcode)` unique, `(userId, category)`, `(userId, stock)`, `(userId, updatedAt)`

#### 2. **sales_invoices**
```json
{
  "_id": ObjectId,
  "userId": "clerk_user_123",
  "invoiceId": "INV-20260318-A1B2C",
  "dateTime": ISODate,
  "items": [
    {
      "productId": ObjectId,
      "name": "Widget A",
      "price": 99.99,
      "quantity": 2,
      "stock": 48,
      "itemTotal": 199.98
    }
  ],
  "subtotal": 199.98,
  "discount": 10.00,
  "total": 189.98,
  "paymentMethod": "credit",
  "customerId": ObjectId,
  "customerName": "John Doe",
  "dueAmount": 189.98,
  "creditUntil": ISODate,
  "itemCount": 2,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```
**Indexes**: `(userId, dateTime)`, `(userId, invoiceId)`, `(customerId)`

#### 3. **customers**
```json
{
  "_id": ObjectId,
  "userId": "clerk_user_123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1 555-1234",
  "totalCredit": 5000.00,
  "dueAmount": 1500.00,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```
**Indexes**: `(userId, name)`

#### 4. **credit_ledger**
```json
{
  "_id": ObjectId,
  "userId": "clerk_user_123",
  "customerId": ObjectId,
  "customerName": "John Doe",
  "email": "john@example.com",
  "phone": "+1 555-1234",
  "totalCreditIssued": 5000.00,
  "outstandingCredit": 1500.00,
  "totalCreditInvoices": 8,
  "manualStatus": null,      // Override auto-status: "clear" | "due" | "overdue"
  "creditUntil": ISODate,
  "lastCreditAt": ISODate,
  "lastCreditClearedAt": ISODate,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```
**Indexes**: `(userId, customerId)`, `(userId, status)`

#### 5. **reports**
```json
{
  "_id": ObjectId,
  "userId": "clerk_user_123",
  "name": "Daily Summary - Mar 18, 2026",
  "type": "daily_summary",  // "sales" | "inventory" | "customer" | "daily_summary"
  "generatedAt": ISODate,
  "dateRange": {
    "startDate": "2026-03-17",
    "endDate": "2026-03-18"
  },
  "fileUrl": "/path/to/report_*.csv",
  "fileSize": 262144,
  "status": "completed",   // "queued" | "processing" | "completed" | "failed"
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

#### 6. **notifications**
```json
{
  "_id": ObjectId,
  "userId": "clerk_user_123",
  "type": "report_ready",    // "report_ready" | "error" | "info"
  "message": "Report generated successfully",
  "isRead": false,
  "reportId": ObjectId,      // Optional reference
  "createdAt": ISODate
}
```

---

## API Endpoints

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication
- All endpoints require `Authorization: Bearer <clerk_jwt>`
- Middleware extracts `user_id` and adds to request context
- User isolation enforced at query level (all queries filtered by `userId`)

### Endpoints by Domain

#### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service status (MongoDB, Redis connectivity) |

#### Inventory
| Method | Path | Description | Auth Required |
|--------|------|-------------|---|
| GET | `/inventory` | List products (filters: search, category, lowStockOnly) | ✓ |
| POST | `/inventory` | Create product | ✓ |
| PUT | `/inventory/{product_id}` | Update product details | ✓ |
| PUT | `/inventory/{product_id}/stock` | Update stock quantity | ✓ |
| DELETE | `/inventory/{product_id}` | Delete product | ✓ |

**Query Params:**
- `search`: Filter by name or barcode (regex, case-insensitive)
- `category`: Filter by category
- `lowStockOnly`: Boolean, return only items where stock <= lowStockThreshold

#### Sales
| Method | Path | Description | Auth Required |
|--------|------|-------------|---|
| POST | `/sales` | Create sale/invoice (deduct stock, handle credit) | ✓ |
| GET | `/sales/history` | Get all sales for user | ✓ |
| GET | `/sales/invoices/{invoice_id}` | Get specific invoice | ✓ |

**Request Examples:**

Create Sale (Cash):
```json
{
  "items": [
    { "productId": "id1", "name": "Widget A", "price": 99.99, "quantity": 2, "stock": 50 }
  ],
  "discount": 10.0,
  "paymentMethod": "cash"
}
```

Create Sale (Credit):
```json
{
  "items": [...],
  "discount": 0,
  "paymentMethod": "credit",
  "customerId": "cust_123",
  "customerName": "John Doe",
  "dueAmount": 500.0,
  "creditUntil": "2026-04-01"
}
```

#### Customers
| Method | Path | Description | Auth Required |
|--------|------|-------------|---|
| POST | `/customers` | Create customer | ✓ |
| GET | `/customers` | List all customers | ✓ |
| GET | `/customers/{customer_id}` | Get customer details | ✓ |
| PUT | `/customers/{customer_id}` | Update customer info | ✓ |
| GET | `/customers/credit` | Get credit summary + ledger | ✓ |
| PUT | `/customers/credit/{ledger_id}` | Update credit ledger entry | ✓ |

#### Dashboard
| Method | Path | Description | Auth Required |
|--------|------|-------------|---|
| GET | `/dashboard` | Get KPI, low-stock, recent reports (combined) | ✓ |
| GET | `/dashboard/low-stock?limit=10` | Get low-stock products | ✓ |
| POST | `/dashboard/reports/generate` | Trigger async report generation | ✓ |
| GET | `/dashboard/reports?limit=10` | Get recent reports | ✓ |
| GET | `/dashboard/reports/{report_id}/download` | Download report CSV | ✓ |

**Generate Report Request:**
```json
{
  "type": "sales",
  "startDate": "2026-03-01",
  "endDate": "2026-03-31"
}
```

#### Notifications
| Method | Path | Description | Auth Required |
|--------|------|-------------|---|
| GET | `/notifications?limit=20` | List notifications | ✓ |
| PATCH | `/notifications/{notification_id}/read` | Mark as read | ✓ |
| PATCH | `/notifications/read-all` | Mark all as read | ✓ |

#### Realtime (WebSocket)
| Path | Description | Auth Required |
|------|-------------|---|
| `ws://localhost:8000/api/v1/realtime` | Event stream (notifications, reports, inventory updates) | ✓ |

#### Seed (Development Only)
| Method | Path | Description | Auth Required |
|--------|------|-------------|---|
| POST | `/seed` | Generate sample data (products, customers, invoices) | ✓ |
| DELETE | `/seed` | Clear all seeded data | ✓ |
| GET | `/seed/status` | Check seeded data counts | ✓ |

**Seed Request:**
```json
{
  "num_products": 100,
  "num_customers": 50,
  "num_invoices": 150
}
```

---

## Workflows

### 1. Complete Sales Workflow (Cash)

```
Frontend                          Backend                              MongoDB
   |                                 |                                  |
   +--[POST /sales]------------------>|                                |
   |   (items, discount,              | [Validate user auth]            |
   |    paymentMethod: "cash")        | [Check stock availability]      |
   |                                   | [Deduct stock]                 |
   |                                   |--[UPDATE inventory_items]--->  |
   |                                   |                                 |
   |                                   | [Create invoice]               |
   |                                   |--[INSERT sales_invoices]------>|
   |                                   |                                 |
   |                                   | [Publish event]                |
   |                                   |--[Redis pub/sub]               |
   |                                   |                                 |
   |<--[201 Invoice data]-------------|                                |
   | [Update local state]             |                                |
```

**Key Points:**
- Stock deduction is **atomic** (fails if any item has insufficient stock)
- If deduction fails, entire transaction rolls back (no partial updates)
- Invoice ID generated with format: `INV-YYYYMMDD-{5 random chars}`
- Real-time notification published to `realtime_events` channel

### 2. Complete Sales Workflow (Credit)

```
Frontend                          Backend                              MongoDB
   |                                 |                                  |
   +--[POST /sales]------------------>|                                |
   |   (items, customerId,            | [Validate user]                |
   |    creditUntil, dueAmount)       | [Check stock]                  |
   |                                   | [Deduct stock]                |
   |                                   |--[UPDATE inventory_items]--->  |
   |                                   |                                 |
   |                                   | [Create invoice]               |
   |                                   |--[INSERT sales_invoices]------>|
   |                                   |                                 |
   |                                   | [Create/Update credit ledger]  |
   |                                   |--[UPDATE credit_ledger]------->|
   |                                   | (status auto-calc or override) |
   |                                   |                                 |
   |                                   | [Publish event]                |
   |                                   |--[Redis pub/sub]               |
   |                                   |                                 |
   |<--[201 Invoice with due info]----|                                |
```

**Key Points:**
- Credit status auto-calculated:
  - `clear`: outstandingCredit ≤ 0
  - `overdue`: creditUntil < now()
  - `due`: else
- Manual status (`manualStatus` field) overrides calculation
- Credit ledger updated atomic with sale

### 3. Report Generation Workflow (Async)

```
Frontend                          Backend                  RabbitMQ      Worker      MongoDB
   |                                 |                        |             |           |
   +--[POST /dashboard/              |                        |             |           |
   |    reports/generate]------------>|                        |             |           |
   |   (type, dateRange)              | [Create report doc]    |             |           |
   |                                   |--[INSERT reports]---->|             |           |
   |                                   | (status: "queued")     |             |           |
   |                                   |                        |             |           |
   |<--[202 Accepted]------           | [Push to Celery]       |             |           |
   | (report id, status: queued)     |------------------------->|             |           |
   |                                   |                        |             |           |
   |                                   |                        | [Received] |           |
   |                                   |                        | [Fetch data]|           |
   |                                   |                        |----------->|           |
   |                                   |                        |            | [Query]  |
   |                                   |                        |            |---------->|
   |                                   |                        |            |<--[data]-|
   |                                   |                        |<--[data]---|           |
   |                                   |                        |            |           |
   |                                   |                        | [Call LLM] |           |
   |                                   |                        | (structure)|           |
   |                                   |                        |            |           |
   |                                   |                        | [Build CSV]|           |
   |                                   |                        | [Safe to]  |           |
   |                                   |                        | [genreport]|           |
   |                                   |                        |            |           |
   |                                   |                        | [Update]  |           |
   |                                   |                        | [report]   |           |
   |                                   |                        |----------->|
   |                                   |                        |            | (status: |
   |                                   |                        |            |  "completed")
   |                                   |                        |            |           |
   |                                   |                        | [Publish]  |           |
   |                                   |                        | [event]    |           |
   |                                   |                        |            |           |
   | [WebSocket event]                |<-[Redis pub/sub]-------|            |           |
   | received (report ready)          |                        |             |           |
   |                                   |                        |             |           |
   +--[GET /dashboard/reports]------>| [Return updated list]  |             |           |
   |<--[200 + report with URL]-----   |                        |             |           |
```

**Key Points:**
- Report status transitions: `queued` → `processing` → `completed` (or `failed`)
- Celery task auto-retries 3 times with 10s delay on failure
- Report data fetched within worker (not in main request)
- OpenRouter LLM structures raw data into report rows
- CSV written to `/app/generated_reports/{userId}/report_*.csv`
- WebSocket event published to `realtime_events` channel
- Notification created and stored in `notifications` collection

### 4. Credit Status Workflow

```
Customer makes sale on credit:
  - Invoice created with creditUntil = "2026-04-01"
  - Credit ledger entry: status = "due", outstandingCredit = $1500
  - Frontend shows badge "2 due"

Today is 2026-04-02 (past creditUntil):
  - Backend computes status: outstandingCredit > 0 && now > creditUntil
  - → status = "overdue"
  - Dashboard shows "Overdue" badge, email/notification sent (if implemented)

Customer pays $500:
  - PUT credit_ledger → outstandingCredit = $1000
  - Still shows "overdue" (date hasn't changed)

Customer pays $1000:
  - PUT credit_ledger → outstandingCredit = $0
  - Status auto-updates to "clear"
```

### 5. Real-time Event Flow

```
Backend                    Redis                  WebSocket Handler
   |                         |                         |
   | [Publish event]         |                         |
   +--[pub/sub]------------->|                         |
   |  (userId, type, data)   |                         |
   |                         |                         |
   |                         | [Broadcast to]          |
   |                         | [subscribed clients]    |
   |                         |------------------------>|
   |                         |                         | [Dispatch to user]
   |                         |                         |
   |                         | [Connection healthy]   |
   |                         | [Re-send on recover]   |
   |                         |                         |
   |                         | [Connection lost]      |
   |                         | [Queue & retry]        |
   |                         |  (event logged)         |
```

---

## Async Processing

### Celery Configuration

**Broker**: RabbitMQ (amqp://guest:guest@rabbitmq:5672)
**Result Backend**: Redis (redis://redis:6379/1)
**Queue**: `report_generation` (dedicated queue for report tasks)

### Task: `generate_report_task`

**Signature:**
```python
@celery_app.task(bind=True, name="...", max_retries=3, default_retry_delay=10)
def generate_report_task(
    self,
    report_id: str,
    user_id: str,
    report_type: str,
    start_date: str,
    end_date: str,
):
```

**Execution Steps:**
1. **Fetch Data**: Query MongoDB collections based on `report_type`:
   - `sales`: All sales in date range
   - `inventory`: All inventory items updated in date range
   - `customer`: All customers + credit ledger entries
   - `daily_summary`: Sales metrics + low-stock count
2. **Structure**: Call OpenRouter API to structure raw data into report rows
3. **Generate CSV**: Build CSV with headers from first row + data rows
4. **Store**: Write to `{REPORT_STORAGE_DIR}/{user_id}/report_*.csv`
5. **Update Report**: Set report status to `completed`, fileUrl, fileSize
6. **Notify**: Publish WebSocket event; create notification

**Retry Behavior:**
- On failure: Exponential backoff, 10s per retry, max 3 retries
- After retries exhausted: Status set to `failed`, notification sent

### Monitoring
- Celery Flower : `docker-compose` can expose flower on `http://localhost:5555`
- Logs: Check backend container logs (`docker logs inventory_backend`)
- Dead Letter Queue: Failed tasks logged in MongoDB/file for audit

---

## Environment Setup

### Prerequisites
- Docker & Docker Compose
- MongoDB Atlas URI (or local MongoDB)
- Clerk account with API keys
- Cloudinary account for image storage ( if not uploading bills)
- OpenRouter API key for LLM (if generating structured reports)

### Environment Variables

Create a `.env` file in the project root:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/inventory_management?retryWrites=true&w=majority

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379/0

# RabbitMQ / Celery
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672//
CELERY_BROKER_URL=amqp://guest:guest@rabbitmq:5672//
CELERY_RESULT_BACKEND=redis://redis:6379/1
CELERY_REPORT_QUEUE=report_generation

# OpenRouter (LLM for report structuring)
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxx
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Reports
REPORT_STORAGE_DIR=/app/generated_reports
WS_EVENTS_CHANNEL=realtime_events

# JWT & Clerk
JWT_SECRET=your-secret-key-min-32-chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=29d
PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
CLERK_JWT_ALGORITHM=RS256

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxx
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## Getting Started

### 1. Clone & Setup

```bash
git clone <repo-url> inventory-management
cd inventory-management
cp .env.example .env
# Edit .env with your credentials
```

### 2. Start Services

```bash
docker-compose up -d
```

This starts:
- **Frontend** (Next.js): `http://localhost:3000`
- **Backend** (FastAPI): `http://localhost:8000`
- **MongoDB**: External (Atlas) or local container
- **Redis**: `http://localhost:6379`
- **RabbitMQ**: `http://localhost:5672` (management UI: `http://localhost:15672`)
- **Nginx**:  `http://localhost:80`

### 3. Verify Services

```bash
# Check backend health
curl http://localhost:8000/api/v1/health

# Check frontend
open http://localhost:3000

# Check RabbitMQ management
open http://localhost:15672  # guest:guest
```

### 4. Seed Sample Data

```bash
# Via frontend: Onboarding dialog → "Load Sample Data"
# Or via API:
curl -X POST http://localhost:8000/api/v1/seed \
  -H "Authorization: Bearer <clerk-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"num_products": 100, "num_customers": 50, "num_invoices": 150}'
```

### 5. Develop

**Frontend (hot reload):**
```bash
cd frontend
npm run dev
```

**Backend (hot reload via Docker watch):**
```bash
docker-compose watch
```

### 6. Build for Production

```bash
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up -d
```

---

## Key Engineering Decisions

### 1. **Async-First Architecture**
- FastAPI with `asyncio` and Motor for non-blocking I/O
- Celery workers for long-running tasks (report generation)
- Redis pub/sub for real-time event distribution
- **Rationale**: Handles concurrent users, prevents blocking requests

### 2. **MongoDB with User Isolation**
- All collections indexed on `userId` for multi-tenancy
- Sales, inventory, customers scoped to user at query level
- **Rationale**: Simple schema flexibility, easy horizontal scaling

### 3. **Clerk Authentication**
- JWT-verified in middleware, `user_id` extracted and added to context
- Frontend uses Clerk `useAuth()` hook for token refresh
- **Rationale**: Secure, managed auth service; no password storage

### 4. **PaddleOCR for Bill Extraction**
- Local OCR (pre-trained models included)
- No external API calls for bill processing
- **Rationale**: Privacy, cost savings, offline capability

### 5. **OpenRouter for Report Structuring**
- Not for bill extraction, but for LLM-based data organization
- Converts raw MongoDB docs → structured CSV rows
- **Rationale**: Flexible, pay-per-use, no vendor lock-in

### 6. **React Query for Server State**
- Centralized, deduplicated API calls
- Built-in caching, revalidation, optimistic updates
- **Rationale**: Reduces frontend complexity, auto-sync with backend

### 7. **Zod + React Hook Form**
- Validation at form level (client) and endpoint level (server)
- Type-safe contracts between frontend and backend
- **Rationale**: Strong validation guardrails, great DX

### 8. **CSV Report Format**
- Simple, portable, Excel-compatible
- Generated server-side as files in `generated_reports/`
- **Rationale**: Accessible to non-technical users, easy integration

### 9. **Status Model for Credit**
- Auto-calculated status (`clear` / `due` / `overdue`)
- Manual override via `manualStatus` field
- **Rationale**: Handles edge cases (customer dispute, manual adjustment)

### 10. **WebSocket + Redis Pub/Sub**
- Single WebSocket per user connection
- Redis distributes events across worker instances
- **Rationale**: Scales horizontally, fault-tolerant event delivery

---

## Limitations & TODOs

### Current Limitations

1. **OCR Accuracy**
   - Bill parsing with PaddleOCR works for clean, structured bills
   - Complex/handwritten bills may fail; fallback to manual entry needed
   - No document rotation correction or preprocessing

2. **Credit System**
   - No partial payment tracking (pays full due or nothing)
   - No payment history per invoice
   - No automatic late fees or interest

3. **Inventory**
   - No physical inventory reconciliation / stock adjustment
   - No barcode generation (manual input only)
   - No serial/batch tracking for expiration dates

4. **Reporting**
   - Reports only downloadable as CSV; no PDF export
   - No scheduled/recurring reports
   - No email delivery of reports
   - LLM structuring may fail if OpenRouter API is down

5. **Scalability**
   - Single-region: all services in one Docker Compose
   - No multi-region replication
   - Report storage on local filesystem (not S3)

6. **Security**
   - No rate limiting on endpoints
   - No audit logging for compliance
   - Cloudinary credentials in environment (should use IAM)

7. **Notifications**
   - Real-time events not persisted if Redis goes down
   - No notification preferences / opt-out
   - No SMS/email notifications (WebSocket only)

### Planned Improvements

- [ ] PDF report export
- [ ] Payment history and partial payment tracking
- [ ] Bill image preprocessing (rotation, contrast)
- [ ] Scheduled report generation
- [ ] Email delivery integration
- [ ] Rate limiting & API quota
- [ ] Audit logging & compliance tracking
- [ ] S3/cloud storage for reports
- [ ] Inventory reconciliation workflow
- [ ] Multi-region deployment
- [ ] SMS notifications via Twilio
- [ ] Advanced analytics (monthly trends, forecasting)

---

## Support & Documentation

- **Frontend Contracts**: See `frontend/lib/contracts/` for TypeScript DTO definitions
- **API Spec**: OpenAPI docs available at `http://localhost:8000/api/v1/openapi.json`
- **Backend README**: [backend/README.md](backend/README.md) for detailed architecture
- **Environment Config**: All settings in `backend/app/core/config.py`

---

**Last Updated**: March 18, 2026  
**Version**: 1.0.0  
**Maintainer**: Inventory Management Team
