import { useState, useRef } from "react";
import { Folder, Trash2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WordEntry, Folder as FolderType } from "@/hooks/useWordStore";

interface FolderTickerProps {
  words: WordEntry[];
  folders: FolderType[];
  onDelete: (id: string) => void;
  onSelectFolder: (folder: string | null) => void;
  selectedFolder: string | null;
}

function WordMarquee({ items, onDelete }: { items: WordEntry[]; onDelete: (id: string) => void }) {
  if (items.length === 0) {
    return (
      <p className="font-mono text-xs text-muted-foreground italic px-1">No words yet</p>
    );
  }

  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <motion.div
          className="flex gap-2 w-max"
          animate={{ x: [0, -(items.length * 120)] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: items.length * 3,
              ease: "linear",
            },
          }}
          drag="x"
          dragConstraints={{ left: -(doubled.length * 120), right: 0 }}
          style={{ cursor: "grab" }}
        >
          {doubled.map((entry, i) => (
            <div
              key={`${entry.id}-${i}`}
              className="group relative flex-shrink-0 rounded-md border border-border bg-background px-3 py-1.5 font-mono text-sm transition-colors hover:bg-accent"
            >
              {entry.word}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry.id);
                }}
                className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                aria-label="Delete"
              >
                <Trash2 size={8} />
              </button>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export function FolderTicker({ words, folders, onDelete, onSelectFolder, selectedFolder }: FolderTickerProps) {
  const allFolders = folders.length > 0 ? folders : [{ name: "General", count: 0 }];
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);

  const handleFolderClick = (folderName: string) => {
    onSelectFolder(selectedFolder === folderName ? null : folderName);
    setExpandedFolder((prev) => (prev === folderName ? null : folderName));
  };

  return (
    <div className="space-y-2 overflow-y-auto max-h-[35vh] pr-1">
      {allFolders.map((folder) => {
        const folderWords = words.filter((w) => w.folder === folder.name);
        const isSelected = selectedFolder === folder.name;
        const isExpanded = expandedFolder === folder.name;

        return (
          <motion.div
            key={folder.name}
            layout
            className={`rounded-lg border p-3 transition-colors cursor-pointer ${
              isSelected
                ? "border-foreground bg-card"
                : "border-border bg-card/50 hover:border-muted-foreground"
            }`}
            onClick={() => handleFolderClick(folder.name)}
          >
            <div className="flex items-center gap-2 mb-2">
              <Folder size={14} className={isSelected ? "text-foreground" : "text-muted-foreground"} />
              <span className="font-mono text-xs font-bold uppercase tracking-wider">
                {folder.name}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                ({folder.count})
              </span>
              <motion.span
                className="ml-auto text-muted-foreground"
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={12} />
              </motion.span>
            </div>

            {/* Marquee ticker (collapsed) */}
            {!isExpanded && <WordMarquee items={folderWords} onDelete={onDelete} />}

            {/* Expanded word list */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {folderWords.length === 0 ? (
                    <p className="font-mono text-xs text-muted-foreground italic py-2">No words yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {folderWords.map((entry) => (
                        <div
                          key={entry.id}
                          className="group relative rounded-md border border-border bg-background px-2.5 py-1 font-mono text-xs transition-colors hover:bg-accent"
                        >
                          {entry.word}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(entry.id);
                            }}
                            className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                            aria-label="Delete"
                          >
                            <Trash2 size={8} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
