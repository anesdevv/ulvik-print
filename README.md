# 📊 Ulvik Console — Registre & Stock

An internal, high-fidelity business ledger and real-time inventory console built specifically for the **Ulvik Print** workshop in Algiers. The application tracks purchase and sales logs, manages real-time stock levels, monitors cash-flow-based profits and margins, and provides a calendar-based ledger lookup with integrated notes.

---

## ✨ Features

- **💼 Dynamic Cash-Flow Accounting & KPI Panel:**
  - **Revenue (`Revenus`):** Total sales volume logged in the selected month.
  - **Expenses (`Dépenses`):** Sum of all expenses, including raw garment purchases and overhead/other costs (shipping, printing, utilities, etc.).
  - **Net Profit (`Bénéfices`):** True cash-flow ledger formula (`Revenue - Expenses`).
  - **Average Margin (`Marge Moyenne`):** Dynamic percentage margins calculated per transaction and aggregated.

- **📦 Real-Time Inventory Tracking (`Stock`):**
  - Track stock count across 5 color lines (Noir, Blanc, Rouge, Bleu, Gris).
  - Automatically subtracts quantities on **sales (sell)** and adds quantities on **purchases (buy)** to display the current live stock levels.

- **📅 Calendar Ledger & Tracker (`Calendrier & Détail`):**
  - Interactive grid visualizer mapping dates with logged activity.
  - Drill down into any date to view itemized lists of transactions, including action type (Buy/Sell), unit cost, sale price, overhead expenses, and individual margins.
  - Live delete functionality to instantly update state and persist the ledger.

- **📝 Embedded Quick Notepad (`Bloc-notes`):**
  - Auto-saving side panel notes (`ulvik_notes_v4`) for tracking custom print orders, custom customer dimensions, or supplier contact details.

- **🌐 Double Localization & Aesthetics:**
  - Fully bilingual interface toggling between **English** and **French**.
  - Dynamic Dark Mode / Light Mode with glassmorphic visuals and beautiful custom CSS.

---

## 🛠️ Tech Stack & Architecture

- **Framework:** [Next.js](https://nextjs.org/) (Page Router / Client-side Hydration)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** CSS Modules & Variables (zero Tailwind dependencies, custom glassmorphism)
- **Database:** LocalStorage-persisted state (`ulvik_ledger_v5` / `ulvik_notes_v4`) with integrated mock seeds for demo/fallback instances.

---

## 📂 Project Structure

```text
├── src/
│   ├── app/
│   │   ├── globals.css         # Custom dark/light variables, scrollbars, and core UI theme
│   │   ├── layout.tsx          # HTML head structure & viewport settings
│   │   └── page.tsx            # Main App Layout (header, KPIs, inventory, calendar ledger)
│   └── components/
│       ├── Calculator.tsx      # The log compiler (buy/sell inputs & field verification)
│       ├── Calculator.module.css
│       ├── CalendarTracker.tsx # Interactive calendar grid mapping logged dates
│       ├── CalendarTracker.module.css
│       ├── Notepad.tsx         # Notes sidebar with local persistence
│       └── Notepad.module.css
├── public/                     # Images and assets
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Installation
Clone the repository, then install dependencies:
```bash
pnpm install
# or
npm install
```

### 2. Run the Development Server
Start the Next.js server locally:
```bash
pnpm dev
# or
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 3. Production Build
To create an optimized production bundle:
```bash
pnpm build
pnpm start
# or
npm run build
npm start
```

---

## 🔒 Configuration & Local Data Keys
Data is persisted in the client's browser local storage:
- Ledger Data key: `ulvik_ledger_v5`
- Quick Notes key: `ulvik_notes_v4`
- Theme preference key: `ulvik_theme`
