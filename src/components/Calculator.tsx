"use client";

import React, { useState, useEffect } from "react";
import styles from "./Calculator.module.css";

export interface TransactionInput {
  date: string;
  action: "buy" | "sell";
  color: "black" | "white" | "red" | "blue" | "grey";
  colorName: string;
  quantity: number;
  garmentCost: number;
  sellingPrice: number;
  otherCost: number;
  totalCost: number;
  totalRevenue: number;
  netProfit: number;
}

interface CalculatorProps {
  onAddTransaction: (transaction: TransactionInput) => void;
  lang: "en" | "fr";
}

const COLORS = [
  { value: "black", labelEn: "Black", labelFr: "Noir" },
  { value: "white", labelEn: "White", labelFr: "Blanc" },
  { value: "red", labelEn: "Red", labelFr: "Rouge" },
  { value: "blue", labelEn: "Blue", labelFr: "Bleu" },
  { value: "grey", labelEn: "Grey", labelFr: "Gris" },
];

const TRANSLATIONS = {
  en: {
    logTitle: "Record Transaction",
    action: "Action Type",
    buy: "Buy (Stock In)",
    sell: "Sell (Stock Out)",
    color: "T-Shirt Color",
    date: "Date",
    qty: "Quantity",
    garmentCost: "T-Shirt Cost (Unit)",
    sellingPrice: "Price (Unit)",
    otherCost: "Other Cost (Flat)",
    totalCost: "Expenses",
    totalRevenue: "Revenue",
    netProfit: "Profits",
    submitBtn: "Save Entry",
    unitProdCost: "Unit Cost",
    profitMargin: "Margin",
  },
  fr: {
    logTitle: "Enregistrer",
    action: "Type d'Action",
    buy: "Achat (Entrée Stock)",
    sell: "Vente (Sortie Stock)",
    color: "Couleur T-Shirt",
    date: "Date",
    qty: "Quantité",
    garmentCost: "Coût T-Shirt (Unité)",
    sellingPrice: "Prix (Unité)",
    otherCost: "Autre Coût (Fixe)",
    totalCost: "Dépenses",
    totalRevenue: "Revenus",
    netProfit: "Bénéfices",
    submitBtn: "Enregistrer",
    unitProdCost: "Coût Unitaire",
    profitMargin: "Marge",
  }
};

export default function Calculator({ onAddTransaction, lang }: CalculatorProps) {
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getTodayDateString());
  const [action, setAction] = useState<"buy" | "sell">("sell");
  const [color, setColor] = useState<TransactionInput["color"]>("black");
  const [quantity, setQuantity] = useState<number>(1);
  
  // Financial inputs
  const [garmentCost, setGarmentCost] = useState<number>(700); // Cost to buy raw shirt
  const [sellingPrice, setSellingPrice] = useState<number>(2500); // Price sold to client
  const [otherCost, setOtherCost] = useState<number>(0); // Other cost not scaling with quantity

  // Default values based on Action
  useEffect(() => {
    if (action === "buy") {
      setGarmentCost(700);
      setSellingPrice(0);
    } else {
      setGarmentCost(0);
      setSellingPrice(2500);
    }
  }, [action]);

  // Real-time calculations
  const totalCost = action === "buy" ? (garmentCost * quantity) + otherCost : otherCost;
  const totalRevenue = action === "sell" ? (sellingPrice * quantity) : 0;
  const netProfit = totalRevenue - totalCost;
  const marginPct = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const t = TRANSLATIONS[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const activeColor = COLORS.find(c => c.value === color);
    const colorName = activeColor ? (lang === "en" ? activeColor.labelEn : activeColor.labelFr) : color;

    onAddTransaction({
      date,
      action,
      color,
      colorName,
      quantity,
      garmentCost: action === "buy" ? garmentCost : 0,
      sellingPrice: action === "sell" ? sellingPrice : 0,
      otherCost,
      totalCost,
      totalRevenue,
      netProfit
    });

    setQuantity(1);
    setOtherCost(0);
    setDate(getTodayDateString());
  };

  return (
    <div className="bento-panel">
      <form onSubmit={handleSubmit} className={styles.calculatorCard}>
        <h3 className={styles.title}>{t.logTitle}</h3>
        
        <div className={styles.formGrid}>
          {/* Action (Buy/Sell) */}
          <div className="form-group">
            <label className="form-label">{t.action}</label>
            <select 
              value={action} 
              onChange={(e) => setAction(e.target.value as "buy" | "sell")} 
              className="form-select"
            >
              <option value="sell">{t.sell}</option>
              <option value="buy">{t.buy}</option>
            </select>
          </div>

          {/* Color */}
          <div className="form-group">
            <label className="form-label">{t.color}</label>
            <select 
              value={color} 
              onChange={(e) => setColor(e.target.value as TransactionInput["color"])} 
              className="form-select"
            >
              {COLORS.map(c => (
                <option key={c.value} value={c.value}>
                  {lang === "en" ? c.labelEn : c.labelFr}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="form-label">{t.date}</label>
            <input 
              type="date" 
              required
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="form-input"
            />
          </div>

          {/* Quantity */}
          <div className="form-group">
            <label className="form-label">{t.qty}</label>
            <input 
              type="number" 
              min="1" 
              required
              value={quantity} 
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
              className="form-input mono-display"
            />
          </div>

          <div className={styles.divider}></div>

          {/* Financials inputs */}
          <div className={styles.inputsRow}>
            {action === "buy" ? (
              <div className="form-group">
                <label className="form-label">{t.garmentCost}</label>
                <input 
                  type="number" 
                  min="0"
                  value={garmentCost} 
                  onChange={(e) => setGarmentCost(Math.max(0, parseInt(e.target.value) || 0))} 
                  className="form-input mono-display"
                />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">{t.sellingPrice}</label>
                <input 
                  type="number" 
                  min="0"
                  value={sellingPrice} 
                  onChange={(e) => setSellingPrice(Math.max(0, parseInt(e.target.value) || 0))} 
                  className="form-input mono-display"
                />
              </div>
            )}
          </div>

          {/* Flat Other Cost */}
          <div className="form-group">
            <label className="form-label">{t.otherCost}</label>
            <input 
              type="number" 
              min="0"
              value={otherCost} 
              onChange={(e) => setOtherCost(Math.max(0, parseInt(e.target.value) || 0))} 
              className="form-input mono-display"
            />
          </div>

          {/* Summary calculations (Spreadsheet Style) */}
          <div className={styles.calculationSection}>
            <div className={styles.calcRow}>
              <span>{t.totalCost}</span>
              <span className="mono-display">{totalCost.toLocaleString()} DZD</span>
            </div>
            {action === "sell" && (
              <>
                <div className={styles.calcRow}>
                  <span>{t.totalRevenue}</span>
                  <span className="mono-display">{totalRevenue.toLocaleString()} DZD</span>
                </div>
                <div className={styles.calcRow}>
                  <span>{t.profitMargin}</span>
                  <span className="mono-display font-semibold">{marginPct}%</span>
                </div>
              </>
            )}

            <div className={styles.divider}></div>

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>{t.netProfit}</span>
              <span className={`mono-display ${netProfit >= 0 ? "badge badge-green" : "badge badge-red"}`}>
                {netProfit >= 0 ? "+" : ""}{netProfit.toLocaleString()} DZD
              </span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary styles.submitBtn">
            {t.submitBtn}
          </button>
        </div>
      </form>
    </div>
  );
}
