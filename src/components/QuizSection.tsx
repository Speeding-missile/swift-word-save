import { useState, useEffect, useCallback } from "react";
import { Brain, RefreshCw, Check, X, Folder, Clock, Shuffle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WordEntry, Folder as FolderType } from "@/hooks/useWordStore";
import { useWordStore } from "@/hooks/useWordStore";
import { useDictionary, type DictionaryEntry } from "@/hooks/useDictionary";
import { useAIStore } from "@/hooks/useAIStore";

type QuizMode = "random" | "recent" | "folder";
type QuizType = "synonym" | "antonym" | "definition";

interface QuizQuestion {
  word: string;
  correctAnswer: string;
  options: string[];
  type: QuizType;
}

interface QuizSectionProps {
  words: WordEntry[];
  folders: FolderType[];
  selectedFolder: string | null;
}

// Main quiz component
export function QuizSection({ words, folders, selectedFolder }: QuizSectionProps) {
  const [mode, setMode] = useState<QuizMode>("random");
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mistakesQueue, setMistakesQueue] = useState<QuizQuestion[]>([]);
  const [lastWord, setLastWord] = useState<string | null>(null);
  const { lookup } = useDictionary();
  const ai = useAIStore();
  const { updateWord, words: allWords } = useWordStore();

  const getWordPool = useCallback(() => {
    if (words.length === 0) return [];
    switch (mode) {
      case "folder":
        return selectedFolder
          ? words.filter((w) => w.folder === selectedFolder)
          : words;
      case "recent":
        return [...words].sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
      case "random":
      default:
        return [...words].sort(() => Math.random() - 0.5);
    }
  }, [words, mode, selectedFolder]);

  const generateQuestion = useCallback(async () => {
    const pool = getWordPool();
    if (pool.length < 2) return;

    setLoading(true);
    setSelected(null);
    setAnswered(false);

    // Duolingo Mistake Logic: 60% chance to retry a mistake if the queue has items
    if (mistakesQueue.length > 0 && Math.random() > 0.4) {
       // Find a mistake that wasn't the immediately previous word (to avoid tight loops)
       const viableMistakeIndex = mistakesQueue.findIndex(q => q.word !== lastWord);
       
       if (viableMistakeIndex !== -1) {
          const mistake = mistakesQueue[viableMistakeIndex];
          setMistakesQueue(prev => {
             const copy = [...prev];
             copy.splice(viableMistakeIndex, 1);
             return copy;
          });
          
          // Re-shuffle options to prevent simple button-position memorization
          const reshuffledOptions = shuffleArray([...mistake.options]);
          const newQ = { ...mistake, options: reshuffledOptions };
          
          setQuestion(newQ);
          setLastWord(newQ.word);
          setLoading(false);
          return;
       }
    }

    // Standard pool selection, explicitly avoiding the immediately previous word if pool > 1
    let targetWord = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && targetWord.word === lastWord) {
       const others = pool.filter(w => w.word !== lastWord);
       targetWord = others[Math.floor(Math.random() * others.length)];
    }

    const entry = await lookup(targetWord.word);

    if (!entry || entry.meanings.length === 0) {
      // Try another word
      const fallback = pool.filter((w) => w.id !== targetWord.id);
      if (fallback.length > 0) {
        const alt = fallback[Math.floor(Math.random() * fallback.length)];
        const altEntry = await lookup(alt.word);
        if (altEntry) {
          buildQuestion(alt.word, altEntry, pool);
        }
      }
      setLoading(false);
      return;
    }

    buildQuestion(targetWord.word, entry, pool);
    setLoading(false);
  }, [getWordPool, lookup]);

  const buildQuestion = async (word: string, entry: DictionaryEntry, pool: WordEntry[]) => {
    let quizType: QuizType = Math.random() > 0.5 ? "synonym" : "antonym";

    // Get synonyms/antonyms from the API response
    let relatedWords: string[] = [];
    entry.meanings.forEach((m) => {
      m.definitions.forEach((d: any) => {
        if (quizType === "synonym" && d.synonyms) {
          relatedWords.push(...d.synonyms);
        }
        if (quizType === "antonym" && d.antonyms) {
          relatedWords.push(...d.antonyms);
        }
      });
      if ((m as any).synonyms && quizType === "synonym") {
        relatedWords.push(...(m as any).synonyms);
      }
      if ((m as any).antonyms && quizType === "antonym") {
        relatedWords.push(...(m as any).antonyms);
      }
    });

    relatedWords = [...new Set(relatedWords.filter((w) => w.toLowerCase() !== word.toLowerCase()))];

    const hasSynonyms = relatedWords.length > 0;
    if (!hasSynonyms) {
      quizType = "definition";
    }

    const otherWords = pool
      .filter((w) => w.word.toLowerCase() !== word.toLowerCase())
      .sort(() => Math.random() - 0.5);

    let correctAnswer = "";
    const distractors: string[] = [];

    if (quizType === "definition") {
      correctAnswer = entry.meanings[0]?.definitions[0]?.definition || "";
      
      if (!correctAnswer) {
        // Word truly lacks everything. Return and hope the upstream generateQuestion fallback works.
        setQuestion(null);
        return;
      }

      // Distractors are definitions from other words in the pool
      for (const ow of otherWords) {
        if (distractors.length >= 3) break;
        const owEntry = await lookup(ow.word);
        const def = owEntry?.meanings[0]?.definitions[0]?.definition;
        if (def && def !== correctAnswer && !distractors.includes(def)) {
          distractors.push(def);
        }
      }

      // Fallbacks definitions
      const fallbackDefs = [
        "A system of elements organized around a central axis.", 
        "The act of moving swiftly in a particular direction.", 
        "A feeling of deep sorrow or grief.", 
        "To construct something anew using modern materials.",
        "An ancient artifact of unknown origin.",
        "The quality of being perfectly transparent."
      ].sort(() => Math.random() - 0.5);

      while (distractors.length < 3) {
        const fb = fallbackDefs.pop() || "Something completely unrelated.";
        if (!distractors.includes(fb)) distractors.push(fb);
      }

    } else {
      // Original logic for Synonym/Antonym quizzes
      correctAnswer = relatedWords[Math.floor(Math.random() * relatedWords.length)];

      // --- CACHE CHECK: lookup this word entry in the full set ---
      const wordEntry = allWords.find(w => w.word.toLowerCase() === word.toLowerCase());

      if (wordEntry?.aiDistractors && wordEntry.aiDistractors.length >= 3) {
        // ✅ Cache hit — use stored distractors immediately, no AI call
        distractors.push(...wordEntry.aiDistractors);
      } else if (ai.status === 'ready') {
        // ⚡ Cache miss — generate via AI then persist forever
        try {
          const fakeWords = await ai.generateFakeDefinitions(word, entry.meanings[0]?.definitions[0]?.definition || "");
          fakeWords.forEach((w: string) => distractors.push(w));
          // 💾 Save to localStorage so we never re-run the AI for this word
          if (wordEntry && fakeWords.length >= 3) {
            updateWord(wordEntry.id, { aiDistractors: fakeWords });
          }
        } catch (err) {
          console.error("AI Option Generation failed:", err);
        }
      }

      // Fill remaining distractors from pool if AI failed, was not loaded, or didn't provide enough
      for (const ow of otherWords) {
        if (distractors.length >= 3) break;
        const owEntry = await lookup(ow.word);
        if (!owEntry) continue;
        const owRelated: string[] = [];
        owEntry.meanings.forEach((m) => {
          m.definitions.forEach((d: any) => {
            if (d.synonyms) owRelated.push(...d.synonyms);
            if (d.antonyms) owRelated.push(...d.antonyms);
          });
          if (m.synonyms) owRelated.push(...m.synonyms);
          if (m.antonyms) owRelated.push(...m.antonyms);
        });
        const candidates = [...new Set(owRelated)].filter(
          (w) =>
            w.toLowerCase() !== word.toLowerCase() &&
            w.toLowerCase() !== correctAnswer.toLowerCase() &&
            !relatedWords.includes(w.toLowerCase()) &&
            !distractors.includes(w.toLowerCase())
        );
        if (candidates.length > 0) {
          distractors.push(candidates[Math.floor(Math.random() * candidates.length)]);
        } else if (
          ow.word.toLowerCase() !== correctAnswer.toLowerCase() &&
          !relatedWords.includes(ow.word.toLowerCase()) &&
          !distractors.includes(ow.word.toLowerCase())
        ) {
          distractors.push(ow.word);
        }
      }

      // Fallback distractors if still not enough
      const fallbackDistractors = ["swift", "gentle", "bright", "hollow", "narrow", "calm", "fierce", "vivid", "serene", "bold"];
      while (distractors.length < 3) {
        const fb = fallbackDistractors[Math.floor(Math.random() * fallbackDistractors.length)];
        if (!distractors.includes(fb) && fb !== correctAnswer.toLowerCase() && fb !== word.toLowerCase() && !relatedWords.includes(fb)) {
          distractors.push(fb);
        }
      }
    }

    const options = shuffleArray([correctAnswer, ...distractors.slice(0, 3)]);

    setQuestion({
      word,
      correctAnswer,
      options,
      type: quizType,
    });
    setLastWord(word);
  };

  function shuffleArray<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  // Reset mistakes when changing modes
  useEffect(() => {
    setMistakesQueue([]);
    setLastWord(null);
    if (words.length >= 2) {
      generateQuestion();
    }
  }, [mode, selectedFolder]);

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);

    if (question && option !== question.correctAnswer) {
      // Add to mistakes queue so they have to try it again later
      setMistakesQueue(prev => [...prev, question]);
    }
  };

  if (words.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Brain size={24} className="mb-2 opacity-40" />
        <p className="font-mono text-xs">Save at least 2 words to start quizzing.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2 mb-3">
        {/* Mode tabs */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMode("random")}
            className={`flex items-center gap-1 rounded-full px-3 py-1 font-mono text-xs transition-colors ${
              mode === "random"
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:bg-accent"
            }`}
          >
            <Shuffle size={10} />
            Random
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
        </div>

        {/* AI Assistant Toggle */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          {ai.status === 'idle' && (
            <button onClick={ai.loadModel} className="px-2 py-1 rounded bg-secondary/50 hover:bg-secondary text-secondary-foreground flex items-center gap-1 transition-colors border border-border">
              <Brain size={10} /> Load Local AI
            </button>
          )}
          {ai.status === 'loading' && (
            <div className="flex items-center gap-2 px-2 py-1 rounded border border-primary/20 bg-primary/5 text-primary">
              <RefreshCw size={10} className="animate-spin" />
              <span>{ai.loadingMessage} {ai.progress}%</span>
            </div>
          )}
          {ai.status === 'ready' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded border border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400">
              <Check size={10} /> AI Enhanced
            </div>
          )}
        </div>
      </div>

      {/* Quiz card */}
      <AnimatePresence mode="wait">
        {question ? (
          <motion.div
            key={question.word + question.type}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="mb-3">
              <span className="inline-block rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                {question.type === "synonym" ? "Pick the Synonym" : question.type === "antonym" ? "Pick the Antonym" : "Pick the Definition"}
              </span>
              <h3 className="font-mono text-xl font-bold">{question.word}</h3>
            </div>

            <div className={`grid ${question.type === "definition" ? "grid-cols-1" : "grid-cols-2"} gap-2 mb-3`}>
              {question.options.map((option) => {
                let optionClass =
                  "rounded-md border border-border px-3 py-2 font-mono text-sm text-left transition-colors hover:bg-accent";

                if (answered) {
                  if (option === question.correctAnswer) {
                    optionClass =
                      "rounded-md border border-green-500 bg-green-500/10 px-3 py-2 font-mono text-sm text-left text-green-700 dark:text-green-400";
                  } else if (option === selected && option !== question.correctAnswer) {
                    optionClass =
                      "rounded-md border border-destructive bg-destructive/10 px-3 py-2 font-mono text-sm text-left text-destructive";
                  }
                } else if (option === selected) {
                  optionClass =
                    "rounded-md border border-foreground bg-accent px-3 py-2 font-mono text-sm text-left";
                }

                return (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    className={optionClass}
                  >
                    <span className="flex items-center gap-1.5">
                      {answered && option === question.correctAnswer && <Check size={12} />}
                      {answered && option === selected && option !== question.correctAnswer && (
                        <X size={12} />
                      )}
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>

            {answered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between"
              >
                <p className="font-mono text-xs text-muted-foreground">
                  {selected === question.correctAnswer
                    ? "Correct! ✓"
                    : `Answer: ${question.correctAnswer}`}
                </p>
                <button
                  onClick={generateQuestion}
                  className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 font-mono text-xs text-primary-foreground"
                >
                  <RefreshCw size={10} />
                  Next
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-6 text-muted-foreground"
          >
            {loading ? (
              <p className="font-mono text-xs">Generating question...</p>
            ) : (
              <>
                <p className="font-mono text-xs mb-2">No quiz available for this selection.</p>
                <button
                  onClick={generateQuestion}
                  className="flex items-center gap-1 rounded-full border border-border px-3 py-1 font-mono text-xs hover:bg-accent"
                >
                  <RefreshCw size={10} />
                  Try again
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
