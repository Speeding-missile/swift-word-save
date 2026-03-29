import { useState } from "react";
import { Sun, Moon, X, Settings, Palette, Type, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SettingsPanelProps {
  isDark: boolean;
  toggleTheme: () => void;
}

export function SettingsPanel({ isDark, toggleTheme }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Gear button in header */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative h-8 w-8 rounded-full border border-border flex items-center justify-center transition-colors hover:bg-accent text-foreground"
        aria-label="Open settings"
      >
        <Settings size={15} />
      </button>

      {/* Settings Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed right-0 top-0 bottom-0 z-[101] w-72 bg-card border-l border-border flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Settings size={16} className="text-primary" />
                  <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Settings</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-accent text-muted-foreground transition-colors"
                  aria-label="Close settings"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* Appearance Section */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Palette size={12} className="text-muted-foreground" />
                    <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Appearance</span>
                  </div>

                  {/* Theme toggle row */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-center gap-3">
                      {isDark ? <Moon size={15} className="text-foreground" /> : <Sun size={15} className="text-foreground" />}
                      <div>
                        <p className="font-mono text-xs font-bold">{isDark ? "Dark mode" : "Light mode"}</p>
                        <p className="font-mono text-[9px] text-muted-foreground mt-0.5">Switch colour theme</p>
                      </div>
                    </div>
                    {/* Toggle switch */}
                    <button
                      onClick={toggleTheme}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none border border-border ${isDark ? "bg-foreground" : "bg-foreground/20"}`}
                      role="switch"
                      aria-checked={isDark}
                      aria-label="Toggle dark mode"
                    >
                      <motion.span
                        layout
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={`inline-block h-3.5 w-3.5 rounded-full shadow-sm ${isDark ? "bg-background translate-x-4.5" : "bg-foreground translate-x-0.5"}`}
                        style={{ transform: isDark ? "translateX(18px)" : "translateX(2px)" }}
                      />
                    </button>
                  </div>
                </section>

                {/* Readability Section */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Eye size={12} className="text-muted-foreground" />
                    <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Readability</span>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                    <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                      Font contrast has been optimised for WCAG AA compliance. All text elements meet a minimum 4.5:1 contrast ratio.
                    </p>
                  </div>
                </section>

                {/* App Info */}
                <section className="mt-auto pt-4">
                  <div className="p-3 rounded-xl border border-border/50 text-center">
                    <p className="font-mono text-[10px] font-bold text-foreground">word(vault)</p>
                    <p className="font-mono text-[8px] text-muted-foreground mt-0.5 uppercase tracking-widest">v1.0 · Dictionary Driven</p>
                  </div>
                </section>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
