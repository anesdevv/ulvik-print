"use client";

import React, { useState, useEffect } from "react";
import Calculator, { TransactionInput } from "@/components/Calculator";
import CalendarTracker, { SavedTransaction } from "@/components/CalendarTracker";
import Notepad from "@/components/Notepad";

const COLOR_MAP: { [key: string]: { bg: string, border: string } } = {
  black: { bg: "#1A1A1A", border: "1px solid var(--border-color)" },
  white: { bg: "#FFFFFF", border: "1px solid #D3D3D3" },
  red: { bg: "#E15B5B", border: "none" },
  blue: { bg: "#4F83CC", border: "none" },
  grey: { bg: "#7A7A78", border: "none" }
};

// Sample mock data for a realistic business demo on initial load
const MOCK_TRANSACTIONS = (): SavedTransaction[] => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  return [
    {
      id: "tx-mock-1",
      date: `${year}-${month}-01`,
      action: "buy",
      color: "black",
      colorName: "Noir",
      quantity: 100,
      garmentCost: 700,
      sellingPrice: 0,
      otherCost: 1500, // shipping
      totalCost: 71500,
      totalRevenue: 0,
      netProfit: -71500
    },
    {
      id: "tx-mock-2",
      date: `${year}-${month}-05`,
      action: "sell",
      color: "black",
      colorName: "Noir",
      quantity: 10,
      garmentCost: 0,
      sellingPrice: 2500,
      otherCost: 200,
      totalCost: 200,
      totalRevenue: 25000,
      netProfit: 24800
    }
  ];
};

const TRANSLATIONS = {
  en: {
    console: "Inventory & Ledger",
    shop: "Algiers",
    subtitle: "Internal P&L Console",
    activeMonth: "Period",
    grossRevenue: "Revenue",
    productionCost: "Expenses",
    netProfit: "Profits",
    stock: "Stock",
    pcsSymbol: "pcs",
    ledgerTitle: "Day Details",
    ledgerDesc: "Orders completed on the selected date.",
    transactionsLogged: "entries",
    noTransactions: "No entries logged on this date.",
    // Table
    actionType: "Action",
    color: "Color",
    qty: "Qty",
    unitCost: "Unit Cost",
    unitPrice: "Price",
    otherCost: "Other Cost",
    totalExpenses: "Total Cost",
    totalRevenue: "Total Rev.",
    netMargin: "Profit (Margin)",
    action: "Manage",
    delete: "Delete",
    // Badges
    buy: "Buy",
    sell: "Sell",
    // Inventory
    inventoryTitle: "Inventory Status",
    lowStock: "Low Stock",
    colors: {
      black: "Black",
      white: "White",
      red: "Red",
      blue: "Blue",
      grey: "Grey"
    },
    months: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]
  },
  fr: {
    console: "Registre & Stock",
    shop: "Alger",
    subtitle: "Journal Interne de P&L",
    activeMonth: "Période",
    grossRevenue: "Revenus",
    productionCost: "Dépenses",
    netProfit: "Bénéfices",
    stock: "Stock",
    pcsSymbol: "pcs",
    ledgerTitle: "Détail du Jour",
    ledgerDesc: "Mouvements de stock enregistrés pour la date sélectionnée.",
    transactionsLogged: "mouvements",
    noTransactions: "Aucun mouvement enregistré pour ce jour.",
    // Table
    actionType: "Action",
    color: "Couleur",
    qty: "Qté",
    unitCost: "Coût U.",
    unitPrice: "Prix U.",
    otherCost: "Autre Coût",
    totalExpenses: "Dépenses",
    totalRevenue: "Revenus",
    netMargin: "Bénéfice (Marge)",
    action: "Action",
    delete: "Supprimer",
    // Badges
    buy: "Achat",
    sell: "Vente",
    // Inventory
    inventoryTitle: "État des Stocks",
    lowStock: "Alerte Stock",
    colors: {
      black: "Noir",
      white: "Blanc",
      red: "Rouge",
      blue: "Bleu",
      grey: "Gris"
    },
    months: [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ]
  }
};

