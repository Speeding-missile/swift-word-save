import { useState, useRef } from "react";
import { Folder, Trash2, ArrowLeft, Hash, Pencil, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WordEntry, Folder as FolderType } from "@/hooks/useWordStore";
import { useDictionary } from "@/hooks/useDictionary";

interface FolderTickerProps {
  words: WordEntry[];
  folders: FolderType[];
  onDelete: (id: string) => void;
  onDeleteFolder: (name: string) => void;
  onSelectFolder: (folder: string | null) => void;
  selectedFolder: string | null;
}

// ─── Folder emoji icons (Expanded) ───────────────────────────────────────────
const EMOJI_OPTIONS = [
  "📁","📂","📚","📖","🗂️","🗒️","📝","💡","🌟","🔥","🎯","🧠","🌿","🎨","🛠️","📌","🔖","💼","🧩","🌈",
  "⚡","🚀","💎","🏆","👑","🔑","🎁","🎈","🎨","🎭","🎬","🎤","🎧","🎸","🎹","🎺","🎻","🎲","🎮","🕹️",
  "🌍","🌎","🌏","🌌","🪐","⭐","🌙","☀️","☁️","⛈️","❄️","🔥","💧","🌊","🍎","🥑","🍕","🍔","🍦","🍩",
  "🚲","🚗","✈️","🚢","🏠","🏢","🏥","🎒","🎓","🔭","🔬","🧬","⌛","⏳","📻","📱","💻","🖥️","⌨️","🖱️"
];

