"use client";

import React, { useState, useEffect } from "react";
import styles from "./CalendarTracker.module.css";
import { TransactionInput } from "./Calculator";

export interface SavedTransaction extends TransactionInput {
  id: string;
}

interface CalendarTrackerProps {
  transactions: SavedTransaction[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
  lang: "en" | "fr";
}

const MONTH_NAMES = {
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ],
  fr: [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ]
};

const WEEKDAYS = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  fr: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
};

export default function CalendarTracker({ 
  transactions, 
  selectedDate, 
  onSelectDate,
  onMonthChange,
  lang 
}: CalendarTrackerProps) {
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  useEffect(() => {
    onMonthChange(currentYear, currentMonth);
  }, [currentYear, currentMonth, onMonthChange]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Group transactions by date string
  const transactionsMap: { [dateStr: string]: SavedTransaction[] } = {};
  transactions.forEach((tx) => {
    if (!transactionsMap[tx.date]) {
      transactionsMap[tx.date] = [];
    }
    transactionsMap[tx.date].push(tx);
  });

  const cells: React.ReactNode[] = [];

  // Previous month padding
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(
      <div key={`empty-${i}`} className={`${styles.dayCell} ${styles.dayCellEmpty}`}></div>
    );
  }

  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    const dayTxs = transactionsMap[dayDateString] || [];
    const dayNetProfit = dayTxs.reduce((sum, tx) => sum + tx.netProfit, 0);
    const isActive = selectedDate === dayDateString;

    cells.push(
      <div
        key={`day-${day}`}
        className={`${styles.dayCell} ${isActive ? styles.dayCellActive : ""}`}
        onClick={() => onSelectDate(dayDateString)}
      >
        <div className={styles.dayNumber}>{day}</div>
        
        {dayTxs.length > 0 && (
          <div className={styles.indicators}>
            {dayTxs.length > 1 && (
              <span className={styles.ordersBadge}>{dayTxs.length}</span>
            )}
            
            {dayNetProfit !== 0 ? (
              <span className={`badge ${dayNetProfit > 0 ? "badge-green" : "badge-red"} ${styles.profitBadge}`}>
                {dayNetProfit > 0 ? "+" : ""}
                {Math.abs(dayNetProfit) >= 1000 
                  ? `${Math.round(dayNetProfit / 100) / 10}k` 
                  : `${dayNetProfit}`}
              </span>
            ) : (
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>0 DZD</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bento-panel">
      <div className={styles.calendarCard}>
        
        {/* Month Selector Header */}
        <div className={styles.header}>
          <h3 className={styles.monthTitle}>
            {MONTH_NAMES[lang][currentMonth]} {currentYear}
          </h3>
          <div className={styles.navControls}>
            <button onClick={handlePrevMonth} className={styles.navBtn} aria-label="Previous Month">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <button onClick={handleNextMonth} className={styles.navBtn} aria-label="Next Month">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </div>

        {/* Days Grid */}
        <div className={styles.grid}>
          {WEEKDAYS[lang].map((dayName) => (
            <div key={dayName} className={styles.weekdayHeader}>
              {dayName}
            </div>
          ))}
          {cells}
        </div>

      </div>
    </div>
  );
}
