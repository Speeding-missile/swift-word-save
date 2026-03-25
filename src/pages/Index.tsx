import { useState } from "react";
import { Download } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WordInput } from "@/components/WordInput";
import { FolderPicker } from "@/components/FolderPicker";
import { FolderTicker } from "@/components/FolderTicker";
import { DictionarySection } from "@/components/DictionarySection";
import { useTheme } from "@/hooks/useTheme";
import { useWordStore } from "@/hooks/useWordStore";

const Index = () => {
  const { isDark, toggle } = useTheme();
  const { words, addWord, deleteWord, folders, quickFolders, exportWords } = useWordStore();
  const [pendingWord, setPendingWord] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

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
    <div className="h-screen bg-background dot-pattern flex flex-col overflow-hidden">
      <div className="mx-auto w-full max-w-lg px-4 py-4 flex flex-col h-full">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center justify-between flex-shrink-0"
        >
          <div>
            <h1 className="font-mono text-lg font-bold tracking-tight glow-text">
              word(vault)
            </h1>
            <p className="font-mono text-[10px] text-muted-foreground">quick word capture</p>
          </div>
          <div className="flex items-center gap-2">
            {words.length > 0 && (
              <button
                onClick={exportWords}
                className="flex h-7 items-center gap-1 rounded-full border border-border px-2.5 font-mono text-[10px] transition-colors hover:bg-accent"
              >
                <Download size={10} />
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
          className="mb-3 flex-shrink-0"
        >
          <WordInput onSubmit={handleWordSubmit} />
        </motion.div>

        {/* Folder Picker (conditionally shown) */}
        <div className="mb-3 flex-shrink-0">
          <FolderPicker
            folders={folders}
            quickFolders={quickFolders}
            onSave={handleSave}
            pendingWord={pendingWord}
            onCancel={() => setPendingWord(null)}
          />
        </div>

        {/* Top half - Folders with word tickers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-shrink-0 mb-3"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Folders
            </p>
            <p className="font-mono text-[10px] text-muted-foreground">
              {words.length} words
            </p>
          </div>
          <FolderTicker
            words={words}
            folders={folders}
            onDelete={deleteWord}
            onSelectFolder={setSelectedFolder}
            selectedFolder={selectedFolder}
          />
        </motion.div>

        {/* Divider */}
        <div className="border-t border-border my-2 flex-shrink-0" />

        {/* Bottom half - Dictionary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex-1 min-h-0 overflow-hidden"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Dictionary
          </p>
          <div className="h-[calc(100%-20px)]">
            <DictionarySection
              words={words}
              folders={folders}
              selectedFolder={selectedFolder}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
