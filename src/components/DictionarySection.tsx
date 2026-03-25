import { useState, useEffect, useCallback } from "react";
import { BookOpen, Clock, Shuffle, Folder, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WordEntry, Folder as FolderType } from "@/hooks/useWordStore";
import { useDictionary, type DictionaryEntry } from "@/hooks/useDictionary";

type FilterMode = "folder" | "recent" | "random";

interface DictionarySectionProps {
  words: WordEntry[];
  folders: FolderType[];
  selectedFolder: string | null;
}

export function DictionarySection({ words, folders, selectedFolder }: DictionarySectionProps) {
  const [mode, setMode] = useState<FilterMode>(selectedFolder ? "folder" : "recent");
  const [entries, setEntries] = useState<Map<string, DictionaryEntry | null>>(new Map());
  const [displayWords, setDisplayWords] = useState<WordEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { lookup } = useDictionary();

  const getFilteredWords = useCallback(() => {
    if (words.length === 0) return [];
    switch (mode) {
      case "folder":
        return selectedFolder
          ? words.filter((w) => w.folder === selectedFolder)
          : words.slice(0, 10);
      case "recent":
        return [...words].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
      case "random": {
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 8);
      }
      default:
        return words.slice(0, 10);
    }
  }, [words, mode, selectedFolder]);

  useEffect(() => {
    const filtered = getFilteredWords();
    setDisplayWords(filtered);
    setExpandedId(null);

    filtered.forEach(async (w) => {
      if (!entries.has(w.word.toLowerCase())) {
        const result = await lookup(w.word);
        setEntries((prev) => new Map(prev).set(w.word.toLowerCase(), result));
      }
    });
  }, [mode, selectedFolder, words]);

  const handleShuffle = () => {
    setMode("random");
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 8);
    setDisplayWords(shuffled);
    setExpandedId(null);
    shuffled.forEach(async (w) => {
      if (!entries.has(w.word.toLowerCase())) {
        const result = await lookup(w.word);
        setEntries((prev) => new Map(prev).set(w.word.toLowerCase(), result));
      }
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col">
      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 mb-3">
        <button
          onClick={() => setMode("folder")}
          className={`flex items-center gap-1 rounded-full px-3 py-1 font-mono text-xs transition-colors ${
            mode === "folder"
              ? "bg-primary text-primary-foreground"
              : "border border-border hover:bg-accent"
          }`}
        >
          <Folder size={10} />
          {selectedFolder || "Folder"}
        </button>
        <button
          onClick={() => setMode("recent")}
          className={`flex items-center gap-1 rounded-full px-3 py-1 font-mono text-xs transition-colors ${
            mode === "recent"
              ? "bg-primary text-primary-foreground"
              : "border border-border hover:bg-accent"
          }`}
        >
          <Clock size={10} />
          Recent
        </button>
        <button
          onClick={handleShuffle}
          className={`flex items-center gap-1 rounded-full px-3 py-1 font-mono text-xs transition-colors ${
            mode === "random"
              ? "bg-primary text-primary-foreground"
              : "border border-border hover:bg-accent"
          }`}
        >
          <Shuffle size={10} />
          Random
        </button>
      </div>

      {/* Horizontal scrollable dictionary cards */}
      {displayWords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <BookOpen size={24} className="mb-2 opacity-40" />
          <p className="font-mono text-xs">Save words to see definitions here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-hide pb-2">
          <div className="flex gap-2.5 w-max">
            <AnimatePresence initial={false}>
              {displayWords.map((w) => {
                const entry = entries.get(w.word.toLowerCase());
                const isExpanded = expandedId === w.id;
                const firstMeaning = entry?.meanings[0];
                const firstDef = firstMeaning?.definitions[0];

                return (
                  <motion.div
                    key={w.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => toggleExpand(w.id)}
                    className={`flex-shrink-0 rounded-lg border border-border bg-card cursor-pointer transition-colors hover:border-muted-foreground ${
                      isExpanded ? "w-72 p-3" : "w-44 p-3"
                    }`}
                  >
                    {/* Minimal view */}
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="font-mono text-sm font-bold truncate">{w.word}</h3>
                      {entry?.phonetic && (
                        <span className="font-mono text-[10px] text-muted-foreground ml-1 truncate">
                          {entry.phonetic}
                        </span>
                      )}
                    </div>

                    {entry === undefined && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Loader2 size={10} className="animate-spin" />
                        <span className="font-mono text-[10px]">Loading...</span>
                      </div>
                    )}

                    {entry === null && (
                      <p className="font-mono text-[10px] text-muted-foreground italic">
                        No definition found.
                      </p>
                    )}

                    {entry && !isExpanded && (
                      <div>
                        {firstMeaning && (
                          <span className="inline-block rounded-sm bg-secondary px-1 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1">
                            {firstMeaning.partOfSpeech}
                          </span>
                        )}
                        {firstDef && (
                          <p className="font-mono text-[11px] leading-snug text-muted-foreground line-clamp-2">
                            {firstDef.definition}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Expanded view */}
                    <AnimatePresence>
                      {isExpanded && entry && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          {entry.meanings.map((m, mi) => (
                            <div key={mi} className="mt-1.5">
                              <span className="inline-block rounded-sm bg-secondary px-1 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1">
                                {m.partOfSpeech}
                              </span>
                              {m.definitions.map((d, di) => (
                                <div key={di} className="ml-1.5 mb-1.5">
                                  <p className="font-mono text-[11px] leading-relaxed">
                                    {d.definition}
                                  </p>
                                  {d.example && (
                                    <p className="font-mono text-[10px] text-muted-foreground mt-0.5 italic">
                                      "{d.example}"
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                          <div className="mt-2 flex items-center gap-1">
                            <span className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground flex items-center gap-0.5">
                              <Folder size={7} />
                              {w.folder}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
