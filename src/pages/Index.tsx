import { useState, useMemo } from "react";
import { Download, Network } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WordInput } from "@/components/WordInput";
import { FolderPicker } from "@/components/FolderPicker";
import { FolderTicker } from "@/components/FolderTicker";
import { DictionarySection } from "@/components/DictionarySection";
import { QuizSection } from "@/components/QuizSection";
import { GraphNetworkView } from "@/components/GraphNetworkView";
import { useTheme } from "@/hooks/useTheme";
import { useWordStore } from "@/hooks/useWordStore";
import { getPersonalityStatement } from "@/lib/wordCategories";

const Index = () => {
  const { isDark, toggle } = useTheme();
  const { words, addWord, deleteWord, folders, quickFolders, exportWords } = useWordStore();
  const [pendingWord, setPendingWord] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(false);

  const personality = useMemo(() => getPersonalityStatement(words), [words]);

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
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="mx-auto w-full max-w-lg px-4 py-3">
        {/* Compact Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 flex items-center justify-between"
        >
          <h1 className="font-mono text-sm font-bold tracking-tight glow-text">
            word(vault)
          </h1>
          <div className="flex items-center gap-1.5">
            {words.length > 0 && (
              <>
                <button
                  onClick={() => setShowGraph(true)}
                  className="flex h-6 items-center gap-1 rounded-full border border-border px-2 font-mono text-[9px] transition-colors hover:bg-accent"
                >
                  <Network size={9} />
                  Graph
                </button>
                <button
                  onClick={exportWords}
                  className="flex h-6 items-center gap-1 rounded-full border border-border px-2 font-mono text-[9px] transition-colors hover:bg-accent"
                >
                  <Download size={9} />
                  Export
                </button>
              </>
            )}
            <ThemeToggle isDark={isDark} toggle={toggle} />
          </div>
        </motion.header>

        {/* Input + Personality Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-3 flex items-start gap-2"
        >
          <div className="w-[45%] flex-shrink-0">
            <WordInput onSubmit={handleWordSubmit} existingWords={words} />
          </div>
          {personality && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 min-w-0 rounded-md border border-border bg-secondary/40 px-3 py-2 flex flex-col justify-center"
            >
              <p className="font-mono text-[11px] text-foreground leading-relaxed truncate">
                {personality.statement}
              </p>
              <span className="font-mono text-[9px] text-muted-foreground">
                mostly {personality.category.toLowerCase()} words
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Folder Picker */}
        <div className="mb-3">
          <FolderPicker
            folders={folders}
            quickFolders={quickFolders}
            onSave={handleSave}
            pendingWord={pendingWord}
            onCancel={() => setPendingWord(null)}
          />
        </div>

        {/* Folders with word tickers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-3"
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
        <div className="border-t border-border my-4" />

        {/* Dictionary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-3"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Dictionary
          </p>
          <DictionarySection
            words={words}
            folders={folders}
            selectedFolder={selectedFolder}
          />
        </motion.div>

        {/* Divider */}
        <div className="border-t border-border my-4" />

        {/* Quiz Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Quiz
          </p>
          <QuizSection
            words={words}
            folders={folders}
            selectedFolder={selectedFolder}
          />
        </motion.div>
      </div>

      {/* Graph Network View */}
      {showGraph && (
        <GraphNetworkView words={words} onClose={() => setShowGraph(false)} />
      )}
    </div>
  );
};

export default Index;
