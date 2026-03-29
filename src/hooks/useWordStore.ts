import { create } from "zustand";
import { persist } from "zustand/middleware";

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

interface WordStore {
  words: WordEntry[];
  folderNames: string[];
  folders: Folder[]; // Pre-computed for convenience
  quickFolders: Folder[]; // Pre-computed
  addWord: (word: string, folder: string) => void;
  addFolder: (name: string) => void;
  deleteWord: (id: string) => void;
  deleteFolder: (name: string) => void;
  updateWord: (id: string, patch: Partial<WordEntry>) => void;
  importWords: (tsvContent: string) => number;
  exportWords: () => void;
}

const computeFolders = (words: WordEntry[], folderNames: string[]) => {
  const counts: Record<string, number> = {};
  
  // Normalize both words and folderNames to ensure "General" is the anchor
  words.forEach((w) => {
    const canonical = w.folder.toLowerCase() === "general" ? "General" : w.folder;
    counts[canonical] = (counts[canonical] || 0) + 1;
  });

  // Deduplicate folderNames (case-insensitive, prioritizing General)
  const dedupedNames = new Set<string>(["General"]);
  folderNames.forEach(name => {
    if (name.toLowerCase() !== "general") dedupedNames.add(name);
  });

  const all = Array.from(dedupedNames)
    .map((name) => ({
      name,
      count: counts[name] || 0,
    }))
    .sort((a, b) => {
      if (a.name === "General") return -1;
      if (b.name === "General") return 1;
      return b.count - a.count;
    });
  
  return {
    folders: all,
    quickFolders: all.slice(0, 4)
  };
};

export const useWordStore = create<WordStore>()(
  persist(
    (set, get) => ({
      words: [],
      folderNames: ["General"],
      folders: [{ name: "General", count: 0 }],
      quickFolders: [{ name: "General", count: 0 }],

      addWord: (word, folder) => {
        let folderName = (folder || "General").trim();
        if (folderName.toLowerCase() === "general") folderName = "General";

        const newWord: WordEntry = {
          id: crypto.randomUUID(),
          word: (word || "").trim(),
          folder: folderName,
          createdAt: Date.now(),
        };

        set((state) => {
          // Normalize existing words to "General" if needed
          const normalizedWords = [newWord, ...state.words].map(w => 
            w.folder.toLowerCase() === "general" ? { ...w, folder: "General" } : w
          );
          
          const newFolderNames = state.folderNames.some(f => f.toLowerCase() === folderName.toLowerCase())
            ? state.folderNames
            : [...state.folderNames, folderName];
          
          const { folders, quickFolders } = computeFolders(normalizedWords, newFolderNames);
          return { words: normalizedWords, folderNames: newFolderNames, folders, quickFolders };
        });
      },

      addFolder: (name) => {
        let trimmed = name.trim();
        if (!trimmed) return;
        if (trimmed.toLowerCase() === "general") trimmed = "General";

        set((state) => {
          if (state.folderNames.some(f => f.toLowerCase() === trimmed.toLowerCase())) return state;
          const newFolderNames = [...state.folderNames, trimmed];
          // Also normalize words here just in case
          const normalizedWords = state.words.map(w => 
            w.folder.toLowerCase() === "general" ? { ...w, folder: "General" } : w
          );
          const { folders, quickFolders } = computeFolders(normalizedWords, newFolderNames);
          return { words: normalizedWords, folderNames: newFolderNames, folders, quickFolders };
        });
      },

      deleteWord: (id) => {
        set((state) => {
          const newWords = state.words.filter((w) => w.id !== id);
          const { folders, quickFolders } = computeFolders(newWords, state.folderNames);
          return { words: newWords, folders, quickFolders };
        });
      },

      deleteFolder: (name) => {
        if (name === "General") return; // Cannot delete General
        set((state) => {
          // Move words to General
          const newWords = state.words.map(w => 
            w.folder === name ? { ...w, folder: "General" } : w
          );
          const newFolderNames = state.folderNames.filter(f => f !== name);
          const { folders, quickFolders } = computeFolders(newWords, newFolderNames);
          return { words: newWords, folderNames: newFolderNames, folders, quickFolders };
        });
      },

      updateWord: (id, patch) => {
        set((state) => {
          const newWords = state.words.map((w) => (w.id === id ? { ...w, ...patch } : w));
          const { folders, quickFolders } = computeFolders(newWords, state.folderNames);
          return { words: newWords, folders, quickFolders };
        });
      },

      importWords: (tsvContent) => {
        const lines = tsvContent.split("\n");
        let importedCount = 0;
        const newWordsList: WordEntry[] = [];
        const state = get();
        const currentFolderNames = new Set(state.folderNames);

        for (let i = 0; i < lines.length; i++) {
          if (i === 0 && lines[i].toLowerCase().startsWith("word\t")) continue;
          if (!lines[i].trim()) continue;

          const [word, folder] = lines[i].split("\t");
          if (word && word.trim()) {
            const folderName = folder ? folder.trim() : "Imported";
            newWordsList.push({
              id: crypto.randomUUID(),
              word: word.trim(),
              folder: folderName,
              createdAt: Date.now() + i,
            });
            currentFolderNames.add(folderName);
            importedCount++;
          }
        }

        if (newWordsList.length > 0) {
          set((state) => {
            const existingWords = new Set(state.words.map((w) => w.word.toLowerCase()));
            const filteredNew = newWordsList.filter((w) => !existingWords.has(w.word.toLowerCase()));
            const nextWords = [...filteredNew, ...state.words];
            const nextFolderNames = Array.from(currentFolderNames);
            const { folders, quickFolders } = computeFolders(nextWords, nextFolderNames);
            return {
              words: nextWords,
              folderNames: nextFolderNames,
              folders,
              quickFolders
            };
          });
        }
        return importedCount;
      },

      exportWords: () => {
        const { words } = get();
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
      },
    }),
    {
      name: "wordvault-storage-v2",
    }
  )
);
