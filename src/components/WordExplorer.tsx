import { useState } from "react";
import { Folder, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWordStore } from "@/hooks/useWordStore";

export function WordExplorer() {
    // 1. Get words and folders from your existing store
    const { words, folders } = useWordStore();

    // 2. State to keep track of which folders are clicked, and if the box is expanded
    const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
    const [showAll, setShowAll] = useState(false);

    // 3. Logic to handle clicking a folder (adds it if missing, removes it if already selected)
    const toggleFolder = (folderName: string) => {
        setSelectedFolders((prev) =>
            prev.includes(folderName)
                ? prev.filter((f) => f !== folderName)
                : [...prev, folderName]
        );
    };

    // 4. Filter the words. If no folders are selected, we show all words.
    const filteredWords = selectedFolders.length > 0
        ? words.filter((w) => selectedFolders.includes(w.folder))
        : words;

    // 5. Logic for the "Show More" button (let's limit to 25 words initially)
    const DISPLAY_LIMIT = 25;
    const displayedWords = showAll ? filteredWords : filteredWords.slice(0, DISPLAY_LIMIT);
    const hasMore = filteredWords.length > DISPLAY_LIMIT;

    // If the user hasn't saved any words yet, hide this entire box
    if (words.length === 0) return null;

    return (
        <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm flex flex-col gap-4">

            {/* Header */}
            <div className="flex items-center gap-2">
                <Folder size={14} className="text-primary" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Explore Folders
                </p>
            </div>

            {/* Multi-Select Folder Buttons */}
            <div className="flex flex-wrap gap-2">
                {folders.map((folder) => {
                    const isSelected = selectedFolders.includes(folder.name);
                    return (
                        <button
                            key={folder.name}
                            onClick={() => toggleFolder(folder.name)}
                            className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-widest transition-all border ${isSelected
                                    ? "bg-primary text-primary-foreground border-primary" // Active state
                                    : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:border-border" // Inactive state
                                }`}
                        >
                            {folder.name} ({folder.count})
                        </button>
                    );
                })}
            </div>

            {/* Dense Word Display (Stacked horizontally and vertically) */}
            <div className="relative">
                <motion.div layout className="flex flex-wrap gap-1.5">
                    <AnimatePresence>
                        {displayedWords.map((w) => (
                            <motion.div
                                key={w.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="px-2 py-1 bg-background border border-border rounded-md font-mono text-xs font-bold text-foreground shadow-sm"
                            >
                                {w.word}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {/* Show More / Show Less Button */}
                {hasMore && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="mt-4 w-full flex items-center justify-center gap-1 py-2 rounded-xl border border-border bg-secondary/30 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-secondary transition-all text-muted-foreground"
                    >
                        {showAll ? (
                            <><ChevronUp size={12} /> Show Less</>
                        ) : (
                            <><ChevronDown size={12} /> Show {filteredWords.length - DISPLAY_LIMIT} More</>
                        )}
                    </button>
                )}

                {/* Fallback if a folder is empty */}
                {filteredWords.length === 0 && (
                    <p className="font-mono text-xs text-muted-foreground/50 py-4 text-center">
                        No words found in selected folders.
                    </p>
                )}
            </div>
        </div>
    );
}