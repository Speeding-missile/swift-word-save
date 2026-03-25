import { useState, useEffect, useCallback } from "react";

export interface WordEntry {
  id: string;
  word: string;
  folder: string;
  createdAt: number;
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

  return { words, addWord, deleteWord, folders, quickFolders, exportWords };
}
