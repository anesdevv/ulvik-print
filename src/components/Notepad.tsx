"use client";

import React, { useState, useEffect } from "react";
import styles from "./Notepad.module.css";

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  pinned: boolean;
}

interface NotepadProps {
  lang: "en" | "fr";
}

const TRANSLATIONS = {
  en: {
    title: "Reminders",
    placeholderTitle: "Title...",
    placeholderContent: "Write a quick note...",
    addBtn: "Save",
    cancelBtn: "Cancel",
    empty: "No reminders logged.",
  },
  fr: {
    title: "Rappels",
    placeholderTitle: "Titre...",
    placeholderContent: "Écrivez une note...",
    addBtn: "Enregistrer",
    cancelBtn: "Annuler",
    empty: "Aucun rappel enregistré.",
  }
};

const MOCK_NOTES = (): Note[] => [];

export default function Notepad({ lang }: NotepadProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("ulvik_notes_v4");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((n: any) => ({
            id: n.id || `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: n.title || "",
            content: n.content || "",
            date: n.date || new Date().toISOString().split('T')[0],
            pinned: Boolean(n.pinned)
          }));
          setNotes(sanitized);
        } else {
          throw new Error("Notes data is not an array");
        }
      } catch (e) {
        console.error("Error loading saved notes data:", e);
        const seeds = MOCK_NOTES();
        setNotes(seeds);
        localStorage.setItem("ulvik_notes_v4", JSON.stringify(seeds));
      }
    } else {
      const seeds = MOCK_NOTES();
      setNotes(seeds);
      localStorage.setItem("ulvik_notes_v4", JSON.stringify(seeds));
    }
  }, []);

  const saveNotes = (updated: Note[]) => {
    setNotes(updated);
    localStorage.setItem("ulvik_notes_v4", JSON.stringify(updated));
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() && !noteTitle.trim()) return;

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: noteTitle.trim() || "Note",
      content: noteContent.trim(),
      date: dateStr,
      pinned: false
    };

    saveNotes([newNote, ...notes]);
    setNoteTitle("");
    setNoteContent("");
    setIsAdding(false);
  };

  const handleDeleteNote = (id: string) => {
    const filtered = notes.filter(n => n.id !== id);
    saveNotes(filtered);
  };

  const handleTogglePin = (id: string) => {
    const updated = notes.map(n => {
      if (n.id === id) {
        return { ...n, pinned: !n.pinned };
      }
      return n;
    });
    saveNotes(updated);
  };

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.date.localeCompare(a.date);
  });

  const t = TRANSLATIONS[lang];

  return (
    <div className="bento-panel" style={{ height: '100%' }}>
      <div className={styles.notepadContainer}>
        
        {/* Title */}
        <h3 className={styles.title}>
          <span>{t.title}</span>
          {!isAdding && (
            <button 
              onClick={() => setIsAdding(true)} 
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.5rem', borderRadius: '4px' }}
              aria-label="Add Note"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          )}
        </h3>

        {/* Note Editor */}
        {isAdding && (
          <form onSubmit={handleAddNote} className={styles.noteInputArea}>
            <input 
              type="text" 
              placeholder={t.placeholderTitle}
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className={styles.noteTitleInput}
            />
            <textarea
              placeholder={t.placeholderContent}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className={styles.noteContentInput}
            />
            <div className={styles.noteActions}>
              <button 
                type="button" 
                onClick={() => {
                  setIsAdding(false);
                  setNoteTitle("");
                  setNoteContent("");
                }} 
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                {t.cancelBtn}
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                {t.addBtn}
              </button>
            </div>
          </form>
        )}

        {/* Notes Feed */}
        <div className={styles.notesList}>
          {sortedNotes.length > 0 ? (
            sortedNotes.map((note) => (
              <div 
                key={note.id} 
                className={`${styles.noteCard} ${note.pinned ? styles.noteCardPinned : ""}`}
              >
                <div className={styles.noteCardHeader}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span className={styles.noteCardTitle}>{note.title}</span>
                    <span className={`${styles.noteCardDate} mono-display`}>{note.date}</span>
                  </div>

                  <div className={styles.noteIconButtons}>
                    <button 
                      onClick={() => handleTogglePin(note.id)} 
                      className={`${styles.iconBtn} ${note.pinned ? styles.iconBtnActive : ""}`}
                      aria-label="Pin Note"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteNote(note.id)} 
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      aria-label="Delete Note"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                {note.content && (
                  <p className={styles.noteCardBody}>{note.content}</p>
                )}
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>{t.empty}</div>
          )}
        </div>

      </div>
    </div>
  );
}
