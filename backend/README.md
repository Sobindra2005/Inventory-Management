# Inventory Management Backend Plan & API Contract

## 1) Purpose
This document is the implementation blueprint for the backend powering:
- Home Dashboard
- My Store (Inventory)
- Customers (Credit Tracking)
- Sales & Billing
- Reports
- Alerts

It defines:
- Correct build order (to avoid blockers)
- API routes
- Request payloads from frontend
- Expected response payloads
- Validation and error behavior
- Data model and index guidance

---

## 2) Current Backend State
- Framework: FastAPI
- DB: MongoDB (Motor)
- Cache/Queue foundation: Redis
- Cloud storage support: Cloudinary configured
- Existing endpoints: Health only

Current API prefix: `/api/v1`

---

## 3) Build Order (Dependency-Safe)

### Phase 0: Platform Baseline (Required before all domains)
1. Standard error response format
2. Request validation strategy
3. Auth dependency middleware
4. Shared pagination/filter conventions
5. UTC timestamp conventions (`createdAt`, `updatedAt`)

### Phase 1: Inventory (My Store) — BLOCKER FOR SALES/DASHBOARD/ALERTS
Implement Inventory fully first.

### Phase 2: Sales Core (Cash + Invoice)
Depends on Inventory stock + pricing.

### Phase 3: Customers + Credit Ledger
Depends on Sales flow + customer base.

### Phase 4: Dashboard APIs
Depends on Inventory + Sales + Credit aggregates.

### Phase 5: Alerts
Depends on Inventory thresholds + Credit dues.

### Phase 6: Reports
Depends on stable data from all domains.

---

## 4) Common API Standards

### 4.1 Base URL
- Local: `http://localhost:8000/api/v1`

### 4.2 Headers
- `Content-Type: application/json` for JSON routes
- `Authorization: Bearer <token>` (for protected routes)

### 4.3 Success Envelope
Prefer direct typed payload responses (as frontend contracts expect), not nested wrappers.

### 4.4 Error Envelope (Recommended)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "stock must be >= 0",
    "details": {
      "field": "stock"
    }
  }
}
```

### 4.5 Time and Money
- Timestamps: ISO-8601 UTC strings
- Money: numeric decimal values (store with Decimal128 in Mongo, serialize as number)

### 4.6 Pagination Convention (for list endpoints)
- Query: `page` (default 1), `limit` (default 20, max 100)

---

## 5) API Contracts by Domain

## 5A) Inventory (My Store)
Frontend expects contracts from `InventoryProduct`, `InventoryListResponse`, and related request DTOs.

### 5A.1 GET `/inventory`
Get inventory list with optional filtering.

**Query params**
- `search?: string`
- `category?: string`
- `lowStockOnly?: boolean`

**Response 200**
```json
{
  "products": [
    {
      "id": "inv-001",
      "name": "Wireless Barcode Scanner",
      "barcode": "890100000001",
      "stock": 4,
      "price": 99.99,
      "category": "Hardware",
      "lowStockThreshold": 20,
      "createdAt": "2026-03-18T10:30:00.000Z",
      "updatedAt": "2026-03-18T10:30:00.000Z"
    }
  ],
  "totalCount": 1,
  "categories": ["Hardware", "Consumables", "Office Supplies"]
}
```

### 5A.2 POST `/inventory`
Create product.

**Request body**
```json
{
  "name": "Wireless Barcode Scanner",
  "barcode": "890100000001",
  "stock": 10,
  "price": 99.99,
  "category": "Hardware",
  "lowStockThreshold": 5
}
```

**Response 201**
`InventoryProduct` object.

### 5A.3 PUT `/inventory/{id}`
Update full product.

**Path params**
- `id: string`

**Request body**
Same schema as create.

**Response 200**
`InventoryProduct`

### 5A.4 PATCH `/inventory/{id}/stock`
Update stock only.

**Request body**
```json
{ "stock": 18 }
```

**Response 200**
`InventoryProduct`

### 5A.5 DELETE `/inventory/{id}`
Delete product.

**Response 204**
No content.

**Core validations**
- Barcode unique
- `stock >= 0`
- `price >= 0`
- `lowStockThreshold >= 1`

---

## 5B) Sales & Billing
Frontend expects `CreateSaleRequest`, `Invoice`, `SalesHistoryResponse`.

### 5B.1 POST `/sales`
Create invoice/sale.

**Request body**
```json
{
  "items": [
    {
      "productId": "inv-001",
      "name": "Wireless Barcode Scanner",
      "price": 99.99,
      "quantity": 2,
      "stock": 10
    }
  ],
  "discount": 5,
  "paymentMethod": "credit",
  "customerId": "cust-001",
  "customerName": "Jane Doe",
  "dueAmount": 194.98
}
```

**Response 201**
```json
{
  "invoice": {
    "id": "sale-001",
    "shopName": "POS Store",
    "shopContact": "+91 99999 00000",
    "invoiceId": "INV-20260318-001",
    "dateTime": "2026-03-18T10:30:00.000Z",
    "items": [
      {
        "productId": "inv-001",
        "name": "Wireless Barcode Scanner",
        "price": 99.99,
        "quantity": 2,
        "stock": 10,
        "itemTotal": 199.98
      }
    ],
    "subtotal": 199.98,
    "discount": 5,
    "total": 194.98,
    "paymentMethod": "credit",
    "customerId": "cust-001",
    "customerName": "Jane Doe",
    "dueAmount": 194.98,
    "itemCount": 1
  },
  "success": true
}
```

### 5B.2 GET `/sales/history`
Get compact sales timeline.

**Response 200**
```json
{
  "sales": [
    {
      "id": "sale-001",
      "invoiceId": "INV-20260318-001",
      "total": 194.98,
      "paymentMethod": "credit",
      "timestamp": "2026-03-18T10:30:00.000Z",
      "itemCount": 1,
      "customerName": "Jane Doe"
    }
  ]
}
```

### 5B.3 GET `/sales/invoices/{invoiceId}`
Get full invoice details.

**Response 200**
`Invoice`

**Core transactional rules**
- Sale creation must atomically:
  1. Validate stock
  2. Deduct stock
  3. Create invoice
  4. Create/update credit ledger when payment is `credit`

---

## 5C) Customers
Frontend expects `Customer` and `CustomerCreditListResponse`.

### 5C.1 POST `/customers`
Create customer.

**Request body**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+91 9876543210"
}
```

