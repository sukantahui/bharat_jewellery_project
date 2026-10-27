# Bharat Jewellery ERP & POS — Luxury Retail Frontend

A complete, high-performance, and luxury web frontend designed for Indian Gold & Diamond Jewellery Retail Showrooms, Bullion Merchants, and Production Karigar workflows.

Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, **TanStack Query**, and **Zustand**, connecting to the Laravel 12.x REST API (`http://localhost/bharat_api/public/api`).

---

## 🌟 Key Modules & Capabilities

### 1. Executive Intelligence Dashboard
- **Live Gold & Silver Board Rates**: Visual ticker cards with live buy/sell rates for 24K, 22K (916), 18K (750), and 14K (585).
- **Showroom Financial KPIs**: Today's Sales, In-Stock Valuation, Liquid Funds (Cash Drawer + Bank Balance), and Outward Net Weight.
- **Visual Analytics**: Interactive stock breakdown across Jewellery Categories (Necklaces, Bangles, Chains, Rings, Earrings) via Recharts.
- **Recent Activity**: Quick drill-downs into latest invoices and karigar production receipts.

### 2. High-Speed POS Retail Billing Terminal
- **Instant Barcode/Tag Scanner Lookup**: Live tag scanning with weight breakdown (Gross, Stone, Net Gold Weight), purity, and HUID verification.
- **Real-Time Price Engine**: Automatic calculation of:
  $$\text{Net Weight} = \text{Gross Weight} - \text{Stone Weight}$$
  $$\text{Gold Amount} = \text{Net Weight} \times \text{Board Rate per Gram}$$
  $$\text{Making Charges} = \text{Per-gram} \mid \text{Percentage} \mid \text{Fixed}$$
  $$\text{GST 3\%} = (\text{Gold Amount} + \text{Making} + \text{Stone} + \text{Hallmarking}) \times 3\%$$
- **Old Gold Buyback / Exchange (Purity Melt Math)**:
  $$\text{Fine Gold Weight} = (\text{Gross Weight} - \text{Dust Weight}) \times \frac{\text{Purity \%}}{100}$$
  $$\text{Exchange Value} = \text{Fine Gold Weight} \times \text{Old Gold Buying Rate}$$
- **Statutory Cash Compliance (Rule 114B)**:
  - Enforces mandatory Indian Permanent Account Number (PAN) entry and validation whenever cash tender $\ge ₹2,00,000$.
- **Dual Printing Formats**:
  - **A4 / A5 Official Tax Invoice**: Complete GST tax breakdown, Hallmarking HUID, HSN 7113, Authorized Signatory, and Terms.
  - **80mm Compact Thermal Receipt**: High-speed counter slip for instant customer checkout.

### 3. Inventory & Barbell Tag Printing
- **Real-time Showroom Stock Tracking**: Filter by Category, Purity, and Stock Status (`in_stock`, `sold`, `reserved`).
- **Barbell Jewellery Tag Generator**: Formatted printable jewellery tags with Gross Weight, Net Weight, Stone Weight, Karat Code, and HUID.

### 4. Daily Rates & Board Price Control
- Daily multi-karat rate master updating selling and buying rates per gram.
- Historical trend tracking to monitor bullion rate movements.

### 5. Karigar Production Inward & Bullion Purchases
- Inward stock entry from Karigars and artisans with making cost tracking.
- Bullion purchases with Vendor bill recording, reverse charge tracking, and metal balance ledgers.

### 6. Sales Returns & Credit Notes
- Direct linkage to original sales invoices.
- Restocking options (`return_to_inventory`, `melt_to_bullion`) and credit notes issuance.

### 7. Cash Drawer & Cash Book Vouchers
- Live tracking of Cash-in-Hand and Bank balances.
- Debit/Credit vouchers with party ledger adjustments.

### 8. Statutory GST Compliance (GSTR-1 & GSTR-3B)
- **GSTR-1**: Table 4 (B2B), Table 7 (B2C Small), and Table 12 (HSN 7113 Summary).
- **GSTR-3B**: Section 3.1 Output Tax Liability vs Section 4 Input Tax Credit (ITC) offset.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on Node v22.14.0)
- **WAMP Server**: Apache and MySQL running locally with `bharat_api` deployed at `http://localhost/bharat_api/public/api`.

### Running Locally

```bash
# 1. Navigate to the project directory
cd e:\wamp64\www\bharat_jewellery_project

# 2. Install dependencies (already installed)
npm install

# 3. Start the development server
npm run dev
```

The application is accessible at:
👉 **`http://localhost:5173/`**

### Pre-Seeded Demo Credentials

| Role | Username / Email | Password |
| :--- | :--- | :--- |
| **Admin** | `sukantahui` | `Cnat@1977` |
| **Owner** | `owner@bharatjewellers.com` | `Owner@1234` |
| **Staff** | `staff@bharatjewellers.com` | `Staff@1234` |
| **Developer** | `dev@bharatjewellers.com` | `Dev@1234` |

*Quick-fill pills are available directly on the login screen for instant 1-click credential filling.*

---

## 📁 Project Architecture

```
bharat_jewellery_project/
├── src/
│   ├── api/
│   │   └── client.ts            # Axios instance, Bearer token interceptor, React Query hooks
│   ├── components/
│   │   ├── common/              # Badge, Modal, Card, LoadingSpinner
│   │   ├── layout/              # AppLayout, Header, Sidebar
│   │   └── print/               # InvoicePrintA4, ThermalSlipPrint, BarcodeTagPrint
│   ├── pages/
│   │   ├── auth/LoginPage.tsx
│   │   ├── dashboard/DashboardPage.tsx
│   │   ├── pos/PosBillingPage.tsx & InvoiceListPage.tsx
│   │   ├── inventory/InventoryListPage.tsx
│   │   ├── masters/DailyRatesPage.tsx
│   │   ├── stock-entry/StockEntryPage.tsx
│   │   ├── purchases/PurchaseListPage.tsx
│   │   ├── returns/SalesReturnListPage.tsx
│   │   ├── parties/PartiesPage.tsx
│   │   ├── accounts/CashDrawerPage.tsx
│   │   ├── expenses/ExpenseIncomePage.tsx
│   │   ├── gst/GstReportsPage.tsx
│   │   └── settings/SettingsPage.tsx
│   ├── store/
│   │   ├── authStore.ts         # Persistent authentication state
│   │   └── posStore.ts          # Active billing ticket, cart calculations & PAN checks
│   ├── types/
│   │   └── index.ts             # 100% type-safe API schema definitions
│   ├── utils/
│   │   ├── calculations.ts      # Jewellery math formulas (Weights, Making, GST, Melt)
│   │   ├── formatters.ts        # Currency (₹), Weight (g), Dates, Indian Number-to-Words
│   │   └── panValidator.ts      # Indian Rule 114B PAN format & cash limit checker
│   ├── App.tsx                  # Tab-based routing & view controller
│   ├── index.css                # Obsidian & Gold luxury design system
│   └── main.tsx
├── package.json
└── vite.config.ts
```
