import { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, ChevronDown, ChevronRight, CheckCircle2, XCircle,
  BookOpen, Settings2, ArrowLeft, RefreshCw, X, Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Flashcard as FlashcardComp } from "./Flashcard";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface Deck {
  id: string;
  title: string;
  cards: Flashcard[];
}

const STORAGE_KEY = "wordvault_decks_v2";

function loadDecks(): Deck[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(raw) && raw.length >= 3) return raw;
  } catch { /* ignore */ }
  return [
    { id: crypto.randomUUID(), title: "Deck 1", cards: [] },
    { id: crypto.randomUUID(), title: "Deck 2", cards: [] },
    { id: crypto.randomUUID(), title: "Deck 3", cards: [] },
  ];
}

function saveDecks(decks: Deck[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
}
function BulkCreateModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (cards: Array<{ question: string; answer: string }>) => void;
}) {
  const INITIAL_ROWS = 5;
  const [rows, setRows] = useState<Array<{ q: string; a: string }>>(
    Array.from({ length: INITIAL_ROWS }, () => ({ q: "", a: "" }))
  );

  const addRow = () => setRows(r => [...r, { q: "", a: "" }]);
  const update = (i: number, field: "q" | "a", val: string) =>
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const handleCreate = () => {
    const filled = rows.filter(r => r.q.trim() && r.a.trim()).map(r => ({ question: r.q.trim(), answer: r.a.trim() }));
    if (filled.length > 0) { onAdd(filled); onClose(); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 12 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 flex-shrink-0">
          <h3 className="font-mono text-sm font-bold">Bulk Add Flashcards</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Grid header */}
        <div className="grid grid-cols-2 gap-3 px-5 pt-3 pb-1 flex-shrink-0">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Question</p>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Answer</p>
        </div>

        {/* Rows */}
        <div className="overflow-y-auto flex-1 px-5 py-2 space-y-2 custom-scrollbar">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <input
                value={row.q}
                onChange={e => update(i, "q", e.target.value)}
                placeholder={`Question ${i + 1}`}
                className="rounded-lg border border-border bg-background/50 px-3 py-2 font-mono text-xs outline-none focus:border-primary placeholder:text-muted-foreground/30 w-full"
              />
              <input
                value={row.a}
                onChange={e => update(i, "a", e.target.value)}
                placeholder={`Answer ${i + 1}`}
                className="rounded-lg border border-border bg-background/50 px-3 py-2 font-mono text-xs outline-none focus:border-primary placeholder:text-muted-foreground/30 w-full"
              />
            </div>
          ))}
          <button
            onClick={addRow}
            className="w-full flex items-center justify-center gap-1.5 py-2 mt-1 rounded-xl border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary font-mono text-[11px] transition-colors"
          >
            <Plus size={11} /> Add Row
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border/50 flex-shrink-0 bg-secondary/10">
          <p className="font-mono text-[11px] text-muted-foreground">{rows.filter(r => r.q.trim() && r.a.trim()).length} filled</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 font-mono text-xs rounded-md border border-border hover:bg-accent">Cancel</button>
            <button onClick={handleCreate} className="px-4 py-1.5 font-mono text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
              Create Cards
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Manage View ──────────────────────────────────────────────────────────────
function ManageView({ cards, onDelete, onBack, onUpdate }: {
  cards: Flashcard[];
  onDelete: (id: string) => void;
  onBack: () => void;
  onUpdate: (id: string, q: string, a: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [eq, setEq] = useState("");
  const [ea, setEa] = useState("");

  const startEdit = (card: Flashcard) => {
    setEditing(card.id); setEq(card.question); setEa(card.answer);
  };
  const saveEdit = (id: string) => {
    if (eq.trim() && ea.trim()) { onUpdate(id, eq.trim(), ea.trim()); }
    setEditing(null);
  };

  return (
    <div className="flex flex-col h-full">
      <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-mono text-xs mb-3 transition-colors self-start">
        <ArrowLeft size={11} /> Back to Session
      </button>
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">{cards.length} cards</p>
      <div className="space-y-1.5 overflow-y-auto flex-1 custom-scrollbar pr-1">
        {cards.length === 0 && (
          <p className="font-mono text-[11px] text-muted-foreground/40 text-center py-8">No cards yet.</p>
        )}
        {cards.map(card => (
          <div key={card.id} className="rounded-xl border border-border bg-card/60 px-3 py-2">
            {editing === card.id ? (
              <div className="space-y-1.5">
                <input value={eq} onChange={e => setEq(e.target.value)} className="w-full rounded-md border border-primary bg-background px-2 py-1 font-mono text-xs outline-none" />
                <input value={ea} onChange={e => setEa(e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1 font-mono text-xs outline-none" />
                <div className="flex gap-1.5 justify-end">
                  <button onClick={() => setEditing(null)} className="px-2 py-1 font-mono text-[10px] border border-border rounded-md hover:bg-accent">Cancel</button>
                  <button onClick={() => saveEdit(card.id)} className="px-2 py-1 font-mono text-[10px] bg-primary text-primary-foreground rounded-md">Save</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs font-semibold text-foreground">{card.question}</p>
                  <p className="font-mono text-[11px] text-muted-foreground mt-0.5">{card.answer}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(card)} className="p-1 text-muted-foreground hover:text-primary transition-colors"><Pencil size={11} /></button>
                  <button onClick={() => onDelete(card.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={11} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Session Mode ─────────────────────────────────────────────────────────────
function SessionMode({ cards, onEndSession, onImproveList }: {
  cards: Flashcard[];
  onEndSession: () => void;
  onImproveList: (ids: string[]) => void;
}) {
  // Proper Fisher-Yates Shuffle
  const shuffleCards = (array: Flashcard[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const [queue, setQueue] = useState<Flashcard[]>(() => shuffleCards(cards));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const current = queue[currentIdx];

  const advance = () => {
    if (currentIdx + 1 >= queue.length) { setDone(true); onImproveList(wrongIds); }
    else setCurrentIdx(i => i + 1);
  };

  const handleGreen = () => advance();
  const handleRed = () => { setWrongIds(prev => [...prev, current.id]); advance(); };

  const handleTryAgain = () => {
    const wrongCards = cards.filter(c => wrongIds.includes(c.id));
    setQueue(shuffleCards(wrongCards));
    setCurrentIdx(0);
    setWrongIds([]);
    setDone(false);
  };

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground/40 gap-3">
        <BookOpen size={24} />
        <p className="font-mono text-[11px]">No cards in this deck.</p>
        <button onClick={onEndSession} className="font-mono text-[10px] border border-border px-3 py-1.5 rounded-md hover:bg-accent transition-colors">
          ← Back
        </button>
      </div>
    );
  }

  if (done) {
    const wrongCards = cards.filter(c => wrongIds.includes(c.id));
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold">Session complete!</span>
          <button onClick={onEndSession} className="font-mono text-[10px] text-muted-foreground hover:text-foreground"><ArrowLeft size={11} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 flex flex-col items-center gap-1">
            <CheckCircle2 size={16} className="text-green-500" />
            <span className="font-mono text-xl font-bold text-green-500">{queue.length - wrongIds.length}</span>
            <span className="font-mono text-[11px] text-muted-foreground">Correct</span>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex flex-col items-center gap-1">
            <XCircle size={16} className="text-red-500" />
            <span className="font-mono text-xl font-bold text-red-500">{wrongIds.length}</span>
            <span className="font-mono text-[11px] text-muted-foreground">Practice</span>
          </div>
        </div>

        {wrongCards.length > 0 && (
          <>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Needs Practice</p>
            <div className="space-y-1 overflow-y-auto max-h-[200px] custom-scrollbar pr-1">
              {wrongCards.map(c => (
                <div key={c.id} className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                  <p className="font-mono text-xs font-semibold">{c.question}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{c.answer}</p>
                </div>
              ))}
            </div>
            <button
              onClick={handleTryAgain}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 font-mono text-[11px] hover:bg-amber-500/20 transition-colors"
            >
              <RefreshCw size={11} /> Try Again ({wrongCards.length} cards)
            </button>
          </>
        )}
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-muted-foreground">{currentIdx + 1} / {queue.length}</span>
        <button onClick={onEndSession} className="font-mono text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          <X size={10} /> End
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-border overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${((currentIdx) / queue.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
        >
          <FlashcardComp question={current.question} answer={current.answer} onGreen={handleGreen} onRed={handleRed} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── DeckPanel ────────────────────────────────────────────────────────────────
function DeckPanel({ deck, onUpdate }: {
  deck: Deck;
  onUpdate: (updated: Deck) => void;
}) {
  const [view, setView] = useState<"idle" | "session" | "manage">("idle");
  const [showModal, setShowModal] = useState(false);

  const addCards = (newCards: Array<{ question: string; answer: string }>) => {
    const cards: Flashcard[] = newCards.map(c => ({ id: crypto.randomUUID(), ...c }));
    onUpdate({ ...deck, cards: [...deck.cards, ...cards] });
  };

  const deleteCard = (id: string) => onUpdate({ ...deck, cards: deck.cards.filter(c => c.id !== id) });
  const updateCard = (id: string, q: string, a: string) => onUpdate({ ...deck, cards: deck.cards.map(c => c.id === id ? { ...c, question: q, answer: a } : c) });

  if (view === "session") {
    return (
      <SessionMode
        cards={deck.cards}
        onEndSession={() => setView("idle")}
        onImproveList={() => { }}
      />
    );
  }

  if (view === "manage") {
    return (
      <ManageView
        cards={deck.cards}
        onDelete={deleteCard}
        onBack={() => setView("idle")}
        onUpdate={updateCard}
      />
    );
  }

  // Idle view
  return (
    <div className="flex flex-col gap-3">
      {deck.cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40 gap-2">
          <BookOpen size={26} className="mb-1" />
          <p className="font-mono text-[11px]">No cards yet. Add some below!</p>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => setView("session")}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-mono text-xs hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
          >
            <BookOpen size={12} /> Start Session
          </button>
          <button
            onClick={() => setView("manage")}
            className="p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Manage cards"
          >
            <Settings2 size={13} />
          </button>
        </div>
      )}

      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary font-mono text-[11px] transition-colors"
      >
        <Plus size={11} /> Add Flashcards
      </button>

      {deck.cards.length > 0 && (
        <p className="font-mono text-xs text-muted-foreground/50 text-center">{deck.cards.length} card{deck.cards.length !== 1 ? "s" : ""} in this deck</p>
      )}

      <AnimatePresence>
        {showModal && (
          <BulkCreateModal onClose={() => setShowModal(false)} onAdd={addCards} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function FlashcardsSection() {
  const [decks, setDecks] = useState<Deck[]>(loadDecks);
  const [activeTab, setActiveTab] = useState(0);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [tabTitle, setTabTitle] = useState("");

  useEffect(() => { saveDecks(decks); }, [decks]);

  const updateDeck = (updated: Deck) => {
    setDecks(prev => prev.map(d => d.id === updated.id ? updated : d));
  };

  const startEditTitle = (deck: Deck) => { setEditingTabId(deck.id); setTabTitle(deck.title); };
  const saveTitle = (id: string) => {
    if (tabTitle.trim()) setDecks(prev => prev.map(d => d.id === id ? { ...d, title: tabTitle.trim() } : d));
    setEditingTabId(null);
  };

  const activeDeck = decks[activeTab] ?? decks[0];

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Browser-style Tab Bar */}
      <div className="flex items-stretch gap-1 border-b border-border/50 pb-0 -mx-0">
        {decks.map((deck, i) => (
          <div
            key={deck.id}
            onClick={() => setActiveTab(i)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-t-lg cursor-pointer transition-all duration-200 max-w-[120px] flex-1 ${
              i === activeTab
                ? "bg-card border border-border border-b-card text-foreground shadow-sm z-10"
                : "bg-secondary/30 text-muted-foreground hover:bg-secondary/60"
            }`}
            style={{ marginBottom: i === activeTab ? "-1px" : "0" }}
          >
            {editingTabId === deck.id ? (
              <input
                autoFocus
                value={tabTitle}
                onChange={e => setTabTitle(e.target.value)}
                onBlur={() => saveTitle(deck.id)}
                onKeyDown={e => { if (e.key === "Enter") saveTitle(deck.id); e.stopPropagation(); }}
                onClick={e => e.stopPropagation()}
                className="bg-transparent font-mono text-xs outline-none w-full min-w-0"
              />
            ) : (
              <span
                className="font-mono text-xs truncate flex-1"
                onDoubleClick={e => { e.stopPropagation(); startEditTitle(deck); }}
                title={deck.title}
              >
                {deck.title}
              </span>
            )}
            {i === activeTab && editingTabId !== deck.id && (
              <button
                onClick={e => { e.stopPropagation(); startEditTitle(deck); }}
                className="text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <Pencil size={8} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Active deck content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDeck.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <DeckPanel deck={activeDeck} onUpdate={updateDeck} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