export default function Home() {
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [lang, setLang] = useState<"en" | "fr">("fr"); // default to French
  const [theme, setTheme] = useState<"light" | "dark">("dark"); // default to Dark mode
  const [transactions, setTransactions] = useState<SavedTransaction[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  
  // Track active calendar view month for KPI sums
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
  const [activeMonth, setActiveMonth] = useState<number>(new Date().getMonth());

  // Load ledger data and theme on component mount
  useEffect(() => {
    // Theme setup
    const savedTheme = localStorage.getItem("ulvik_theme") || "dark";
    setTheme(savedTheme as "light" | "dark");
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Ledger data setup
    const savedData = localStorage.getItem("ulvik_ledger_data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((tx: any) => ({
            id: tx.id || `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            date: tx.date || tx.orderDate || new Date().toISOString().split('T')[0],
            action: tx.action || (tx.type ? "sell" : "buy"),
            color: tx.color || "black",
            colorName: tx.colorName || "Noir",
            quantity: Number(tx.quantity) || 0,
            garmentCost: Number(tx.garmentCost) || 0,
            sellingPrice: Number(tx.sellingPrice) || 0,
            otherCost: Number(tx.otherCost !== undefined ? tx.otherCost : tx.overheadCost) || 0,
            totalCost: Number(tx.totalCost) || 0,
            totalRevenue: Number(tx.totalRevenue) || 0,
            netProfit: Number(tx.netProfit) || 0
          }));
          setTransactions(sanitized);
        } else {
          throw new Error("Data is not an array");
        }
      } catch (e) {
        console.error("Error loading saved ledger data:", e);
        const seeds = MOCK_TRANSACTIONS();
        setTransactions(seeds);
        localStorage.setItem("ulvik_ledger_v5", JSON.stringify(seeds));
      }
    } else {
      const seeds = MOCK_TRANSACTIONS();
      setTransactions(seeds);
      localStorage.setItem("ulvik_ledger_v5", JSON.stringify(seeds));
    }
  }, []);

  const saveLedger = (updated: SavedTransaction[]) => {
    setTransactions(updated);
    localStorage.setItem("ulvik_ledger_v5", JSON.stringify(updated));
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("ulvik_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleAddTransaction = (input: TransactionInput) => {
    const newTx: SavedTransaction = {
      ...input,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    saveLedger([newTx, ...transactions]);
    setSelectedDate(input.date);
  };

  const handleDeleteTransaction = (id: string) => {
    const filtered = transactions.filter(t => t.id !== id);
    saveLedger(filtered);
  };

  const activeMonthString = `${activeYear}-${String(activeMonth + 1).padStart(2, "0")}`;
  const monthlyTransactions = transactions.filter(t => t.date.startsWith(activeMonthString));

  // Cumulative P&L calculations
  const totalRevenue = monthlyTransactions.reduce((sum, t) => sum + t.totalRevenue, 0);
  const totalExpenses = monthlyTransactions.reduce((sum, t) => sum + t.totalCost, 0);
  const netProfit = totalRevenue - totalExpenses;
  
  const averageMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const dayTransactions = transactions.filter(t => t.date === selectedDate);

  // Compute dynamic inventory stock counts historically (from all transactions)
  const inventory = { black: 0, white: 0, red: 0, blue: 0, grey: 0 };
  transactions.forEach(t => {
    const qty = t.quantity || 0;
    if (t.color && t.color in inventory) {
      if (t.action === "buy") {
        inventory[t.color] += qty;
      } else {
        inventory[t.color] -= qty;
      }
    }
  });

  const totalStock = Object.values(inventory).reduce((sum, qty) => sum + qty, 0);

  const t = TRANSLATIONS[lang];

  const getFormatMonthName = (m: number) => {
    return t.months[m] || "";
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      
      {/* Flat Minimal Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(251, 251, 250, 0.05)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '1rem 2rem'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.4rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: 'var(--text-primary)'
            }}>ULVIK</span>
            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{t.console}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            
            {/* Dark Mode Toggle Button */}
            <button 
              onClick={toggleTheme}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                width: '28px',
                height: '28px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
              aria-label="Toggle Theme"
            >
              {theme === "light" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              )}
            </button>

            {/* Lang Switcher Button */}
            <div style={{ display: 'flex', background: 'var(--bg-canvas)', padding: '2px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => setLang("en")} 
                style={{
                  padding: '0.2rem 0.5rem', 
                  fontSize: '0.7rem', 
                  fontWeight: 700, 
                  borderRadius: '3px',
                  cursor: 'pointer',
                  backgroundColor: lang === "en" ? 'var(--text-primary)' : 'transparent',
                  color: lang === "en" ? 'var(--bg-surface)' : 'var(--text-secondary)'
                }}
              >
                EN
              </button>
              <button 
                onClick={() => setLang("fr")} 
                style={{
                  padding: '0.2rem 0.5rem', 
                  fontSize: '0.7rem', 
                  fontWeight: 700, 
                  borderRadius: '3px',
                  cursor: 'pointer',
                  backgroundColor: lang === "fr" ? 'var(--text-primary)' : 'transparent',
                  color: lang === "fr" ? 'var(--bg-surface)' : 'var(--text-secondary)'
                }}
              >
                FR
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }} className="header-meta-details">
              <span>{t.shop}</span>
              <span style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-color)' }}></span>
              <span>{t.subtitle}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Panel */}
      <main className="dashboard-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Row 1: KPI Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '1px',
          backgroundColor: 'var(--border-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          overflow: 'hidden'
        }} className="kpi-row-grid">
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1.25rem', backgroundColor: 'var(--bg-surface)' }}>
            <span className="form-label">{t.activeMonth}</span>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600 }}>
              {getFormatMonthName(activeMonth)} {activeYear}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1.25rem', backgroundColor: 'var(--bg-surface)' }}>
            <span className="form-label">{t.grossRevenue}</span>
            <span className="mono-display" style={{ fontSize: '1.35rem', fontWeight: 500 }}>
              {totalRevenue.toLocaleString()} DZD
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1.25rem', backgroundColor: 'var(--bg-surface)' }}>
            <span className="form-label">{t.productionCost}</span>
            <span className="mono-display" style={{ fontSize: '1.35rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              {totalExpenses.toLocaleString()} DZD
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1.25rem', backgroundColor: 'var(--bg-surface)' }}>
            <span className="form-label">{t.netProfit}</span>
            <span className={`mono-display font-semibold ${netProfit >= 0 ? "text-profit" : "text-loss"}`} style={{ fontSize: '1.35rem' }}>
              {netProfit >= 0 ? "+" : ""}{netProfit.toLocaleString()} DZD
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1.25rem', backgroundColor: 'var(--bg-surface)' }}>
            <span className="form-label">{t.stock}</span>
            <span className="mono-display" style={{ fontSize: '1.35rem', fontWeight: 500 }}>
              {totalStock} {t.pcsSymbol}
            </span>
          </div>



        </div>

        {/* Row 2: Form, Calendar, Stock & Notepad in Bento Grid layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '400px 1.4fr 1.1fr',
          gap: '1.5rem',
          alignItems: 'start'
        }} className="main-board-layout">
          
          {/* Left: Input Calculator Form */}
          <Calculator onAddTransaction={handleAddTransaction} lang={lang} />

          {/* Middle: Calendar Tracker */}
          <CalendarTracker 
            transactions={transactions} 
            selectedDate={selectedDate} 
            onSelectDate={setSelectedDate}
            onMonthChange={(y, m) => {
              setActiveYear(y);
              setActiveMonth(m);
            }}
            lang={lang}
          />

          {/* Right: Stacked Inventory Panel and Notepad */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* T-Shirt Inventory Status Card */}
            <div className="bento-panel">
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 500, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                {t.inventoryTitle}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {(Object.keys(inventory) as Array<keyof typeof inventory>).map((key) => {
                  const count = inventory[key];
                  const isLow = count < 10;
                  const colorLabel = t.colors[key];
                  
                  return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: COLOR_MAP[key]?.bg || '#7A7A78',
                          border: COLOR_MAP[key]?.border || 'none',
                          flexShrink: 0
                        }}></span>
                        {colorLabel}
                      </span>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        {isLow && (
                          <span className="badge badge-red" style={{ fontSize: '0.55rem', padding: '0.1rem 0.3rem' }}>
                            {t.lowStock}
                          </span>
                        )}
                        <span className={`mono-display font-semibold ${isLow ? 'text-loss' : 'var(--text-primary)'}`} style={{ fontSize: '0.9rem' }}>
                          {count} {t.pcsSymbol}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notepad & Reminders */}
            <Notepad lang={lang} />
          </div>

        </div>

        {/* Row 3: Detail Ledger list for selected day */}
        <div className="bento-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 500 }}>
                {t.ledgerTitle} <span className="mono-display" style={{ color: 'var(--text-primary)', fontSize: '1.15rem', marginLeft: '0.5rem' }}>{selectedDate}</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {t.ledgerDesc}
              </p>
            </div>
            {dayTransactions.length > 0 && (
              <span className="badge badge-purple" style={{ padding: '0.25rem 0.6rem' }}>
                {dayTransactions.length} {t.transactionsLogged}
              </span>
            )}
          </div>

          {/* Day Table */}
          {dayTransactions.length > 0 ? (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table className="editorial-table">
                <thead>
                  <tr>
                    <th>{t.actionType}</th>
                    <th>{t.color}</th>
                    <th style={{ textAlign: 'center' }}>{t.qty}</th>
                    <th style={{ textAlign: 'right' }}>{t.unitCost}</th>
                    <th style={{ textAlign: 'right' }}>{t.unitPrice}</th>
                    <th style={{ textAlign: 'right' }}>{t.otherCost}</th>
                    <th style={{ textAlign: 'right' }}>{t.totalExpenses}</th>
                    <th style={{ textAlign: 'right' }}>{t.totalRevenue}</th>
                    <th style={{ textAlign: 'right' }}>{t.netMargin}</th>
                    <th style={{ textAlign: 'center' }}>{t.action}</th>
                  </tr>
                </thead>
                <tbody>
                  {dayTransactions.map((tx) => {
                    const margin = tx.totalRevenue > 0 ? Math.round((tx.netProfit / tx.totalRevenue) * 100) : 0;
                    
                    return (
                      <tr key={tx.id}>
                        <td style={{ fontWeight: 600 }}>
                          <span className={`badge ${tx.action === "sell" ? "badge-green" : "badge-blue"}`}>
                            {tx.action === "sell" ? t.sell : t.buy}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: COLOR_MAP[tx.color]?.bg || '#7A7A78',
                              border: COLOR_MAP[tx.color]?.border || 'none',
                              flexShrink: 0
                            }}></span>
                            {tx.colorName}
                          </div>
                        </td>
                        <td style={{ 
                          textAlign: 'center', 
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          color: tx.action === "sell" ? "var(--pastel-red-text)" : "var(--pastel-blue-text)"
                        }}>
                          {tx.action === "sell" ? `-${tx.quantity}` : `+${tx.quantity}`}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          {tx.action === "buy" ? (tx.garmentCost || 0).toLocaleString() : "—"}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          {tx.action === "sell" ? (tx.sellingPrice || 0).toLocaleString() : "—"}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{(tx.otherCost || 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{(tx.totalCost || 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{(tx.totalRevenue || 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          <span className={(tx.netProfit || 0) >= 0 ? "badge badge-green" : "badge badge-red"}>
                            {(tx.netProfit || 0) >= 0 ? "+" : ""}{(tx.netProfit || 0).toLocaleString()} {tx.action === "sell" && `(${margin}%)`}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="btn-danger-link"
                            id={`delete-btn-${tx.id}`}
                          >
                            {t.delete}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              padding: '2.5rem 0',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.85rem'
            }}>
              {t.noTransactions}
            </div>
          )}
        </div>

      </main>

      {/* Styled inline media styles to ensure mobile responsive design */}
      <style jsx global>{`
        @media (max-width: 1200px) {
          .main-board-layout {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 968px) {
          .kpi-row-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .header-meta-details {
            display: none !important;
          }
        }
        @media (max-width: 580px) {
          .kpi-row-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
