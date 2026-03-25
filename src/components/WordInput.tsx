import { useState, useCallback } from "react";
import { Mic, MicOff, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface WordInputProps {
  onSubmit: (word: string) => void;
}

export function WordInput({ onSubmit }: WordInputProps) {
  const [value, setValue] = useState("");

  const handleVoiceResult = useCallback((text: string) => {
    setValue(text);
  }, []);

  const { isListening, toggle: toggleVoice } = useVoiceInput(handleVoiceResult);

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 transition-colors focus-within:border-foreground">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
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
          disabled={!value.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
          aria-label="Add word"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
