import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Plus, Loader2, Filter, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDictionary, type DictionaryEntry } from "@/hooks/useDictionary";
import { useWordStore } from "@/hooks/useWordStore";

type FilterType = "random" | "short" | "long" | "letter";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

export function WordDiscovery({ onSaveRequest }: { onSaveRequest: (word: string) => void }) {
  const [filter, setFilter] = useState<FilterType>("random");
  const [letter, setLetter] = useState<string>("a");
  const [showFilters, setShowFilters] = useState(false);
  
  const [wordList, setWordList] = useState<string[]>([]);
  const [currentEntry, setCurrentEntry] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { lookup } = useDictionary();
  const { addWord, words } = useWordStore();

  const fetchWordsFromDatamuse = useCallback(async () => {
    let sp = "";
    if (filter === "random") {
      const randomChar = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      sp = `${randomChar}???*`;
    } else if (filter === "short") {
      sp = "????";
    } else if (filter === "long") {
      sp = "??????????";
    } else if (filter === "letter") {
      sp = `${letter}*`;
    }

    // md=f so we get frequency, to pick more common words
    const url = `https://api.datamuse.com/words?sp=${sp}&max=200&md=f`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch words");
    
    const data = await res.json();
    // Filter out words with spaces or hyphens
    const cleanWords = data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((d: any) => d.word)
      .filter((w: string) => /^[a-z]+$/i.test(w));
      
    // Shuffle
    return cleanWords.sort(() => Math.random() - 0.5);
  }, [filter, letter]);

  const getNextWord = useCallback(async (currentList: string[] = wordList) => {
    setLoading(true);
    setError(null);
    setCurrentEntry(null);
    
    let listTokens = [...currentList];

    try {
      if (listTokens.length === 0) {
        listTokens = await fetchWordsFromDatamuse();
      }

      let found = false;
      while (listTokens.length > 0) {
        const candidate = listTokens.pop()!;
        const entry = await lookup(candidate);
        
        // Ensure we have an entry with a definition
        if (entry && entry.meanings.length > 0 && entry.meanings[0].definitions.length > 0) {
          // Prefer words that have an example if possible, but not strictly required
          setCurrentEntry(entry);
          setWordList(listTokens);
          found = true;
          break;
        }
      }

      if (!found) {
        setError("Could not find a valid dictionary word. Try again.");
      }
    } catch (err) {
        setError("Failed to load word.");
    } finally {
      setLoading(false);
    }
  }, [lookup, fetchWordsFromDatamuse]);

  // Initial fetch when filter/letter changes
  useEffect(() => {
    setWordList([]); // reset list on filter change
    getNextWord([]);
  }, [filter, letter, getNextWord]);

  const handleSave = () => {
    if (currentEntry) {
      onSaveRequest(currentEntry.word);
    }
  };

  const isAlreadySaved = currentEntry && words.some(w => w.word.toLowerCase() === currentEntry.word.toLowerCase());

  return (
    <div className="mb-4 rounded-xl border border-border bg-card/60 overflow-hidden shadow-sm backdrop-blur-sm">
      {/* Header & Filters */}
      <div className="border-b border-border/50 bg-secondary/30 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1">
            Discover
          </span>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors font-mono text-[10px] text-foreground"
          >
            <Filter size={10} />
            {filter} {filter === 'letter' && `(${letter.toUpperCase()})`}
            <ChevronDown size={10} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => getNextWord()} 
            disabled={loading}
            className="flex h-6 items-center gap-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 px-2 font-mono text-[10px] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
            Next
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border/50 bg-card"
          >
            <div className="p-2 px-3 flex flex-wrap gap-2 text-[10px] font-mono">
              {(["random", "short", "long", "letter"] as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-1 rounded-full border transition-colors ${filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-border hover:bg-secondary text-muted-foreground'}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
              
              {filter === "letter" && (
                <div className="w-full mt-1.5 flex flex-wrap gap-1">
                  {ALPHABET.map(l => (
                    <button
                      key={l}
                      onClick={() => setLetter(l)}
                      className={`w-5 h-5 flex items-center justify-center rounded-sm border transition-colors ${letter === l ? 'bg-primary/20 border-primary text-primary font-bold' : 'border-border text-muted-foreground hover:bg-secondary'}`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <div className="p-3">
        {loading && !currentEntry ? (
          <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
            <Loader2 size={16} className="animate-spin mb-2" />
            <span className="font-mono text-[10px]">Fetching word...</span>
          </div>
        ) : error ? (
          <div className="py-4 text-center">
            <p className="font-mono text-xs text-destructive">{error}</p>
            <button onClick={() => getNextWord()} className="mt-2 text-[10px] font-mono hover:underline">Try Again</button>
          </div>
        ) : currentEntry ? (
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                <h3 className="font-mono font-bold text-lg text-foreground">{currentEntry.word}</h3>
                {currentEntry.phonetic && (
                  <span className="font-mono text-xs text-muted-foreground">{currentEntry.phonetic}</span>
                )}
              </div>
              
              <div className="mt-1 space-y-2">
                {currentEntry.meanings.map((meaning, mi) => (
                  <div key={mi}>
                    <span className="inline-block rounded-sm bg-primary/10 text-primary px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider mb-1">
                      {meaning.partOfSpeech}
                    </span>
                    {meaning.definitions.map((d, di) => (
                      <div key={di} className="mb-1.5">
                        <p className="font-mono text-xs leading-relaxed text-foreground">{d.definition}</p>
                        {d.example && (
                          <div className="mt-1 pl-2 border-l-2 border-primary/30">
                            <p className="font-mono text-[10px] text-muted-foreground italic leading-snug">"{d.example}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={isAlreadySaved}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-all ${isAlreadySaved ? 'bg-secondary/50 text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
              title={isAlreadySaved ? "Already saved" : "Save to General folder"}
            >
              {isAlreadySaved ? <Check size={14} /> : <Plus size={14} />}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
