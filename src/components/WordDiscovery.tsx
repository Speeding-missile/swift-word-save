import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Plus, Loader2, Check, BookOpen, Folder, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWordStore } from "@/hooks/useWordStore";

interface WordDetail {
  word: string;
  phonetic: string;
  meaning: string;
  usage: string;
}

type DiscoveryFilter = "random" | "formal" | "casual" | "poetic";

export function WordDiscovery({ onSaveRequest }: { onSaveRequest: (word: string, folder: string) => void }) {
  const [filter, setFilter] = useState<DiscoveryFilter>("random");
  // Independent queues and indices for each category
  const [queues, setQueues] = useState<Record<DiscoveryFilter, WordDetail[]>>({
    random: [],
    formal: [],
    casual: [],
    poetic: []
  });
  const [indices, setIndices] = useState<Record<DiscoveryFilter, number>>({
    random: 0,
    formal: 0,
    casual: 0,
    poetic: 0
  });
  const [loadingStates, setLoadingStates] = useState<Record<DiscoveryFilter, boolean>>({
    random: false,
    formal: false,
    casual: false,
    poetic: false
  });

  const [error, setError] = useState<string | null>(null);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  const { words, folders, addFolder } = useWordStore();
  const fetchingRefs = useRef<Record<DiscoveryFilter, boolean>>({
    random: false, formal: false, casual: false, poetic: false
  });

  const fetchWordDetails = async (word: string): Promise<WordDetail | null> => {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!res.ok) return null;
      const data = await res.json();
      const entry = data[0];
      return {
        word: entry.word,
        phonetic: entry.phonetic || entry.phonetics?.[0]?.text || "",
        meaning: entry.meanings?.[0]?.definitions?.[0]?.definition || "",
        usage: entry.meanings?.[0]?.definitions?.[0]?.example || ""
      };
    } catch {
      return null;
    }
  };

  const fetchBatch = useCallback(async (selectedFilter: DiscoveryFilter, targetCount: number = 10) => {
    if (fetchingRefs.current[selectedFilter]) return;
    fetchingRefs.current[selectedFilter] = true;
    setLoadingStates(prev => ({ ...prev, [selectedFilter]: true }));
    
    try {
      let url = "";
      const seedWords = ["discovery", "knowledge", "vault", "word", "language"];
      const randomSeed = words.length > 0 
        ? words[Math.floor(Math.random() * words.length)].word 
        : seedWords[Math.floor(Math.random() * seedWords.length)];
      
      switch (selectedFilter) {
        case "formal": url = `https://api.datamuse.com/words?ml=scholarly&max=100&md=f`; break;
        case "casual": url = `https://api.datamuse.com/words?ml=colloquial&max=100&md=f`; break;
        case "poetic": url = `https://api.datamuse.com/words?ml=lyrical&max=100&md=f`; break;
        case "random":
        default: 
          const alphabet = "abcdefghijklmnopqrstuvwxyz";
          const randomChar = alphabet[Math.floor(Math.random() * alphabet.length)];
          url = `https://api.datamuse.com/words?sp=${randomChar}???*&max=100&md=f`; 
          break;
      }

      const res = await fetch(url);
      const data = await res.json();
      
      const candidates = data
        .map((d: any) => d.word)
        .filter((w: string) => /^[a-z]+$/i.test(w))
        .sort(() => Math.random() - 0.5)
        .slice(0, targetCount * 3); // Over-sample to account for dictionary misses

      const newDetails: WordDetail[] = [];
      const chunks = [];
      for (let i = 0; i < candidates.length; i += 5) chunks.push(candidates.slice(i, i + 5));

      for (const chunk of chunks) {
        if (newDetails.length >= targetCount) break;
        const results = await Promise.all(chunk.map(w => fetchWordDetails(w)));
        for (const d of results) if (d) newDetails.push(d);
      }

      setQueues(prev => ({
        ...prev,
        [selectedFilter]: [...prev[selectedFilter], ...newDetails]
      }));
      setError(null);
    } catch (err) {
      setError("Failed to discover new words.");
    } finally {
      setLoadingStates(prev => ({ ...prev, [selectedFilter]: false }));
      fetchingRefs.current[selectedFilter] = false;
    }
  }, [words]);

  // Expert Pre-fetching Strategy: Initial load + progressive refill
  useEffect(() => {
    const filters: DiscoveryFilter[] = ["random", "formal", "casual", "poetic"];
    filters.forEach(f => fetchBatch(f, 5));
    setTimeout(() => {
      filters.forEach(f => fetchBatch(f, 10));
    }, 3000);
  }, [fetchBatch]);

  const handleNext = () => {
    setShowFolderPicker(false);
    setShowNewFolderInput(false);
    
    const currentIndex = indices[filter];
    const currentQueue = queues[filter];

    if (currentQueue.length - currentIndex < 10) {
      fetchBatch(filter, 10);
    }

    if (currentIndex < currentQueue.length - 1) {
      setIndices(prev => ({ ...prev, [filter]: prev[filter] + 1 }));
    } else {
      fetchBatch(filter, 10);
    }
  };

  const handlePrev = () => {
    setShowFolderPicker(false);
    setShowNewFolderInput(false);
    if (indices[filter] > 0) {
      setIndices(prev => ({ ...prev, [filter]: prev[filter] - 1 }));
    }
  };

  const handleFilterChange = (newFilter: DiscoveryFilter) => {
    setFilter(newFilter);
    setShowFolderPicker(false);
    setShowNewFolderInput(false);
    
    if (queues[newFilter].length - indices[newFilter] < 5) {
      fetchBatch(newFilter, 10);
    }
  };

  const handleSaveToFolder = (folderName: string) => {
    if (currentWord) {
      onSaveRequest(currentWord.word, folderName);
      setShowFolderPicker(false);
    }
  };

  const handleCreateAndSave = () => {
    const name = newFolderName.trim();
    if (name && addFolder && currentWord) {
      addFolder(name);
      onSaveRequest(currentWord.word, name);
      setNewFolderName("");
      setShowNewFolderInput(false);
      setShowFolderPicker(false);
    }
  };

  const currentQueue = queues[filter];
  const currentIndex = indices[filter];
  const currentWord = currentQueue[currentIndex];
  const isAlreadySaved = currentWord && words.some(w => w.word.toLowerCase() === currentWord.word.toLowerCase());
  const loading = loadingStates[filter];

  return (
      <div className="mb-4 rounded-xl border border-border bg-card/60 overflow-hidden shadow-sm backdrop-blur-sm relative">
        {/* Header */}
        <div className="border-b border-border/50 bg-secondary/30 px-3 py-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 self-start">
            <BookOpen size={12} className="text-primary" />
            <span className="font-mono text-[10px] uppercase font-bold tracking-[0.15em] text-muted-foreground">
              Discovery
            </span>
          </div>
  
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-1">
            {(["random", "formal", "casual", "poetic"] as DiscoveryFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                disabled={loading && filter === f}
                className={`px-2.5 py-1 rounded-full font-mono text-[9px] uppercase font-bold tracking-tight transition-all border ${
                  filter === f 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-secondary/50 text-muted-foreground border-border/50 hover:bg-secondary/80"
                }`}
              >
                {f}
              </button>
            ))}
            <div className="w-[1px] h-3 bg-border mx-1" />
            <div className="flex items-center gap-1">
              <button 
                onClick={handlePrev} 
                disabled={indices[filter] === 0}
                className="flex h-7 w-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-30"
                title="Previous"
              >
                <ChevronLeft size={14} />
              </button>
              
              <button 
                onClick={handleNext} 
                disabled={loading && currentQueue.length === 0}
                className="flex h-7 items-center gap-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 font-mono text-[10px] font-bold uppercase transition-colors disabled:opacity-30"
              >
                {loading && currentQueue.length === 0 ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <>Next <ChevronRight size={12} /></>
                )}
              </button>
            </div>
          </div>
        </div>
  
        {/* Content Area */}
        <div className="p-5 min-h-[180px] flex flex-col justify-center relative">
          <AnimatePresence>
            {showFolderPicker && currentWord && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="absolute inset-0 z-20 p-4 bg-card/95 backdrop-blur-md flex flex-col items-center justify-center gap-4"
              >
                <div className="w-full max-w-sm">
                  <div className="flex items-center justify-between mb-3 px-1">
                     <div className="flex items-center gap-2">
                       <Folder size={12} className="text-primary" />
                       <span className="font-mono text-[9px] uppercase font-bold tracking-[0.1em] text-muted-foreground">Save to:</span>
                     </div>
                     <button onClick={() => setShowNewFolderInput(!showNewFolderInput)} className="text-[9px] font-mono text-primary font-bold uppercase hover:underline">
                       {showNewFolderInput ? "Cancel" : "+ New"}
                     </button>
                  </div>
  
                  {showNewFolderInput && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4">
                      <div className="flex gap-2 p-2 bg-secondary/50 rounded-lg border border-border">
                        <input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateAndSave()} placeholder="FOLDER NAME..." className="flex-1 bg-transparent font-mono text-[10px] outline-none font-bold" />
                        <button onClick={handleCreateAndSave} className="bg-primary text-white p-1 rounded-md transition-all"><Save size={14}/></button>
                      </div>
                    </motion.div>
                  )}
  
                  <div className="flex flex-wrap gap-2 justify-center max-h-[120px] overflow-y-auto custom-scrollbar">
                    {(folders || []).map((f, idx) => (
                      <button key={`${f.name}-${idx}`} onClick={() => handleSaveToFolder(f.name)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/80 border border-border hover:border-primary/40 transition-all font-mono text-[10px] font-bold">
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))}
                  </div>
  
                  <button onClick={() => setShowFolderPicker(false)} className="mt-4 w-full py-1.5 font-mono text-[9px] uppercase font-bold text-muted-foreground hover:text-foreground transition-colors border-t border-border/50">
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
  
          {loading && currentQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Loader2 size={24} className="animate-spin mb-3 text-primary/40" />
            <span className="font-mono text-xs italic tracking-tight">Expanding discovery...</span>
          </div>
        ) : error && currentQueue.length === 0 ? (
          <div className="py-6 text-center">
            <p className="font-mono text-xs text-destructive">{error}</p>
            <button onClick={() => fetchBatch(filter)} className="mt-2 text-[10px] font-mono hover:underline uppercase tracking-widest">Try Again</button>
          </div>
        ) : currentWord ? (
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${currentWord.word}-${filter}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-start justify-between gap-6"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2.5 mb-3 flex-wrap">
                  <h3 className="font-mono font-bold text-3xl text-foreground tracking-tight">{currentWord.word}</h3>
                  {currentWord.phonetic && (
                    <span className="font-mono text-[13px] text-muted-foreground/50 tracking-wide font-medium">[{currentWord.phonetic}]</span>
                  )}
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="relative pl-3">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary/40 rounded-full" />
                    <span className="inline-block font-mono text-[9px] uppercase font-bold tracking-[0.2em] text-primary/60 mb-1.5">
                      Description
                    </span>
                    <p className="font-mono text-[13.5px] leading-relaxed text-foreground/90 font-medium">{currentWord.meaning}</p>
                  </div>
                  
                  {currentWord.usage && (
                    <div className="relative pl-3">
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-secondary rounded-full" />
                      <span className="inline-block font-mono text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60 mb-1.5">
                        Context
                      </span>
                      <p className="font-mono text-[12px] text-muted-foreground italic leading-relaxed">"{currentWord.usage}"</p>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => isAlreadySaved ? null : setShowFolderPicker(true)}
                disabled={isAlreadySaved}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all shadow-md ${
                  isAlreadySaved 
                    ? 'bg-secondary/40 text-muted-foreground border border-border/50' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.03] active:scale-95'
                }`}
                title={isAlreadySaved ? "Already saved" : "Save Word"}
              >
                {isAlreadySaved ? <Check size={20} /> : <Plus size={20} />}
              </button>
            </motion.div>
          </AnimatePresence>
        ) : (
           <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <BookOpen size={24} className="animate-pulse mb-3 text-primary/40" />
            <span className="font-mono text-xs italic tracking-widest">Awaiting new words.</span>
          </div>
        )}
      </div>
    </div>
  );
}
