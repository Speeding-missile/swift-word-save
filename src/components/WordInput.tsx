import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Mic, MicOff, Plus, X, AlertCircle, BookOpen, Archive, Folder, FolderPlus, Save, Search as SearchIcon, Command, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useWordValidation } from "@/hooks/useWordValidation";
import { useWordStore, type WordEntry } from "@/hooks/useWordStore";

interface WordInputProps {
  onSubmit: (word: string, folder: string) => void;
  existingWords?: WordEntry[];
  autoFocus?: boolean;
}

export function WordInput({ onSubmit, existingWords = [], autoFocus }: WordInputProps) {
  const [value, setValue] = useState("");
  const [duplicateInfo, setDuplicateInfo] = useState<{ word: string; folder: string } | null>(null);
  const { validate, validationResult, validating, clearValidation } = useWordValidation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [dictionarySuggestions, setDictionarySuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  const { folders, addFolder } = useWordStore();
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  const handleVoiceResult = useCallback((text: string) => {
    setValue(text);
    clearValidation();
  }, [clearValidation]);

  const { isListening, toggle: toggleVoice } = useVoiceInput(handleVoiceResult);

  const matchingExisting = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return (existingWords || [])
      .filter(w => w && w.word && w.word.toLowerCase().includes(q))
      .slice(0, 4);
  }, [value, existingWords]);

  useEffect(() => {
    const q = value.trim().toLowerCase();
    if (q.length < 1) {
      setDictionarySuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(q)}&max=5`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
             setDictionarySuggestions(data.map(d => d.word).filter(w => w && w.toLowerCase() !== q));
          }
        }
      } catch {
        setDictionarySuggestions([]);
      }
      setLoadingSuggestions(false);
      if (q.length > 2) validate(q);
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value, validate]);

  useEffect(() => {
    if (value.trim().length > 0) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      clearValidation();
      setShowNewFolderInput(false);
    }
  }, [value, clearValidation]);

  const handleFinalSubmit = (word: string, folder: string) => {
    onSubmit(word, folder);
    setValue("");
    setShowDropdown(false);
    setDuplicateInfo(null);
    clearValidation();
  };

  const handleSimpleSubmit = async () => {
    const target = value.trim();
    if (!target) return;
    
    const existing = (existingWords || []).find(w => w && w.word && w.word.toLowerCase() === target.toLowerCase());
    if (existing) {
      setDuplicateInfo({ word: existing.word, folder: existing.folder });
      return;
    }

    handleFinalSubmit(target, "General");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSimpleSubmit();
    if (e.key === "Escape") setShowDropdown(false);
  };

  const handleCreateAndSave = () => {
    const name = newFolderName.trim();
    if (name && addFolder) {
      // First create the folder in the background state
      addFolder(name);
      
      // Then save the word to that folder
      if (value.trim()) {
        handleFinalSubmit(value.trim(), name);
      }
      
      setNewFolderName("");
      setShowNewFolderInput(false);
    }
  };

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [autoFocus]);

  const showValidationWarning = validationResult && !validationResult.isValid && value.trim().length > 0;

  return (
    <div className="w-full">
      <div className="relative group">
        <div className="flex items-center gap-3 px-3 py-2 border border-border bg-card rounded-xl transition-all focus-within:border-primary shadow-sm hover:shadow-md">
          <SearchIcon className="text-muted-foreground/60" size={18} />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (duplicateInfo) setDuplicateInfo(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search or add word..."
            className="flex-1 bg-transparent font-mono text-base outline-none placeholder:text-muted-foreground/40"
          />
          <div className="flex items-center gap-1.5 border-l border-border pl-2">
             <button onClick={toggleVoice} className={`p-1.5 rounded-lg transition-all ${isListening ? "bg-red-500 text-white animate-pulse" : "hover:bg-accent text-muted-foreground"}`}>
               {isListening ? <MicOff size={16} /> : <Mic size={16} />}
             </button>
             <button onClick={handleSimpleSubmit} disabled={!value.trim() || validating} className="bg-primary text-primary-foreground p-1.5 rounded-lg hover:brightness-110 transition-all disabled:opacity-30">
               <Plus size={16} />
             </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {duplicateInfo && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-2 p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
               <AlertCircle size={14} />
               <span className="font-mono text-[10px] font-bold uppercase tracking-tight">Exists in <span className="underline">{duplicateInfo.folder}</span></span>
            </div>
            <button onClick={() => setDuplicateInfo(null)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            // BLUR BACKGROUND AS REQUESTED
            className="absolute left-0 right-0 top-full z-[60] mt-2 rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col"
          >
            <div className="p-4 space-y-4 relative">
              
              {/* Validation Status */}
              {showValidationWarning && (
                <div className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center gap-2">
                  <AlertCircle size={12} className="text-red-500" />
                  <span className="font-mono text-[10px] font-bold text-red-500 uppercase tracking-tight">
                    {validationResult.message || "Not found in dictionary"}
                  </span>
                </div>
              )}

              {/* COMPACT SAVE SECTION */}
              <section className="bg-secondary/40 p-2.5 rounded-xl border border-border/50 relative">
                <div className="flex items-center justify-between mb-2.5 px-1 truncate">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Folder size={11} className="text-primary shrink-0" />
                    <span className="font-mono text-[9px] uppercase font-bold tracking-widest opacity-60 truncate">Save "{value}" to:</span>
                  </div>
                  <button 
                    onClick={() => {
                      setShowNewFolderInput(true);
                      setTimeout(() => newFolderInputRef.current?.focus(), 100);
                    }} 
                    className="text-[9px] font-mono text-primary font-bold uppercase hover:underline flex items-center gap-1 shrink-0 ml-2"
                  >
                    + New
                  </button>
                </div>

                {/* New Folder Overlay */}
                <AnimatePresence>
                  {showNewFolderInput && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="absolute inset-0 z-10 p-4 bg-card rounded-xl flex flex-col items-center justify-center gap-3"
                    >
                      <div className="flex flex-col w-full gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] uppercase font-bold text-muted-foreground">New Folder Name</span>
                          <button onClick={() => setShowNewFolderInput(false)} className="text-muted-foreground hover:text-foreground"><X size={14}/></button>
                        </div>
                        <input 
                          ref={newFolderInputRef}
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateAndSave();
                            if (e.key === "Escape") setShowNewFolderInput(false);
                          }}
                          placeholder="..."
                          className="w-full bg-secondary/50 p-2.5 rounded-lg border border-border font-mono text-xs outline-none focus:border-primary transition-all"
                        />
                      </div>
                      <button 
                        onClick={handleCreateAndSave}
                        disabled={!newFolderName.trim()}
                        className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-50"
                      >
                        Create & Save
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* COMPACT FOLDER GRID */}
                <div className="flex flex-wrap gap-1.5">
                  {(folders || []).map((f, idx) => (
                    <button 
                      key={`${f.name}-${idx}`} 
                      onClick={() => handleFinalSubmit(value, f.name)} 
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card/60 border border-border hover:border-primary/50 transition-all group max-w-[120px]"
                    >
                      <Folder size={9} className="text-muted-foreground group-hover:text-primary shrink-0" />
                      <span className="font-mono text-[9px] font-bold truncate">{f.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Suggestions */}
              {dictionarySuggestions.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-2 opacity-30 px-1">
                    <BookOpen size={9} className="text-muted-foreground" />
                    <span className="font-mono text-[8px] uppercase font-bold tracking-widest">Suggestions</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dictionarySuggestions.map((s, idx) => (
                      <button key={`${s}-${idx}`} onClick={() => { setValue(s); clearValidation(); }} className="px-2 py-1 rounded-lg bg-secondary/20 hover:bg-secondary/40 font-mono text-[9px] font-medium border border-border/30">{s}</button>
                    ))}
                  </div>
                </section>
              )}

              {/* Vault Matches */}
              {matchingExisting.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-2 opacity-30 px-1">
                    <Archive size={9} className="text-muted-foreground" />
                    <span className="font-mono text-[8px] uppercase font-bold tracking-widest">In Vault</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {matchingExisting.map((w, idx) => (
                      <button key={`${w?.id || idx}`} onClick={() => { setValue(w.word); clearValidation(); }} className="flex flex-col items-start px-2 py-1.5 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all">
                        <span className="font-mono text-[9px] font-bold truncate w-full">{w.word}</span>
                        <span className="font-mono text-[7px] opacity-40 uppercase">{w.folder}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="bg-secondary/20 px-4 py-2 flex items-center justify-between border-t border-border/50">
              <span className="font-mono text-[7px] uppercase font-bold text-muted-foreground/40 tracking-tighter">Enter to save to general • Select folder</span>
              <button onClick={() => setShowDropdown(false)} className="font-mono text-[7px] uppercase font-bold text-primary/60 hover:text-primary transition-colors">Dismiss</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
