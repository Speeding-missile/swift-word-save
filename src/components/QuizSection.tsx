import { useState, useEffect, useCallback, useRef } from "react";
import { Brain, RefreshCw, Check, X, Folder, Clock, Shuffle, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WordEntry, Folder as FolderType } from "@/hooks/useWordStore";
import { useDictionary, type DictionaryEntry } from "@/hooks/useDictionary";

type QuizMode = "random" | "recent" | "folder";
type QuizType = "synonym" | "antonym";

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

export function QuizSection({ words, folders, selectedFolder }: QuizSectionProps) {
  const [mode, setMode] = useState<QuizMode>("random");
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [askedWords, setAskedWords] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const { lookup } = useDictionary();

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

  const totalPoolSize = getWordPool().length;

  const generateQuestion = useCallback(async () => {
    const pool = getWordPool();
    if (pool.length < 2) return;

    // Filter out already asked words
    const remaining = pool.filter((w) => !askedWords.has(w.word.toLowerCase()));

    if (remaining.length === 0) {
      setCompleted(true);
      setQuestion(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setSelected(null);
    setAnswered(false);
    setCompleted(false);

    // Try each remaining word until we find one with synonyms/antonyms
    const shuffledRemaining = [...remaining].sort(() => Math.random() - 0.5);

    for (const targetWord of shuffledRemaining) {
      const entry = await lookup(targetWord.word);
      if (!entry || entry.meanings.length === 0) continue;

      const result = await buildQuestion(targetWord.word, entry, pool);
      if (result) {
        setQuestion(result);
        setAskedWords((prev) => new Set(prev).add(targetWord.word.toLowerCase()));
        setLoading(false);
        return;
      }
    }

    // No valid quiz could be generated from remaining words
    setCompleted(true);
    setQuestion(null);
    setLoading(false);
  }, [getWordPool, lookup, askedWords]);

  const buildQuestion = async (
    word: string,
    entry: DictionaryEntry,
    pool: WordEntry[]
  ): Promise<QuizQuestion | null> => {
    const quizType: QuizType = Math.random() > 0.5 ? "synonym" : "antonym";

    let relatedWords: string[] = [];
    entry.meanings.forEach((m) => {
      m.definitions.forEach((d: any) => {
        if (quizType === "synonym" && d.synonyms) relatedWords.push(...d.synonyms);
        if (quizType === "antonym" && d.antonyms) relatedWords.push(...d.antonyms);
      });
      if (m.synonyms && quizType === "synonym") relatedWords.push(...m.synonyms);
      if (m.antonyms && quizType === "antonym") relatedWords.push(...m.antonyms);
    });

    relatedWords = [...new Set(relatedWords.filter((w) => w.toLowerCase() !== word.toLowerCase()))];
    if (relatedWords.length === 0) return null;

    const correctAnswer = relatedWords[Math.floor(Math.random() * relatedWords.length)];

    const distractors = pool
      .map((w) => w.word)
      .filter(
        (w) =>
          w.toLowerCase() !== word.toLowerCase() &&
          w.toLowerCase() !== correctAnswer.toLowerCase() &&
          !relatedWords.includes(w.toLowerCase())
      )
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const fallbackDistractors = ["swift", "gentle", "bright", "hollow", "narrow", "calm", "fierce", "vivid"];
    while (distractors.length < 3) {
      const fb = fallbackDistractors[Math.floor(Math.random() * fallbackDistractors.length)];
      if (!distractors.includes(fb) && fb !== correctAnswer.toLowerCase() && fb !== word.toLowerCase()) {
        distractors.push(fb);
      }
    }

    const options = [...[correctAnswer, ...distractors.slice(0, 3)]].sort(() => Math.random() - 0.5);

    return { word, correctAnswer, options, type: quizType };
  };

  // Reset when mode changes
  useEffect(() => {
    setAskedWords(new Set());
    setCompleted(false);
    setScore({ correct: 0, total: 0 });
    if (words.length >= 2) {
      generateQuestion();
    }
  }, [mode, selectedFolder]);

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    setScore((prev) => ({
      correct: prev.correct + (option === question?.correctAnswer ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleRestart = () => {
    setAskedWords(new Set());
    setCompleted(false);
    setScore({ correct: 0, total: 0 });
    setQuestion(null);
    setTimeout(() => generateQuestion(), 50);
  };

  if (words.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Brain size={24} className="mb-2 opacity-40" />
        <p className="font-mono text-xs">Save at least 2 words to start quizzing.</p>
      </div>
    );
  }

  const progress = totalPoolSize > 0 ? Math.round((askedWords.size / totalPoolSize) * 100) : 0;

  return (
    <div className="flex flex-col">
      {/* Mode tabs */}
      <div className="flex items-center gap-1.5 mb-3">
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

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[10px] text-muted-foreground">
            {askedWords.size}/{totalPoolSize} words
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {score.total > 0 && `${score.correct}/${score.total} correct`}
          </span>
        </div>
        <div className="h-1 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Quiz card */}
      <AnimatePresence mode="wait">
        {completed ? (
          <motion.div
            key="completed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-lg border border-border bg-card p-5 text-center"
          >
            <Check size={28} className="mx-auto mb-2 text-primary" />
            <h3 className="font-mono text-sm font-bold mb-1">All done!</h3>
            <p className="font-mono text-xs text-muted-foreground mb-1">
              You've gone through all {totalPoolSize} words.
            </p>
            <p className="font-mono text-xs text-muted-foreground mb-3">
              Score: {score.correct}/{score.total} correct
            </p>
            <button
              onClick={handleRestart}
              className="flex items-center gap-1.5 mx-auto rounded-full bg-primary px-4 py-1.5 font-mono text-xs text-primary-foreground"
            >
              <RotateCcw size={10} />
              Go again
            </button>
          </motion.div>
        ) : question ? (
          <motion.div
            key={question.word + question.type}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="mb-3">
              <span className="inline-block rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                {question.type === "synonym" ? "Pick the Synonym" : "Pick the Antonym"}
              </span>
              <h3 className="font-mono text-xl font-bold">{question.word}</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
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
