import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Mic, MicOff, Plus, X, AlertCircle, BookOpen, Archive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useWordValidation } from "@/hooks/useWordValidation";
import type { WordEntry } from "@/hooks/useWordStore";

interface WordInputProps {
  onSubmit: (word: string) => void;
  existingWords?: WordEntry[];
}

export function WordInput({ onSubmit, existingWords = [] }: WordInputProps) {
  const [value, setValue] = useState("");
  const [duplicateInfo, setDuplicateInfo] = useState<{ word: string; folder: string } | null>(null);
  const { validate, validationResult, validating, clearValidation } = useWordValidation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [dictionarySuggestions, setDictionarySuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleVoiceResult = useCallback((text: string) => {
    setValue(text);
    clearValidation();
  }, [clearValidation]);

  const { isListening, toggle: toggleVoice } = useVoiceInput(handleVoiceResult);

  // Existing words that match input
  const matchingExisting = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q || q.length < 1) return [];
    return existingWords
      .filter((w) => w.word.toLowerCase().includes(q))
      .slice(0, 5);
  }, [value, existingWords]);

  // Fetch dictionary suggestions as user types
  useEffect(() => {
    const q = value.trim().toLowerCase();
    if (q.length < 2) {
      setDictionarySuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(
          `https://api.datamuse.com/sug?s=${encodeURIComponent(q)}&max=5`
        );
        if (res.ok) {
          const data: { word: string }[] = await res.json();
          setDictionarySuggestions(
            data
              .map((d) => d.word)
              .filter((w) => w.toLowerCase() !== q)
          );
        }
      } catch {
        setDictionarySuggestions([]);
      }
      setLoadingSuggestions(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  // Show/hide dropdown
  useEffect(() => {
    const q = value.trim();
    setShowDropdown(q.length >= 1 && (matchingExisting.length > 0 || dictionarySuggestions.length > 0));
  }, [value, matchingExisting, dictionarySuggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = async () => {
    if (!value.trim()) return;
    setShowDropdown(false);
    setDuplicateInfo(null);

    // Check if word already exists
    const existing = existingWords.find(
      (w) => w.word.toLowerCase() === value.trim().toLowerCase()
    );
    if (existing) {
      setDuplicateInfo({ word: existing.word, folder: existing.folder });
      return;
    }

    const isValid = await validate(value.trim());
    if (isValid) {
      onSubmit(value.trim());
      setValue("");
      setDuplicateInfo(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") setShowDropdown(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue(suggestion);
    clearValidation();
    setShowDropdown(false);
  };

  const handlePickWord = (word: string) => {
    setValue(word);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div
        className={`flex h-full items-center gap-1 rounded-lg border p-1 transition-colors focus-within:border-foreground ${validationResult && !validationResult.isValid
            ? "border-destructive bg-destructive/5"
            : duplicateInfo
              ? "border-amber-500 bg-amber-500/5"
              : "border-border bg-card"
          }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (validationResult) clearValidation();
            if (duplicateInfo) setDuplicateInfo(null);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            const q = value.trim();
            if (q.length >= 1 && (matchingExisting.length > 0 || dictionarySuggestions.length > 0)) {
              setShowDropdown(true);
            }
          }}
          placeholder="word..."
          className="flex-1 min-w-0 bg-transparent px-1 py-1 font-mono text-sm outline-none placeholder:text-muted-foreground"
        />

        <button
          onClick={toggleVoice}
          className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${isListening ? "bg-foreground text-background" : "hover:bg-accent"
            }`}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
        >
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div key="off" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
                <MicOff size={14} />
              </motion.div>
            ) : (
              <motion.div key="on" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
                <Mic size={14} />
              </motion.div>
            )}
          </AnimatePresence>
          {isListening && (
            <span className="absolute inset-0 animate-pulse-ring rounded-md border border-foreground" />
          )}
        </button>

        <button
          onClick={handleSubmit}
          disabled={!value.trim() || validating}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
          aria-label="Add word"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Autocomplete dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
          >
            {/* Existing saved words section */}
            {matchingExisting.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border bg-secondary/50">
                  <Archive size={10} className="text-muted-foreground" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Already saved
                  </span>
                </div>
                {matchingExisting.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => handlePickWord(w.word)}
                    className="flex w-full items-center justify-between px-3 py-1.5 font-mono text-xs hover:bg-accent transition-colors"
                  >
                    <span>{w.word}</span>
                    <span className="text-[10px] text-muted-foreground">{w.folder}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Dictionary suggestions section */}
            {dictionarySuggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border bg-secondary/50">
                  <BookOpen size={10} className="text-muted-foreground" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Suggestions
                  </span>
                </div>
                {dictionarySuggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handlePickWord(s)}
                    className="flex w-full items-center px-3 py-1.5 font-mono text-xs hover:bg-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duplicate word notice */}
      <AnimatePresence>
        {duplicateInfo && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Archive size={12} className="text-amber-600 dark:text-amber-400" />
                <span className="font-mono text-xs text-amber-700 dark:text-amber-300">
                  <strong>{duplicateInfo.word}</strong> already saved in <strong>{duplicateInfo.folder}</strong>
                </span>
              </div>
              <button onClick={() => setDuplicateInfo(null)} className="text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation error */}
      <AnimatePresence>
        {validationResult && !validationResult.isValid && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <AlertCircle size={12} className="text-destructive" />
                <span className="font-mono text-xs text-destructive">{validationResult.message}</span>
              </div>
              <button onClick={clearValidation} className="text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            </div>
            {validationResult.suggestions.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="font-mono text-[10px] text-muted-foreground">Did you mean:</span>
                {validationResult.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestionClick(s)}
                    className="rounded-md border border-border px-2 py-0.5 font-mono text-xs hover:bg-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
