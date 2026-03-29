import { useState, useEffect, useCallback } from "react";
import { Brain, RefreshCw, Folder, Clock, Shuffle, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WordEntry, Folder as FolderType } from "@/hooks/useWordStore";
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
  const [mistakesQueue, setMistakesQueue] = useState<WordEntry[]>([]);
  const [sessionResults, setSessionResults] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [showResults, setShowResults] = useState(false);
  const [view, setView] = useState<"quiz" | "practice">("quiz");

  const { lookup } = useDictionary();

  // Sync with global selection only if user hasn't picked a specific quiz folder yet
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
    setShowResults(false);

    let targetWord: WordEntry;

    // 40% chance to pick from mistakes if available
    if (mistakesQueue.length > 0 && Math.random() < 0.4) {
      targetWord = mistakesQueue[0];
      setMistakesQueue(prev => prev.slice(1));
    } else {
      targetWord = pool[Math.floor(Math.random() * pool.length)];
    }

    const entry = await lookup(targetWord.word);
    const def = entry?.meanings[0]?.definitions[0]?.definition || "No definition found.";
    
    setDefinition(def);
    setCurrentWord(targetWord);
    setLoading(false);
  }, [getWordPool, lookup, mistakesQueue]);

  useEffect(() => {
    if (words.length >= 1) {
      generateNext();
    }
  }, [mode, quizFolder]);

  const handleGreen = () => {
    setSessionResults(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
    generateNext();
  };

  const handleRed = () => {
    if (currentWord) {
      setMistakesQueue(prev => [...prev.filter(w => w.id !== currentWord.id), currentWord]);
    }
    setSessionResults(prev => ({ ...prev, total: prev.total + 1 }));
    generateNext();
  };

  const selectQuizFolder = (name: string) => {
    setQuizFolder(name);
    setMode("folder");
    setShowFolderPicker(false);
  };

  if (words.length < 1) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Brain size={24} className="mb-2 opacity-40" />
        <p className="font-mono text-xs">Save at least 1 word to start.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col relative">
      <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2 mb-3">
        <div className="flex items-center gap-1.5 font-mono text-xs relative">
          <button
            onClick={() => { setMode("random"); setView("quiz"); }}
            className={`flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${
              mode === "random" && view === "quiz" ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent"
            }`}
          >
            <Shuffle size={10} /> Random
          </button>
          <button
            onClick={() => { setMode("recent"); setView("quiz"); }}
            className={`flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${
              mode === "recent" && view === "quiz" ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent"
            }`}
          >
            <Clock size={10} /> Recent
          </button>
          
          <div className="relative">
            <button
              onClick={() => {
                if (mode !== "folder") setMode("folder");
                setShowFolderPicker(!showFolderPicker);
                setView("quiz");
              }}
              className={`flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${
                mode === "folder" && view === "quiz" ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent"
              }`}
            >
              <Folder size={10} /> {quizFolder}
            </button>

            <AnimatePresence>
              {showFolderPicker && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100]" onClick={() => setShowFolderPicker(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 top-full mt-2 z-[101] w-48 bg-card/90 backdrop-blur-xl border border-border rounded-xl shadow-xl p-2 max-h-[200px] overflow-y-auto no-scrollbar"
                  >
                    <div className="flex flex-col gap-1">
                      {folders.map(f => (
                        <button
                          key={f.name}
                          onClick={() => selectQuizFolder(f.name)}
                          className={`w-full text-left px-3 py-2 rounded-lg font-mono text-[10px] transition-colors ${
                            quizFolder === f.name ? "bg-primary/20 text-primary font-bold" : "hover:bg-secondary text-muted-foreground"
                          }`}
                        >
                          {f.name} ({f.count})
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setView("practice")}
            className={`flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${
              view === "practice" ? "bg-amber-500 text-white" : "border border-amber-500/30 text-amber-600 hover:bg-amber-50"
            }`}
          >
            Practice ({mistakesQueue.length})
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
                <p className="font-mono text-xs text-center">Preparing flashcard...</p>
              </div>
            ) : currentWord ? (
              <Flashcard 
                question={currentWord.word} 
                answer={definition} 
                onGreen={handleGreen} 
                onRed={handleRed} 
              />
            ) : null}
            
            <div className="flex justify-between items-center px-1">
               <span className="font-mono text-[10px] text-muted-foreground">
                 Session: {sessionResults.correct}/{sessionResults.total} Correct
               </span>
               <button onClick={() => setMistakesQueue([])} className="font-mono text-[10px] text-muted-foreground hover:text-destructive transition-colors">
                 Clear Mistakes
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
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider">Practice List</h4>
              <button onClick={() => setView("quiz")} className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-foreground">
                <ArrowLeft size={10} /> Back to Quiz
              </button>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {mistakesQueue.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground py-8 text-center italic">No words in practice list yet. Mark words you don't know during the quiz!</p>
              ) : (
                mistakesQueue.map(w => (
                  <div key={w.id} className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 flex justify-between items-center group">
                    <div>
                      <p className="font-mono text-sm font-bold">{w.word}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{w.folder}</p>
                    </div>
                    <button 
                      onClick={() => setMistakesQueue(prev => prev.filter(m => m.id !== w.id))}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-red-500/10 text-red-500 transition-all font-mono text-[10px]"
                    >
                      Got it!
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
