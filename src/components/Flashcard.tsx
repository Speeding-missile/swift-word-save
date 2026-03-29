import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface FlashcardProps {
  question: string;
  answer: string;
  onGreen: () => void;
  onRed: () => void;
}

export function Flashcard({ question, answer, onGreen, onRed }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="relative w-full cursor-pointer select-none"
      style={{ perspective: "1000px", minHeight: "200px" }}
      onClick={() => !flipped && setFlipped(true)}
    >
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, type: "spring", stiffness: 110, damping: 14 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* ── Front ── */}
        <div
          className="absolute inset-0 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-5 flex flex-col items-center justify-center gap-3"
          style={{ backfaceVisibility: "hidden", minHeight: "200px" }}
        >
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">Question</span>
          <p className="font-mono text-sm font-semibold text-center leading-relaxed px-2">{question}</p>
          <span className="mt-2 font-mono text-[11px] text-primary/50 animate-pulse">Tap to flip →</span>
        </div>

        {/* ── Back ── */}
        <div
          className="absolute inset-0 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-card p-5 flex flex-col items-center justify-center gap-3"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", minHeight: "200px" }}
          onClick={e => e.stopPropagation()}
        >
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">Answer</span>
          <p className="font-mono text-sm text-center leading-relaxed px-2">{answer}</p>
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={e => { e.stopPropagation(); setFlipped(false); onRed(); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 font-mono text-[11px] hover:bg-red-500/20 transition-colors"
            >
              <XCircle size={13} /> Need Practice
            </button>
            <button
              onClick={e => { e.stopPropagation(); setFlipped(false); onGreen(); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-500 font-mono text-[11px] hover:bg-green-500/20 transition-colors"
            >
              <CheckCircle2 size={13} /> Got it!
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
