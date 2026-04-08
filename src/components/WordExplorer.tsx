import { useState, useEffect, useRef } from "react";
import { Folder, ChevronDown, ChevronUp, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWordStore } from "@/hooks/useWordStore";

export function WordExplorer() {
    const { words, folders, updateWord } = useWordStore();
    const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
    const [showAll, setShowAll] = useState(false);

    // Track which word is open, and which ones are currently thinking
    const [expandedWordId, setExpandedWordId] = useState<string | null>(null);
    const [loadingWords, setLoadingWords] = useState<Record<string, boolean>>({});

    const workerRef = useRef<Worker | null>(null);

    // Initialize Web Worker when the component mounts
    useEffect(() => {
        workerRef.current = new Worker(new URL('../workers/ai.worker.ts', import.meta.url), { type: 'module' });

        workerRef.current.onmessage = (e) => {
            const { id, definition, example, error } = e.data;

            // Stop the loading spinner
            setLoadingWords((prev) => ({ ...prev, [id]: false }));

            // Permanently save to vault so we never run AI for this word again!
            if (!error) {
                updateWord(id, { definition, example });
            }
        };

        return () => workerRef.current?.terminate();
    }, [updateWord]);

    const toggleFolder = (folderName: string) => {
        setSelectedFolders((prev) =>
            prev.includes(folderName) ? prev.filter((f) => f !== folderName) : [...prev, folderName]
        );
    };

    const handleWordClick = (wordObj: any) => {
        if (expandedWordId === wordObj.id) {
            setExpandedWordId(null); // Close if clicked again
            return;
        }

        setExpandedWordId(wordObj.id); // Open the block

        // If we DO NOT have the definition saved, and we aren't currently loading it, run the AI!
        if (!wordObj.definition && !loadingWords[wordObj.id]) {
            setLoadingWords((prev) => ({ ...prev, [wordObj.id]: true }));
            workerRef.current?.postMessage({ word: wordObj.word, id: wordObj.id });
        }
    };

    const filteredWords = selectedFolders.length > 0
        ? words.filter((w) => selectedFolders.includes(w.folder))
        : words;

    const DISPLAY_LIMIT = 40;
    const displayedWords = showAll ? filteredWords : filteredWords.slice(0, DISPLAY_LIMIT);
    const hasMore = filteredWords.length > DISPLAY_LIMIT;

    if (words.length === 0) return null;

    return (
        // Replaced the "box" with a flex column that blends into the background
        <div className="flex flex-col gap-4 w-full">

            {/* Filters */}
            <div className="flex flex-wrap gap-2 sticky top-0 z-20 bg-background/95 py-2 backdrop-blur-sm">
                {folders.map((folder) => {
                    const isSelected = selectedFolders.includes(folder.name);
                    return (
                        <button
                            key={folder.name}
                            onClick={() => toggleFolder(folder.name)}
                            className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-widest transition-all border ${isSelected
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:border-border"
                                }`}
                        >
                            {folder.name} ({folder.count})
                        </button>
                    );
                })}
            </div>

            {/* Dynamic Word Cloud */}
            <motion.div layout className="flex flex-wrap gap-2 items-start">
                <AnimatePresence>
                    {displayedWords.map((w) => {
                        const isExpanded = expandedWordId === w.id;
                        const isLoading = loadingWords[w.id];

                        return (
                            <motion.div
                                key={w.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={() => handleWordClick(w)}
                                className={`relative cursor-pointer overflow-hidden rounded-xl border border-border shadow-sm transition-colors ${isExpanded ? "w-full bg-card shadow-md" : "bg-background hover:bg-secondary/50"
                                    }`}
                            >
                                {/* The Word Itself */}
                                <motion.div layout className={`px-3 py-2 font-mono font-bold text-foreground ${isExpanded ? 'text-sm border-b border-border/50 bg-secondary/30' : 'text-xs'}`}>
                                    {w.word}
                                    {!w.definition && isExpanded && !isLoading && (
                                        <Sparkles size={10} className="inline ml-1.5 mb-0.5 text-primary opacity-60" />
                                    )}
                                </motion.div>

                                {/* The Expanding Definition Panel */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="px-3"
                                        >
                                            <div className="py-3 flex flex-col gap-2">
                                                {isLoading ? (
                                                    <div className="flex items-center gap-2 text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
                                                        <Loader2 size={12} className="animate-spin text-primary" />
                                                        AI is reading dictionary...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="text-sm text-foreground/90 leading-snug">
                                                            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-0.5">Definition</span>
                                                            {w.definition}
                                                        </div>
                                                        {w.example && (
                                                            <div className="text-sm text-foreground/90 italic border-l-2 border-primary/30 pl-2 mt-1">
                                                                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-0.5 not-italic">Example</span>
                                                                "{w.example}"
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            {/* Show More */}
            {hasMore && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full flex items-center justify-center gap-1 py-2 mt-2 rounded-xl border border-border bg-secondary/30 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-secondary transition-all text-muted-foreground"
                >
                    {showAll ? <><ChevronUp size={12} /> Collapse</> : <><ChevronDown size={12} /> Show {filteredWords.length - DISPLAY_LIMIT} More</>}
                </button>
            )}
        </div>
    );
}