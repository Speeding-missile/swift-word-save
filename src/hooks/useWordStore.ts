import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WordEntry {
  id: string;
  word: string;
  folder: string;
  createdAt: number;
  needsPractice?: boolean; // Tracks if a word was marked "wrong"
}

export interface Folder {
  name: string;
  count: number;
}

interface WordStore {
  words: WordEntry[];
  folderNames: string[];
  folders: Folder[];
  addWord: (word: string, folder?: string) => void;
  addFolder: (name: string) => void;
  deleteWord: (id: string) => void;
  deleteFolder: (name: string) => void;
  updateWord: (id: string, patch: Partial<WordEntry>) => void;
  togglePractice: (id: string, needsPractice: boolean) => void; // Permanent practice toggle
  clearPracticeLog: () => void; // Resets all "wrong" marks
  importWords: (tsvContent: string) => number;
  exportWords: () => void;
}

// Optimized single-pass folder calculation
const computeFolders = (words: WordEntry[], folderNames: string[]) => {
  const counts: Record<string, number> = {};
  words.forEach((w) => {
    const canonical = w.folder.toLowerCase() === "general" ? "General" : w.folder;
    counts[canonical] = (counts[canonical] || 0) + 1;
  });

  const dedupedNames = new Set<string>(["General", ...folderNames]);

  return Array.from(dedupedNames)
    .map((name) => ({
      name,
      count: counts[name] || 0,
    }))
    .sort((a, b) => {
      if (a.name === "General") return -1;
      if (b.name === "General") return 1;
      return b.count - a.count;
    });
};

export const useWordStore = create<WordStore>()(
  persist(
    (set, get) => ({
      words: [],
      folderNames: ["General"],
      folders: [{ name: "General", count: 0 }],

      addWord: (word, folder) => {
        let folderName = (folder || "General").trim();
        if (folderName.toLowerCase() === "general") folderName = "General";

        const newWord: WordEntry = {
          id: crypto.randomUUID(),
          word: (word || "").trim(),
          folder: folderName,
          createdAt: Date.now(),
          needsPractice: false,
        };

        set((state) => {
          const nextWords = [newWord, ...state.words];
          const nextFolderNames = state.folderNames.some(f => f.toLowerCase() === folderName.toLowerCase())
            ? state.folderNames
            : [...state.folderNames, folderName];

          return {
            words: nextWords,
            folderNames: nextFolderNames,
            folders: computeFolders(nextWords, nextFolderNames)
          };
        });
      },

      // Logic to save "wrong" status permanently
      togglePractice: (id, needsPractice) => {
        set((state) => ({
          words: state.words.map((w) =>
            w.id === id ? { ...w, needsPractice } : w
          )
        }));
      },

      clearPracticeLog: () => {
        set((state) => ({
          words: state.words.map(w => ({ ...w, needsPractice: false }))
        }));
      },

      addFolder: (name) => {
        let trimmed = name.trim();
        if (!trimmed || trimmed.toLowerCase() === "general") return;

        set((state) => {
          if (state.folderNames.some(f => f.toLowerCase() === trimmed.toLowerCase())) return state;
          const nextFolderNames = [...state.folderNames, trimmed];
          return {
            folderNames: nextFolderNames,
            folders: computeFolders(state.words, nextFolderNames)
          };
        });
      },

      deleteWord: (id) => {
        set((state) => {
          const nextWords = state.words.filter((w) => w.id !== id);
          return {
            words: nextWords,
            folders: computeFolders(nextWords, state.folderNames)
          };
        });
      },

      deleteFolder: (name) => {
        if (name === "General") return;
        set((state) => {
          const nextWords = state.words.map(w =>
            w.folder === name ? { ...w, folder: "General" } : w
          );
          const nextFolderNames = state.folderNames.filter(f => f !== name);
          return {
            words: nextWords,
            folderNames: nextFolderNames,
            folders: computeFolders(nextWords, nextFolderNames)
          };
        });
      },

      updateWord: (id, patch) => {
        set((state) => {
          const nextWords = state.words.map((w) => (w.id === id ? { ...w, ...patch } : w));
          return {
            words: nextWords,
            folders: computeFolders(nextWords, state.folderNames)
          };
        });
      },

      importWords: (tsvContent) => {
        const lines = tsvContent.split("\n");
        const newWordsList: WordEntry[] = [];
        const currentFolderNames = new Set(get().folderNames);

        lines.forEach((line, i) => {
          if (i === 0 && line.toLowerCase().includes("word")) return;
          const [word, folder] = line.split("\t");
          if (word?.trim()) {
            const folderName = folder?.trim() || "General";
            newWordsList.push({
              id: crypto.randomUUID(),
              word: word.trim(),
              folder: folderName,
              createdAt: Date.now() + i,
              needsPractice: false,
            });
            currentFolderNames.add(folderName);
          }
        });

        if (newWordsList.length > 0) {
          set((state) => {
            const nextWords = [...newWordsList, ...state.words];
            const nextFolderNames = Array.from(currentFolderNames);
            return {
              words: nextWords,
              folderNames: nextFolderNames,
              folders: computeFolders(nextWords, nextFolderNames)
            };
          });
        }
        return newWordsList.length;
      },

      exportWords: () => {
        const { words } = get();
        const header = "Word\tFolder\tNeeds Practice\tDate\n";
        const text = words
          .map((w) => `${w.word}\t${w.folder}\t${w.needsPractice ? "Yes" : "No"}\t${new Date(w.createdAt).toLocaleDateString()}`)
          .join("\n");
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
      name: "wordvault-storage-v2", // Persistent storage key
    }
  )
);
