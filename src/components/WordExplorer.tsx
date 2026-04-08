import { useState } from "react";
import { Folder, ChevronDown, ChevronUp, BookOpen, PenLine, Loader2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWordStore } from "@/hooks/useWordStore";

export function WordExplorer() {
    const { words, folders, updateWord } = useWordStore();
    const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
    const [showAll, setShowAll] = useState(false);

    const [expandedWordId, setExpandedWordId] = useState<string | null>(null);
    const [fetchingId, setFetchingId] = useState<string | null>(null);
    const [showNoteForId, setShowNoteForId] = useState<string | null>(null);

    const toggleFolder = (folderName: string) => {
        setSelectedFolders((prev) =>
            prev.includes(folderName) ? prev.filter((f) => f !== folderName) : [...prev, folderName]
        );
    };

    const handleWordClick = async (w: any) => {
        if (expandedWordId === w.id) {
            setExpandedWordId(null);
            setShowNoteForId(null);
            return;
        }

        setExpandedWordId(w.id);

        if (!w.definition && fetchingId !== w.id) {
            setFetchingId(w.id);
            try {
                const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${w.word}`);
                if (res.ok) {
                    const data = await res.json();
                    const def = data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition || "Definition not found.";
                    updateWord(w.id, { definition: def });
                } else {
                    updateWord(w.id, { definition: "Definition not found." });
                }
            } catch (e) {
                updateWord(w.id, { definition: "Error fetching definition." });
            } finally {
                setFetchingId(null);
            }
        }
    };

    const filteredWords = selectedFolders.length > 0
        ? words.filter((w) => selectedFolders.includes(w.folder))
        : words;

    const DISPLAY_LIMIT = 40;
    const displayedWords = showAll ? filteredWords : filteredWords.slice(0, DISPLAY_LIMIT);
    const hasMore = filteredWords.length > DISPLAY_LIMIT;

    if (words.length === 0) return null;

    // CHANGED: Ultra-fast snappy transition (0.1s instead of 0.3s)
    const snappyTransition = { duration: 0, ease: "easeOut" as const };

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 sticky top-0 z-20 bg-background/95 py-2 backdrop-blur-sm">
                {folders.map((f) => (
                    <button
                        key={f.name}
                        onClick={() => toggleFolder(f.name)}
                        className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase transition-all border ${selectedFolders.includes(f.name) ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 text-muted-foreground border-transparent"
                            }`}
                    >
                        {f.name} ({f.count})
                    </button>
                ))}
            </div>

            {/* Dynamic Word Cloud */}
            <div className="flex flex-wrap gap-2 items-start">
                <AnimatePresence>
                    {displayedWords.map((w) => {
                        const isExpanded = expandedWordId === w.id;

                        return (
                            <motion.div
                                key={w.id}
                                // CHANGED: Removed the 'layout' prop here. Now it snaps instantly!
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={snappyTransition}
                                className={`relative overflow-hidden rounded-xl border border-border shadow-sm ${isExpanded ? "w-full bg-card shadow-md" : "bg-background hover:bg-secondary/50 cursor-pointer"
                                    }`}
                            >
                                {/* Header (The clickable word) */}
                                <div
                                    onClick={() => handleWordClick(w)}
                                    className={`px-3 py-2 flex items-center justify-between font-mono font-bold text-foreground cursor-pointer ${isExpanded ? 'text-sm border-b border-border/50 bg-secondary/30' : 'text-xs'}`}
                                >
                                    <span>{w.word}</span>
                                    {isExpanded && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowNoteForId(showNoteForId === w.id ? null : w.id); }}
                                            className="p-1 rounded-full hover:bg-primary/10 text-primary transition-colors"
                                        >
                                            <Plus size={14} className={`transform transition-transform ${showNoteForId === w.id ? 'rotate-45' : ''}`} />
                                        </button>
                                    )}
                                </div>

                                {/* Snappy Expanding Body */}
                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={snappyTransition}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-3 pb-4 pt-3 flex flex-col gap-3">

                                                {/* Definition Section */}
                                                <div>
                                                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground flex items-center gap-1 mb-1">
                                                        <BookOpen size={10} /> Definition
                                                    </span>
                                                    {fetchingId === w.id && !w.definition ? (
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Loader2 size={10} className="animate-spin" /> Fetching...
                                                        </span>
                                                    ) : (
                                                        <p className="text-xs text-foreground/80 leading-relaxed">
                                                            {w.definition || "No definition available."}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Snappy Expanding Note Section */}
                                                <AnimatePresence initial={false}>
                                                    {(w.note || showNoteForId === w.id) && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={snappyTransition}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="pt-2 border-t border-border/30 mt-1">
                                                                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground flex items-center gap-1 mb-1">
                                                                    <PenLine size={10} /> My Note
                                                                </span>
                                                                <textarea
                                                                    className="w-full bg-transparent border-none p-0 text-xs text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none transition-all leading-relaxed"
                                                                    autoFocus={showNoteForId === w.id && !w.note}
                                                                    rows={1}
                                                                    placeholder="Add a mnemonic or context..."
                                                                    defaultValue={w.note || ""}
                                                                    onInput={(e) => {
                                                                        const target = e.target as HTMLTextAreaElement;
                                                                        target.style.height = "auto";
                                                                        target.style.height = `${target.scrollHeight}px`;
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        updateWord(w.id, { note: e.target.value });
                                                                        if (!e.target.value) setShowNoteForId(null);
                                                                    }}
                                                                />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Show More */}
            {hasMore && (
                <button onClick={() => setShowAll(!showAll)} className="w-full flex items-center justify-center gap-1 py-2 mt-2 rounded-xl border border-border bg-secondary/30 font-mono text-[10px] font-bold uppercase transition-all text-muted-foreground hover:bg-secondary">
                    {showAll ? <><ChevronUp size={12} /> Collapse</> : <><ChevronDown size={12} /> Show {filteredWords.length - DISPLAY_LIMIT} More</>}
                </button>
            )}
        </div>
    );
}