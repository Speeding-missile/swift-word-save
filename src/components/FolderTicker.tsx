import { useState, useRef } from "react";
import { Folder, Trash2, ArrowLeft, Hash, Pencil, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WordEntry, Folder as FolderType } from "@/hooks/useWordStore";
import { useDictionary } from "@/hooks/useDictionary";

interface FolderTickerProps {
  words: WordEntry[];
  folders: FolderType[];
  onDelete: (id: string) => void;
  onSelectFolder: (folder: string | null) => void;
  selectedFolder: string | null;
}

// ─── Folder emoji icons (user can pick one) ──────────────────────────────────
const EMOJI_OPTIONS = ["📁","📂","📚","📖","🗂️","🗒️","📝","💡","🌟","🔥","🎯","🧠","🌿","🎨","🛠️","📌","🔖","💼","🧩","🌈"];

// ─── Dict-enriched Pinterest word card ────────────────────────────────────────
function WordCard({ entry, onDelete }: { entry: WordEntry; onDelete: (id: string) => void }) {
  const { lookup } = useDictionary();
  const [def, setDef] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadDef = async () => {
    if (loaded) return;
    const data = await lookup(entry.word);
    const meaning = data?.meanings[0]?.definitions[0]?.definition;
    setDef(meaning ?? null);
    setLoaded(true);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      onViewportEnter={loadDef}
      className="group relative rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 p-3 flex flex-col gap-1.5"
    >
      <span className="font-mono text-xs font-bold leading-tight text-foreground">{entry.word}</span>
      {def !== null
        ? <p className="font-mono text-[11px] text-muted-foreground leading-snug">{def}</p>
        : loaded ? <p className="font-mono text-[11px] text-muted-foreground/40 italic">No definition found</p>
        : <div className="h-2 rounded-full bg-muted/50 w-3/4 animate-pulse" />
      }
      <button
        onClick={e => { e.stopPropagation(); onDelete(entry.id); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-4 w-4 flex items-center justify-center rounded-full bg-destructive/80 text-destructive-foreground transition-opacity"
        aria-label="Delete"
      >
        <Trash2 size={8} />
      </button>
    </motion.div>
  );
}

// ─── In-place Folder Content View ─────────────────────────────────────────────
function FolderView({ name, words, onDelete, onBack }: {
  name: string;
  words: WordEntry[];
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="flex flex-col h-full"
    >
      {/* Back header */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-mono text-xs transition-colors"
        >
          <ArrowLeft size={11} /> All Folders
        </button>
        <span className="text-muted-foreground/40">/</span>
        <span className="font-mono text-xs font-bold flex items-center gap-1 truncate">
          <Folder size={11} className="text-primary flex-shrink-0" />{name}
        </span>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground flex-shrink-0">{words.length}w</span>
      </div>

      {/* Pinterest 2-col grid */}
      {words.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground/30">
          <Hash size={22} className="mb-2" />
          <p className="font-mono text-[11px]">Empty folder</p>
        </div>
      ) : (
        <div className="columns-2 gap-2 overflow-y-auto custom-scrollbar pr-1 space-y-0">
          <AnimatePresence>
            {words.map(w => (
              <div key={w.id} className="break-inside-avoid mb-2">
                <WordCard entry={w} onDelete={onDelete} />
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ─── Folder Row with emoji picker ─────────────────────────────────────────────
function FolderRow({ folder, count, onOpen, onSetEmoji }: {
  folder: FolderType & { emoji?: string };
  count: number;
  onOpen: () => void;
  onSetEmoji: (e: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative group">
      <button
        onClick={onOpen}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-card/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 text-left"
      >
        {/* Folder icon with emoji edit trigger */}
        <div className="relative flex-shrink-0">
          <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors text-base">
            {(folder as any).emoji ?? <Folder size={14} className="text-primary" />}
          </div>
          <button
            onClick={e => { e.stopPropagation(); setShowPicker(v => !v); }}
            className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 h-4 w-4 flex items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-primary transition-all"
          >
            <Pencil size={7} />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs font-bold truncate">{folder.name}</p>
          <p className="font-mono text-[11px] text-muted-foreground/60">{count} word{count !== 1 ? "s" : ""}</p>
        </div>
        <div className="h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-secondary font-mono text-[11px] text-muted-foreground flex-shrink-0">
          {count}
        </div>
      </button>

      {/* Emoji picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="absolute left-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl p-2 grid grid-cols-5 gap-1"
          >
            {EMOJI_OPTIONS.map(em => (
              <button
                key={em}
                onClick={() => { onSetEmoji(em); setShowPicker(false); }}
                className="w-8 h-8 rounded-lg hover:bg-accent text-base flex items-center justify-center transition-colors"
              >
                {em}
              </button>
            ))}
            <button
              onClick={() => { onSetEmoji("default"); setShowPicker(false); }}
              title="Reset to default"
              className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors text-muted-foreground"
            >
              <Check size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── State for emoji overrides (persisted in localStorage) ───────────────────
const EMOJI_KEY = "wordvault_folder_emojis";
function loadEmojis(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(EMOJI_KEY) || "{}"); }
  catch { return {}; }
}
function saveEmojis(m: Record<string, string>) {
  localStorage.setItem(EMOJI_KEY, JSON.stringify(m));
}

// ─── Live word ticker ────────────────────────────────────────────────────────
function WordTicker({ words }: { words: WordEntry[] }) {
  if (words.length === 0) return null;
  // Duplicate for seamless loop
  const doubled = [...words, ...words];
  const speed = Math.max(8, words.length * 2.5);
  return (
    <div className="overflow-hidden mt-1 w-full" style={{ maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)" }}>
      <div
        className="flex gap-3 w-max"
        style={{
          animation: `marquee ${speed}s linear infinite`,
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.animationPlayState = "paused")}
        onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.animationPlayState = "running")}
      >
        {doubled.map((w, i) => (
          <span key={`${w.id}-${i}`} className="font-mono text-[11px] text-muted-foreground/70 whitespace-nowrap px-1.5 py-0.5 rounded-full bg-secondary/50">
            {w.word}
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function FolderTicker({ words, folders, onDelete, onSelectFolder }: FolderTickerProps) {
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [emojis, setEmojis] = useState<Record<string, string>>(loadEmojis);

  const setEmoji = (folderName: string, emoji: string) => {
    const updated = { ...emojis };
    if (emoji === "default") delete updated[folderName];
    else updated[folderName] = emoji;
    setEmojis(updated);
    saveEmojis(updated);
  };

  const handleOpen = (name: string) => { setOpenFolder(name); onSelectFolder(name); };
  const handleBack = () => { setOpenFolder(null); onSelectFolder(null); };

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/40">
        <Folder size={28} className="mb-2" />
        <p className="font-mono text-[11px]">Save words to see folders here.</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {openFolder ? (
        <FolderView
          key="view"
          name={openFolder}
          words={words.filter(w => w.folder === openFolder)}
          onDelete={onDelete}
          onBack={handleBack}
        />
      ) : (
        <motion.div
          key="list"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          className="space-y-2"
        >
          {folders.map(folder => {
            const folderWords = words.filter(w => w.folder === folder.name);
            return (
              <div key={folder.name} className="rounded-xl border border-border bg-card/60 overflow-hidden hover:border-primary/40 transition-colors group">
                <FolderRow
                  folder={{ ...folder, emoji: emojis[folder.name] }}
                  count={folderWords.length}
                  onOpen={() => handleOpen(folder.name)}
                  onSetEmoji={em => setEmoji(folder.name, em)}
                />
                {/* Live word ticker */}
                <div className="px-3 pb-2">
                  <WordTicker words={folderWords} />
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