// ─── Folder Color Palettes ──────────────────────────────────────────────────
const FOLDER_COLORS = [
  { bg: "bg-blue-500/10", text: "text-blue-500" },
  { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  { bg: "bg-amber-500/10", text: "text-amber-500" },
  { bg: "bg-rose-500/10", text: "text-rose-500" },
  { bg: "bg-violet-500/10", text: "text-violet-500" },
  { bg: "bg-cyan-500/10", text: "text-cyan-500" },
  { bg: "bg-orange-500/10", text: "text-orange-500" },
  { bg: "bg-indigo-500/10", text: "text-indigo-500" },
];

const getFolderColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return FOLDER_COLORS[Math.abs(hash) % FOLDER_COLORS.length];
};

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

      {/* 2-col stable grid */}
      {words.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground/30">
          <Hash size={22} className="mb-2" />
          <p className="font-mono text-[11px]">Empty folder</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 overflow-y-auto custom-scrollbar pr-1 content-start items-start">
          <AnimatePresence mode="popLayout">
            {words.map(w => (
              <WordCard key={w.id} entry={w} onDelete={onDelete} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ─── Folder Row with emoji picker ─────────────────────────────────────────────
function FolderRow({ folder, count, onOpen, onSetEmoji, onDeleteClick }: {
  folder: FolderType & { emoji?: string };
  count: number;
  onOpen: () => void;
  onSetEmoji: (e: string) => void;
  onDeleteClick?: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const color = getFolderColor(folder.name);

  return (
    <div className={`relative group/folder ${showPicker ? 'z-[55]' : 'z-auto'}`}>
      <button
        onClick={onOpen}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-card/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 text-left"
      >
        <div className="relative flex-shrink-0">
          <div className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors text-base shadow-sm ${color.bg}`}>
            {folder.emoji ?? <Folder size={14} className={color.text} />}
          </div>
          <button
            onClick={e => { e.stopPropagation(); setShowPicker(v => !v); }}
            className="absolute -top-1.5 -right-1.5 opacity-0 group-hover/folder:opacity-100 h-5 w-5 flex items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-primary transition-all shadow-md active:scale-90"
          >
            <Pencil size={8} />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs font-bold truncate tracking-tight">{folder.name}</p>
          <p className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">{count} word{count !== 1 ? "s" : ""}</p>
        </div>

        {onDeleteClick && folder.name !== "General" && (
          <button
            onClick={e => { e.stopPropagation(); onDeleteClick(); }}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-40 group-hover/folder:opacity-100 transition-all mr-1"
            title="Delete Folder"
          >
            <Trash2 size={13} />
          </button>
        )}

        <div className="h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full bg-secondary/80 font-mono text-[10px] text-muted-foreground font-bold flex-shrink-0">
          {count}
        </div>
      </button>

      {/* Emoji picker - Contextual dropdown */}
      <AnimatePresence>
        {showPicker && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-40 bg-black/5" onClick={() => setShowPicker(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute left-3 top-full mt-1 z-50 bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-3 min-w-[200px]"
            >
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-border/30">
                <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Select Icon</span>
                <button onClick={() => setShowPicker(false)} className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-secondary text-muted-foreground">
                  <X size={12} />
                </button>
              </div>

              <div className="grid grid-cols-6 gap-1 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                {EMOJI_OPTIONS.map(em => (
                  <button
                    key={em}
                    onClick={() => { onSetEmoji(em); setShowPicker(false); }}
                    className="w-8 h-8 rounded-lg hover:bg-secondary text-base flex items-center justify-center transition-all hover:scale-110"
                  >
                    {em}
                  </button>
                ))}
              </div>
              
              <button
                 onClick={() => { onSetEmoji("default"); setShowPicker(false); }}
                 className="w-full mt-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground transition-all"
               >
                 Use Original Icon
               </button>
            </motion.div>
          </>
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
  const doubled = [...words, ...words];
  const speed = Math.max(8, words.length * 3);
  return (
    <div className="overflow-hidden mt-1 w-full" style={{ maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)" }}>
      <div
        className="flex gap-4 w-max"
        style={{ animation: `marquee ${speed}s linear infinite` }}
        onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.animationPlayState = "paused")}
        onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.animationPlayState = "running")}
      >
        {doubled.map((w, i) => (
          <span key={`${w.id}-${i}`} className="font-mono text-[12px] font-bold text-muted-foreground/80 whitespace-nowrap px-2 py-0.5 rounded-full bg-secondary/60 border border-border/20">
            {w.word}
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function FolderTicker({ words, folders, onDelete, onDeleteFolder, onSelectFolder }: FolderTickerProps) {
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [emojis, setEmojis] = useState<Record<string, string>>(loadEmojis);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const setEmoji = (folderName: string, emoji: string) => {
    const updated = { ...emojis };
    if (emoji === "default") delete updated[folderName];
    else updated[folderName] = emoji;
    setEmojis(updated);
    saveEmojis(updated);
  };

  const handleOpen = (name: string) => { setOpenFolder(name); onSelectFolder(name); };
  const handleBack = () => { setOpenFolder(null); onSelectFolder(null); };

  const performDelete = () => {
    if (confirmDelete) {
      onDeleteFolder(confirmDelete);
      setConfirmDelete(null);
    }
  };

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[160px] text-muted-foreground/40">
        <Folder size={28} className="mb-2" />
        <p className="font-mono text-[11px]">Save words to see folders here.</p>
      </div>
    );
  }

  return (
    <div className="relative">
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
            className="grid grid-cols-1 gap-3"
          >
            {folders.map(folder => {
              const folderWords = words.filter(w => w.folder === folder.name);
              return (
                <div key={folder.name} className="flex flex-col rounded-xl border border-border bg-card/60 hover:border-primary/40 transition-colors group">
                  <FolderRow
                    folder={{ ...folder, emoji: emojis[folder.name] }}
                    count={folderWords.length}
                    onOpen={() => handleOpen(folder.name)}
                    onSetEmoji={em => setEmoji(folder.name, em)}
                    onDeleteClick={() => setConfirmDelete(folder.name)}
                  />
                  <div className="px-3 pb-3">
                    <WordTicker words={folderWords} />
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-background/80 backdrop-blur-md rounded-2xl" onClick={() => setConfirmDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-[260px] p-5 bg-card border border-border rounded-2xl shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold text-foreground">Delete Folder?</h3>
                  <p className="mt-1.5 font-mono text-[9px] text-muted-foreground leading-relaxed uppercase tracking-wider">
                    Words will move to <span className="text-foreground font-bold italic">General</span>.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full mt-2">
                  <button 
                    onClick={performDelete}
                    className="w-full py-2 rounded-xl bg-destructive text-white font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-destructive/90 transition-all shadow-md shadow-destructive/20"
                  >
                    Confirm Delete
                  </button>
                  <button 
                    onClick={() => setConfirmDelete(null)}
                    className="w-full py-2 rounded-xl border border-border bg-secondary/30 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-secondary transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
