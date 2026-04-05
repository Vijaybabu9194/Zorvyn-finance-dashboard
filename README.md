# Finance Dashboard UI (React + Vite)

A modern, interactive finance dashboard built with React and Vite.
This project is focused on frontend architecture, UI/UX quality, and data-driven interactions using mock data.

## 1. Project Overview

This dashboard simulates a personal/portfolio finance monitoring system with:

- Executive summary metrics
- Interactive visual analytics
- Transaction management workspace
- Role-based behavior (Viewer/Admin)
- Forecasting and risk signals
- Responsive desktop-first layout
- Dark mode support
- INR (Indian Rupee) formatting

## 2. Core Features Implemented

### Dashboard and Analytics

- KPI rail for:
  - Net Balance
  - Income Stream
  - Expense Load
- Month-over-month deltas for key metrics
- Interactive Capital Velocity chart:
  - Hover tooltips
  - Active point highlight
  - Guide line on hover
  - Filled area under line
  - In-chart grid and labels
  - Quick stats (latest/peak/lowest/average)
- Interactive Expense Composition donut:
  - Hoverable segments
  - Active center detail update
  - Segment shift animation on hover
  - Interactive legend with active state

### Transactions Workbench

- Search by description/category
- Filter by:
  - Type
  - Category
  - Start date / End date
  - Min amount / Max amount
- CSV export for visible (currently filtered) transactions
- Compact vs comfort row density toggle
- Pagination with row count selector

### Role-Based UI

- Viewer: read-only experience
- Admin:
  - Add transactions
  - Edit transactions
  - Cancel edit mode

### Insights and Risk

- AI-style financial brief section
- Budget utilization section
- Forecasted monthly expense (rolling logic)
- Dedicated Risk Monitor section:
  - Anomaly detection
  - Recurring expense radar

### Theming and UX

- Dark/Light mode toggle
- Theme preference persistence in localStorage
- Sidebar with section navigation and active tracking
- Smooth scrolling to dashboard sections
- Fully responsive behavior for smaller screens

## 3. Technology Stack

### Frontend Runtime

- React 18 (`react`, `react-dom`)
- Vite 5 (`vite`)
- Vite React plugin (`@vitejs/plugin-react`)

### Language and Styling

- JavaScript (ES modules)
- CSS (custom design system with tokens/variables)
- SVG for custom chart rendering (no chart library dependency)

### Browser APIs Used

- `localStorage`:
  - theme preference
  - dashboard data persistence
  - version marker for cache reset behavior
- `IntersectionObserver`:
  - active sidebar section tracking
- `Blob` + object URLs:
  - CSV export download
- `Intl.NumberFormat`:
  - INR currency formatting (`en-IN`, `INR`)

## 4. Project Structure

```text
zorvyn/
├─ index.html
├─ package.json
├─ vite.config.js
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx
│  ├─ styles.css
│  ├─ data/
│  │  └─ mockData.js
│  ├─ state/
│  │  └─ FinanceContext.jsx
│  ├─ utils/
│  │  └─ formatters.js
│  └─ components/
│     ├─ RoleSwitcher.jsx
│     ├─ TransactionForm.jsx
│     ├─ SummaryCards.jsx
│     ├─ BalanceTrendChart.jsx
│     ├─ CategoryBreakdownChart.jsx
│     ├─ InsightsSection.jsx
│     └─ TransactionsSection.jsx
└─ README.md
```

Note: The current primary UI flow is composed in `src/App.jsx`, while some component files in `src/components/` are retained as modular/legacy artifacts and can be cleaned up later if desired.

## 5. State Management Design

Global state is managed through a Context + Reducer pattern (`src/state/FinanceContext.jsx`).

### Source State

- `role`
- `transactions`
- `filters`
  - `search`, `type`, `category`
  - `startDate`, `endDate`
  - `minAmount`, `maxAmount`
- `sort`
- `editingId`

### Derived State / Analytics

- `filteredTransactions`
- `summary` (`income`, `expenses`, `balance`)
- `monthlyStats`
- `categoryStats`
- `monthlyComparison` (%)
- `advancedMetrics`
  - `budgetUtilization`
  - `forecastExpense`
  - `anomalies`
  - `recurring`

## 6. Data Model

Sample transaction model:

```js
{
  id: 1,
  date: '2026-01-03',
  description: 'Salary Deposit',
  amount: 5200,
  category: 'Salary',
  type: 'income' // or 'expense'
}
```

Mock dataset is located in `src/data/mockData.js`.

## 7. Currency and Locale

- Currency is formatted as Indian Rupees in `src/utils/formatters.js` using:
  - Locale: `en-IN`
  - Currency: `INR`

Example output style:

- `₹1,23,456.00`

## 8. Setup and Run

### Prerequisites

- Node.js 18+ recommended
- npm 9+ recommended

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 9. Available Scripts

Defined in `package.json`:

- `dev`: starts Vite dev server
- `build`: creates production build
- `preview`: previews production build locally

## 10. UX and Accessibility Notes

- Color token system for theme consistency
- Focus styles on controls
- Dense but readable data table
- Visual hover feedback on all key chart elements
- Empty-state handling in chart, table, and risk sections

## 11. Performance and Simplicity Choices

- No heavy charting library dependency; charts use lightweight SVG
- Computed analytics are memoized with `useMemo`
- Local-only state with persisted transactions for quick demo reliability

## 12. Known Limitations

- No backend/API integration (mock data only)
- No authentication; role behavior is simulated client-side
- No test suite configured yet

## 13. Future Enhancements

- Unit/integration tests with Vitest + React Testing Library
- API-backed transaction storage
- Real auth + RBAC
- Multi-currency support (INR/USD toggle)
- Time-range animation presets (1M/3M/6M/1Y)
- Improved keyboard shortcuts and accessibility auditing

## 14. Summary

This project demonstrates practical frontend engineering for a finance analytics dashboard with:

- Structured state management
- Advanced UI interactions
- Responsive and theme-aware design
- Professional chart and data-table behavior

It is designed to be clean, extensible, and easy to evolve into a production-grade product.
