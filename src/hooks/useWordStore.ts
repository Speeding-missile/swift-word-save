import { useState, useEffect, useCallback } from "react";

export interface WordEntry {
  id: string;
  word: string;
  folder: string;
  createdAt: number;
  aiDistractors?: string[]; // Cached AI options so the model never re-runs for the same word
}

export interface Folder {
  name: string;
  count: number;
}

const STORAGE_KEY = "wordvault_words";

function loadWords(): WordEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveWords(words: WordEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

export function useWordStore() {
  const [words, setWords] = useState<WordEntry[]>(loadWords);

  useEffect(() => {
    saveWords(words);
  }, [words]);

  const addWord = useCallback((word: string, folder: string) => {
    const entry: WordEntry = {
      id: crypto.randomUUID(),
      word: word.trim(),
      folder,
      createdAt: Date.now(),
    };
    setWords((prev) => [entry, ...prev]);
  }, []);

  const deleteWord = useCallback((id: string) => {
    setWords((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const updateWord = useCallback((id: string, patch: Partial<WordEntry>) => {
    setWords((prev) => prev.map((w) => w.id === id ? { ...w, ...patch } : w));
  }, []);

  const folders: Folder[] = (() => {
    const map: Record<string, number> = {};
    words.forEach((w) => {
      map[w.folder] = (map[w.folder] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  })();

  const quickFolders = folders.slice(0, 4);

  const exportWords = useCallback(() => {
    const text = words
      .map((w) => `${w.word}\t${w.folder}\t${new Date(w.createdAt).toLocaleDateString()}`)
      .join("\n");
    const header = "Word\tFolder\tDate\n";
    const blob = new Blob([header + text], { type: "text/tab-separated-values" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wordvault-export.tsv";
    a.click();
    URL.revokeObjectURL(url);
  }, [words]);

  const importWords = useCallback((tsvContent: string) => {
    const lines = tsvContent.split('\n');
    let importedCount = 0;
    const newWords: WordEntry[] = [];
    
    for (let i = 0; i < lines.length; i++) {
       if (i === 0 && lines[i].toLowerCase().startsWith('word\t')) continue;
       if (!lines[i].trim()) continue;
       
       const [word, folder] = lines[i].split('\t');
       if (word && word.trim()) {
           newWords.push({
               id: crypto.randomUUID(),
               word: word.trim(),
               folder: folder ? folder.trim() : 'Imported',
               createdAt: Date.now() + i,
           });
           importedCount++;
       }
    }
    
    if (newWords.length > 0) {
       setWords(prev => {
          const existingWords = new Set(prev.map(w => w.word.toLowerCase()));
          const filteredNew = newWords.filter(w => !existingWords.has(w.word.toLowerCase()));
          return [...filteredNew, ...prev];
       });
    }
    return importedCount;
  }, []);

  return { words, addWord, deleteWord, updateWord, folders, quickFolders, exportWords, importWords };
}
