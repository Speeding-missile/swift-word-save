import { useState, useCallback } from "react";
import { Mic, MicOff, Plus, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useWordValidation } from "@/hooks/useWordValidation";

interface WordInputProps {
  onSubmit: (word: string) => void;
}

export function WordInput({ onSubmit }: WordInputProps) {
  const [value, setValue] = useState("");
  const { validate, validationResult, validating, clearValidation } = useWordValidation();

  const handleVoiceResult = useCallback((text: string) => {
    setValue(text);
    clearValidation();
  }, [clearValidation]);

  const { isListening, toggle: toggleVoice } = useVoiceInput(handleVoiceResult);

  const handleSubmit = async () => {
    if (!value.trim()) return;
    const isValid = await validate(value.trim());
    if (isValid) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue(suggestion);
    clearValidation();
  };

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 rounded-lg border p-2 transition-colors focus-within:border-foreground ${
          validationResult && !validationResult.isValid
            ? "border-destructive bg-destructive/5"
            : "border-border bg-card"
        }`}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (validationResult) clearValidation();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a new word..."
          className="flex-1 bg-transparent px-2 py-2 font-mono text-lg outline-none placeholder:text-muted-foreground"
        />

        <button
          onClick={toggleVoice}
          className={`relative flex h-10 w-10 items-center justify-center rounded-md transition-colors ${
            isListening ? "bg-foreground text-background" : "hover:bg-accent"
          }`}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
        >
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div key="off" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
                <MicOff size={18} />
              </motion.div>
            ) : (
              <motion.div key="on" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
                <Mic size={18} />
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
          className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
          aria-label="Add word"
        >
          <Plus size={18} />
        </button>
      </div>

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
