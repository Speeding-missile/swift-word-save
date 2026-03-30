import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Loader2, Check, BookOpen, Folder, Save, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [queues, setQueues] = useState<Record<DiscoveryFilter, WordDetail[]>>({
    random: [], formal: [], casual: [], poetic: []
  });
  const [indices, setIndices] = useState<Record<DiscoveryFilter, number>>({
    random: 0, formal: 0, casual: 0, poetic: 0
  });
  const [loadingStates, setLoadingStates] = useState<Record<DiscoveryFilter, boolean>>({
    random: false, formal: false, casual: false, poetic: false
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
      const alphabet = "abcdefghijklmnopqrstuvwxyz";

      // EXPERT STRATEGY: Fetch from 5 different random letters at once to break patterns
      const searchPatterns = Array.from({ length: 5 }, () =>
        alphabet[Math.floor(Math.random() * alphabet.length)] + "??*"
      );

      const fetchTasks = searchPatterns.map(pattern => {
        let url = "";
        if (selectedFilter === "random") {
          url = `https://api.datamuse.com/words?sp=${pattern}&max=20&md=f`;
        } else {
          const themes = { formal: "scholarly", casual: "colloquial", poetic: "lyrical" };
          url = `https://api.datamuse.com/words?ml=${themes[selectedFilter]}&sp=${pattern}&max=20&md=f`;
        }
        return fetch(url).then(res => res.json());
      });

      const resultsArray = await Promise.all(fetchTasks);

      // Flatten all results and perform a deep shuffle
      const candidates = resultsArray
        .flat()
        .map((d: any) => d.word)
        .filter((w: string) => /^[a-z]+$/i.test(w))
        .sort(() => Math.random() - 0.5)
        .slice(0, targetCount * 2);

      const newDetails: WordDetail[] = [];
      const detailsResults = await Promise.all(candidates.map(w => fetchWordDetails(w)));
      detailsResults.forEach(d => { if (d) newDetails.push(d); });

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
  }, []);

  useEffect(() => {
    const filters: DiscoveryFilter[] = ["random", "formal", "casual", "poetic"];
    filters.forEach(f => fetchBatch(f, 6));
  }, [fetchBatch]);

  const handleNext = () => {
    setShowFolderPicker(false);
    setShowNewFolderInput(false);
    const currentIndex = indices[filter];
    const currentQueue = queues[filter];

    if (currentQueue.length - currentIndex < 5) fetchBatch(filter, 10);

    if (currentIndex < currentQueue.length - 1) {
      setIndices(prev => ({ ...prev, [filter]: prev[filter] + 1 }));
    }
  };

  const handlePrev = () => {
    if (indices[filter] > 0) {
      setIndices(prev => ({ ...prev, [filter]: prev[filter] - 1 }));
    }
  };

  const handleFilterChange = (newFilter: DiscoveryFilter) => {
    setFilter(newFilter);
    if (queues[newFilter].length === 0) fetchBatch(newFilter, 10);
  };

  const currentQueue = queues[filter];
  const currentIndex = indices[filter];
  const currentWord = currentQueue[currentIndex];
  const isAlreadySaved = currentWord && words.some(w => w.word.toLowerCase() === currentWord.word.toLowerCase());
  const loading = loadingStates[filter];

  return (
    <div className="mb-4 rounded-xl border border-border bg-card/60 overflow-hidden shadow-sm backdrop-blur-sm relative">
      <div className="border-b border-border/50 bg-secondary/30 px-3 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <BookOpen size={12} className="text-primary" />
          <span className="font-mono text-[10px] uppercase font-bold tracking-[0.15em] text-muted-foreground">Discovery</span>
        </div>

        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2">
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar pr-2">
            {(["random", "formal", "casual", "poetic"] as DiscoveryFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`shrink-0 px-2.5 py-1 rounded-full font-mono text-[9px] uppercase font-bold transition-all border ${filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 text-muted-foreground border-border/50"}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0 border-l border-border/50 pl-2">
            <button onClick={handlePrev} disabled={indices[filter] === 0} className="flex h-7 w-8 items-center justify-center rounded-lg bg-secondary disabled:opacity-30">
              <ChevronLeft size={14} />
            </button>
            <button onClick={handleNext} disabled={loading && currentQueue.length === 0} className="flex h-7 items-center gap-1.5 rounded-lg bg-secondary px-3 font-mono text-[10px] font-bold uppercase disabled:opacity-30">
              {loading && currentQueue.length === 0 ? <Loader2 size={11} className="animate-spin" /> : <>Next <ChevronRight size={12} /></>}
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 min-h-[180px] flex flex-col justify-center relative">
        <AnimatePresence>
          {showFolderPicker && currentWord && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 p-4 bg-card/95 backdrop-blur-md flex flex-col items-center justify-center">
              <div className="w-full max-w-sm text-center">
                <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground mb-4 block">Save to Folder</span>
                <div className="flex flex-wrap gap-2 justify-center max-h-[120px] overflow-y-auto mb-4">
                  {folders.map((f) => (
                    <button key={f.name} onClick={() => { onSaveRequest(currentWord.word, f.name); setShowFolderPicker(false); }} className="px-3 py-1.5 rounded-lg bg-secondary border border-border font-mono text-[10px] font-bold hover:border-primary/50 transition-colors">{f.name}</button>
                  ))}
                </div>
                <button onClick={() => setShowFolderPicker(false)} className="font-mono text-[10px] uppercase text-primary font-bold">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && currentQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Loader2 size={24} className="animate-spin mb-3 text-primary/40" />
            <span className="font-mono text-[10px] uppercase tracking-widest">Shuffling Deck...</span>
          </div>
        ) : currentWord ? (
          <AnimatePresence mode="wait">
            <motion.div key={`${currentWord.word}-${filter}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2.5 mb-2">
                  <h3 className="font-mono font-bold text-3xl tracking-tight text-foreground">{currentWord.word}</h3>
                  <span className="font-mono text-[13px] text-muted-foreground/40 font-medium">[{currentWord.phonetic}]</span>
                </div>
                <div className="space-y-3">
                  <div className="relative pl-3">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary/30 rounded-full" />
                    <p className="font-mono text-[13px] leading-relaxed font-medium text-foreground/90">{currentWord.meaning}</p>
                  </div>
                  {currentWord.usage && (
                    <p className="font-mono text-[12px] text-muted-foreground/70 italic leading-relaxed">"{currentWord.usage}"</p>
                  )}
                </div>
              </div>
              <button onClick={() => !isAlreadySaved && setShowFolderPicker(true)} disabled={isAlreadySaved} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all shadow-md ${isAlreadySaved ? 'bg-secondary/40 text-muted-foreground border border-border/50' : 'bg-primary text-primary-foreground hover:scale-105 active:scale-95'}`}>
                {isAlreadySaved ? <Check size={20} /> : <Plus size={20} />}
              </button>
            </motion.div>
          </AnimatePresence>
        ) : <div className="text-center font-mono text-xs opacity-50 py-10 italic">Switch filters to discover more words.</div>}
      </div>
    </div>
  );
}