**Response 201**
```json
{
  "id": "cust-001",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+91 9876543210",
  "totalCredit": 0,
  "dueAmount": 0,
  "createdAt": "2026-03-18T10:30:00.000Z",
  "updatedAt": "2026-03-18T10:30:00.000Z"
}
```

### 5C.2 GET `/customers`
List customers.

**Response 200**
```json
{
  "customers": [
    {
      "id": "cust-001",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+91 9876543210",
      "totalCredit": 5000,
      "dueAmount": 1200,
      "createdAt": "2026-03-18T10:30:00.000Z",
      "updatedAt": "2026-03-18T10:30:00.000Z"
    }
  ]
}
```

### 5C.3 GET `/customers/{customerId}`
Get one customer.

**Response 200**
`Customer`

### 5C.4 GET `/customers/credit`
Credit tracking summary + customer credit profiles.

**Response 200**
```json
{
  "summary": {
    "totalCustomers": 20,
    "customersWithDue": 6,
    "totalOutstanding": 35000,
    "overdueCustomers": 2
  },
  "customers": [
    {
      "id": "cust-001",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+91 9876543210",
      "totalCreditIssued": 75000,
      "outstandingCredit": 1200,
      "totalCreditInvoices": 15,
      "lastCreditAt": "2026-03-18T10:30:00.000Z",
      "lastCreditClearedAt": "2026-03-16T12:00:00.000Z",
      "creditUntil": "2026-03-25T00:00:00.000Z",
      "status": "due",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-03-18T10:30:00.000Z"
    }
  ]
}
```

**Status rules**
- `clear`: outstanding = 0
- `due`: outstanding > 0 and due date not crossed
- `overdue`: outstanding > 0 and due date crossed

---

## 5D) Home Dashboard
Frontend expects `DashboardData`, `LowStockResponse`, `GeneratedReport[]`.

### 5D.1 GET `/dashboard`
Dashboard aggregate snapshot.

