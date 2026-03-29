import { useState, useEffect, useCallback } from "react";
import { Brain, RefreshCw, Folder, Clock, Shuffle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WordEntry, Folder as FolderType } from "@/hooks/useWordStore";
import { useWordStore } from "@/hooks/useWordStore"; // Import your new store logic
import { useDictionary } from "@/hooks/useDictionary";
import { Flashcard } from "./Flashcard";

type QuizMode = "random" | "recent" | "folder";

interface QuizSectionProps {
  words: WordEntry[];
  folders: FolderType[];
  selectedFolder: string | null;
}

export function QuizSection({ words, folders, selectedFolder }: QuizSectionProps) {
  const [mode, setMode] = useState<QuizMode>("random");
  const [quizFolder, setQuizFolder] = useState<string>("General");
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [currentWord, setCurrentWord] = useState<WordEntry | null>(null);
  const [definition, setDefinition] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"quiz" | "practice">("quiz");

  const { lookup } = useDictionary();
  const { togglePractice, clearPracticeLog } = useWordStore(); // Use your new permanent actions

  // Sync with global selection
  useEffect(() => {
    if (selectedFolder) setQuizFolder(selectedFolder);
  }, [selectedFolder]);

  const getWordPool = useCallback(() => {
    if (words.length === 0) return [];

    const shuffle = (arr: WordEntry[]) => {
      const shuffled = [...arr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    switch (mode) {
      case "folder":
        return words.filter((w) => w.folder === quizFolder);
      case "recent":
        return [...words].sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
      case "random":
      default:
        return shuffle(words);
    }
  }, [words, mode, quizFolder]);

  const generateNext = useCallback(async () => {
    const pool = getWordPool();
    if (pool.length < 1) {
      setCurrentWord(null);
      setDefinition("");
      return;
    }

    setLoading(true);

    // Pick a random word from the pool
    const targetWord = pool[Math.floor(Math.random() * pool.length)];

    const entry = await lookup(targetWord.word);
    const def = entry?.meanings[0]?.definitions[0]?.definition || "No definition found.";

    setDefinition(def);
    setCurrentWord(targetWord);
    setLoading(false);
  }, [getWordPool, lookup]);

  useEffect(() => {
    if (words.length >= 1) {
      generateNext();
    }
  }, [mode, quizFolder, generateNext]);

  const handleGreen = () => {
    // If they get it right, we can optionally remove it from practice
    if (currentWord) togglePractice(currentWord.id, false);
    generateNext();
  };

  const handleRed = () => {
    if (currentWord) {
      togglePractice(currentWord.id, true); // Permanent save to "wrong" list
    }
    generateNext();
  };

  const practiceWords = words.filter(w => w.needsPractice);

  return (
    <div className="flex flex-col relative">
      {/* Header Controls */}
      <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2 mb-3">
        <div className="flex items-center gap-1.5 font-mono text-xs relative flex-wrap">
          <button
            onClick={() => { setMode("random"); setView("quiz"); }}
            className={`flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${mode === "random" && view === "quiz" ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent"
              }`}
          >
            <Shuffle size={10} /> Random
          </button>

          <button
            onClick={() => {
              if (mode !== "folder") setMode("folder");
              setShowFolderPicker(!showFolderPicker);
              setView("quiz");
            }}
            className={`flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${mode === "folder" && view === "quiz" ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent"
              }`}
          >
            <Folder size={10} /> {quizFolder}
          </button>

          {/* Folder Picker Dropdown */}
          <AnimatePresence>
            {showFolderPicker && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute left-0 top-full mt-2 z-[101] w-48 bg-card border border-border rounded-xl shadow-xl p-2 max-h-[200px] overflow-y-auto no-scrollbar"
              >
                {folders.map(f => (
                  <button
                    key={f.name}
                    onClick={() => { setQuizFolder(f.name); setMode("folder"); setShowFolderPicker(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg font-mono text-[10px] hover:bg-accent"
                  >
                    {f.name} ({f.count})
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setView("practice")}
            className={`flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${view === "practice" ? "bg-amber-500 text-white" : "border border-amber-500/30 text-amber-600 hover:bg-amber-50"
              }`}
          >
            Practice ({practiceWords.length})
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === "quiz" ? (
          <motion.div
            key={currentWord?.id || "loading"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-4"
          >
            {loading ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <RefreshCw size={24} className="animate-spin mb-2" />
                <p className="font-mono text-xs">Preparing card...</p>
              </div>
            ) : currentWord ? (
              <Flashcard
                question={currentWord.word}
                answer={definition}
                onGreen={handleGreen}
                onRed={handleRed}
              />
            ) : null}

            {/* Session Counter Removed as requested */}
            <div className="flex justify-end px-1">
              <button onClick={clearPracticeLog} className="font-mono text-[10px] text-muted-foreground/50 hover:text-destructive transition-colors">
                Reset Practice List
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="practice-list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider">Needs Practice</h4>
              <button onClick={() => setView("quiz")} className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-foreground">
                <ArrowLeft size={10} /> Back to Quiz
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {practiceWords.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground py-8 text-center italic">No words marked for practice.</p>
              ) : (
                practiceWords.map(w => (
                  <div key={w.id} className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 flex justify-between items-center group">
                    <div>
                      <p className="font-mono text-sm font-bold">{w.word}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{w.folder}</p>
                    </div>
                    <button
                      onClick={() => togglePractice(w.id, false)}
                      className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded bg-red-500/10 text-red-500 font-mono text-[9px]"
                    >
                      Learned!
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
