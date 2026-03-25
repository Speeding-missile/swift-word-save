import { Trash2, Folder } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WordEntry } from "@/hooks/useWordStore";

interface WordListProps {
  words: WordEntry[];
  onDelete: (id: string) => void;
  filterFolder: string | null;
}

export function WordList({ words, onDelete, filterFolder }: WordListProps) {
  const filtered = filterFolder ? words.filter((w) => w.folder === filterFolder) : words;

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="font-mono text-sm">No words saved yet.</p>
        <p className="font-mono text-xs mt-1">Type or speak to add your first word.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <AnimatePresence initial={false}>
        {filtered.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10, height: 0 }}
            className="group flex items-center justify-between rounded-md border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-card"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-base">{entry.word}</span>
              <span className="flex items-center gap-1 rounded-sm bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
                <Folder size={10} />
                {entry.folder}
              </span>
            </div>
            <button
              onClick={() => onDelete(entry.id)}
              className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
              aria-label="Delete word"
            >
              <Trash2 size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