**Response 200**
```json
{
  "kpi": {
    "todaySales": 12500,
    "itemsSold": 84,
    "totalTransactions": 19,
    "cashVsCredit": {
      "cash": 7600,
      "credit": 4900
    },
    "currency": "INR"
  },
  "lowStock": {
    "products": [
      {
        "id": "inv-001",
        "name": "Wireless Barcode Scanner",
        "currentStock": 4,
        "minThreshold": 20,
        "sku": "890100000001",
        "category": "Hardware",
        "lastRestocked": "2026-03-10T10:30:00.000Z",
        "createdAt": "2026-03-01T10:30:00.000Z",
        "updatedAt": "2026-03-18T10:30:00.000Z"
      }
    ],
    "totalCount": 1,
    "criticalCount": 1
  },
  "recentReports": [
    {
      "id": "rep-001",
      "name": "Daily Sales - 18 Mar",
      "type": "sales",
      "generatedAt": "2026-03-18T10:30:00.000Z",
      "dateRange": {
        "startDate": "2026-03-18",
        "endDate": "2026-03-18"
      },
      "fileUrl": "https://...",
      "fileSize": 1048576,
      "status": "completed",
      "createdAt": "2026-03-18T10:30:00.000Z",
      "updatedAt": "2026-03-18T10:30:00.000Z"
    }
  ]
}
```

### 5D.2 GET `/dashboard/low-stock`
Low stock products.

**Query params**
- `limit?: number` (default 10)

**Response 200**
`LowStockResponse`

---

## 5E) Reports

### 5E.1 POST `/dashboard/reports/generate`
Generate report.

**Request body**
```json
{
  "type": "sales",
  "startDate": "2026-03-01",
  "endDate": "2026-03-18"
}
```

**Response 202 or 200**
`GeneratedReport`

### 5E.2 GET `/dashboard/reports`
List generated reports.

**Query params**
- `limit?: number` (default 10)

**Response 200**
`GeneratedReport[]`

### 5E.3 GET `/dashboard/reports/{reportId}/download`
Download report file.

**Response 200**
Binary file stream (`application/pdf`, `text/csv`, etc.)

---

## 5F) Alerts (Planned)
No frontend API file yet, but required for ops flow.

### 5F.1 GET `/alerts`
List active alerts.

### 5F.2 PATCH `/alerts/{id}/ack`
Acknowledge alert.

### 5F.3 PATCH `/alerts/{id}/resolve`
Resolve alert.

**Alert payload shape (recommended)**
```json
{
  "id": "alt-001",
  "type": "low_stock",
  "severity": "high",
  "entityId": "inv-001",
  "message": "Wireless Barcode Scanner below threshold",
  "status": "open",
  "createdAt": "2026-03-18T10:30:00.000Z",
  "updatedAt": "2026-03-18T10:30:00.000Z"
}
```

---

## 6) Mongo Collections and Minimum Indexes

### inventory_items
- Unique: `barcode`
- Indexes: `category`, `stock`, `updatedAt`

### stock_movements
- Indexes: `itemId`, `createdAt`, `referenceId`

### sales_invoices
- Unique: `invoiceId`
- Indexes: `dateTime`, `paymentMethod`, `customerId`

### customers
- Indexes: `name`, `phone`, `email`

### credit_ledger
- Indexes: `customerId`, `status`, `creditUntil`, `lastCreditAt`

### reports
- Indexes: `type`, `status`, `generatedAt`

### alerts
- Indexes: `type`, `status`, `severity`, `createdAt`

---

## 7) Non-Blocking Acceptance Checklist

### Phase 1 complete when:
- Inventory CRUD works from frontend without fallback
- Stock update endpoint stable

### Phase 2 complete when:
- Invoice creation updates stock safely
- Sales history endpoint powers UI feed

### Phase 3 complete when:
- Credit sale writes due entries
- `/customers/credit` powers customer credit page KPIs + list

### Phase 4 complete when:
- Dashboard KPI + low-stock + report list fully real

### Phase 5 complete when:
- Low stock and overdue credit alerts available and actionable

### Phase 6 complete when:
- Report generation + list + download fully integrated

---

## 8) Test Plan

### Unit Tests
- Stock validation and deduction rules
- Credit status transitions (`clear` / `due` / `overdue`)
- KPI aggregations

### Integration Tests
- Inventory endpoints
- Sales transaction atomicity
- Customer credit summary endpoint
- Dashboard data aggregation

### Contract Tests
- Validate response shapes against frontend TypeScript contracts

### Failure Tests
- Duplicate barcode
- Insufficient stock during sale
- Invalid report date range
- Invalid customer for credit sale

---

## 9) Rollout Strategy
1. Keep frontend demo fallback toggles enabled per module during implementation.
2. Disable fallback for each module once endpoints are verified.
3. Run full end-to-end checks with all fallbacks disabled.
4. Deploy in order: Inventory -> Sales -> Customers/Credit -> Dashboard -> Alerts -> Reports.

---

## 10) Implementation Note
This document defines target contract behavior. During development, if API shape changes are necessary, update:
1. backend endpoint schema
2. frontend contracts
3. this README
in the same PR to keep all layers consistent.
