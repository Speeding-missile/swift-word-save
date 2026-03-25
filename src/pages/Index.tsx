import { useState } from "react";
import { Download, Folder } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WordInput } from "@/components/WordInput";
import { FolderPicker } from "@/components/FolderPicker";
import { WordList } from "@/components/WordList";
import { useTheme } from "@/hooks/useTheme";
import { useWordStore } from "@/hooks/useWordStore";

const Index = () => {
  const { isDark, toggle } = useTheme();
  const { words, addWord, deleteWord, folders, quickFolders, exportWords } = useWordStore();
  const [pendingWord, setPendingWord] = useState<string | null>(null);
  const [filterFolder, setFilterFolder] = useState<string | null>(null);

  const handleWordSubmit = (word: string) => {
    setPendingWord(word);
  };

  const handleSave = (folder: string) => {
    if (pendingWord) {
      addWord(pendingWord, folder);
      setPendingWord(null);
    }
  };

  return (
    <div className="min-h-screen bg-background dot-pattern">
      <div className="mx-auto max-w-lg px-4 py-6">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="font-mono text-xl font-bold tracking-tight glow-text">
              word(vault)
            </h1>
            <p className="font-mono text-xs text-muted-foreground">quick word capture</p>
          </div>
          <div className="flex items-center gap-2">
            {words.length > 0 && (
              <button
                onClick={exportWords}
                className="flex h-8 items-center gap-1.5 rounded-full border border-border px-3 font-mono text-xs transition-colors hover:bg-accent"
              >
                <Download size={12} />
                Export
              </button>
            )}
            <ThemeToggle isDark={isDark} toggle={toggle} />
          </div>
        </motion.header>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <WordInput onSubmit={handleWordSubmit} />
        </motion.div>

        {/* Folder Picker */}
        <div className="mb-6">
          <FolderPicker
            folders={folders}
            quickFolders={quickFolders}
            onSave={handleSave}
            pendingWord={pendingWord}
            onCancel={() => setPendingWord(null)}
          />
        </div>

        {/* Folder filter tabs */}
        {folders.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-4 flex flex-wrap gap-1.5"
          >
            <button
              onClick={() => setFilterFolder(null)}
              className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                filterFolder === null
                  ? "bg-primary text-primary-foreground"
                  : "border border-border hover:bg-accent"
              }`}
            >
              All ({words.length})
            </button>
            {folders.map((f) => (
              <button
                key={f.name}
                onClick={() => setFilterFolder(f.name)}
                className={`flex items-center gap-1 rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                  filterFolder === f.name
                    ? "bg-primary text-primary-foreground"
                    : "border border-border hover:bg-accent"
                }`}
              >
                <Folder size={10} />
                {f.name} ({f.count})
              </button>
            ))}
          </motion.div>
        )}

        {/* Word list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <WordList words={words} onDelete={deleteWord} filterFolder={filterFolder} />
        </motion.div>

        {/* Footer */}
        <div className="mt-12 text-center font-mono text-xs text-muted-foreground">
          {words.length} words saved
        </div>
      </div>
    </div>
  );
};

export default Index;
