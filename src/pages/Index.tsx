import { useState, useMemo, useRef } from "react";
import { Download, Upload, Network, Folder, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WordInput } from "@/components/WordInput";
import { FolderPicker } from "@/components/FolderPicker";
import { FolderTicker } from "@/components/FolderTicker";
import { WordDiscovery } from "@/components/WordDiscovery";
import { QuizSection } from "@/components/QuizSection";
import { FlashcardsSection } from "@/components/FlashcardsSection";
import { GraphNetworkView } from "@/components/GraphNetworkView";
import { ConnectorLine } from "@/components/ConnectorLine";
import { BottomNav, type MobileTab } from "@/components/BottomNav";
import { useTheme } from "@/hooks/useTheme";
import { useWordStore } from "@/hooks/useWordStore";
import { getPersonalityStatement } from "@/lib/wordCategories";

export type SectionType = "folders" | "quiz" | null;

const Index = () => {
  const { isDark, toggle } = useTheme();
  const { words, addWord, deleteWord, folders, quickFolders, exportWords, importWords } = useWordStore();
  const [pendingWord, setPendingWord] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("dashboard");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        importWords(text);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

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
    <div className="h-screen bg-background overflow-hidden relative flex flex-col items-stretch">
      <div className="mx-auto w-full max-w-[2400px] h-full px-4 sm:px-8 py-4 lg:py-6 grid grid-cols-1 lg:grid-cols-3 items-stretch gap-6 lg:gap-8 pb-20 lg:pb-6">

        {/* ── Left Column: Word Folders ── */}
        <div className={`${mobileTab === "folders" ? "flex" : "hidden"} lg:flex w-full h-full flex-col lg:col-start-1`}>
          <div className="bg-card/80 backdrop-blur-xl border border-border shadow-md rounded-2xl h-full flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-border/50 bg-secondary/30">
              <Folder size={14} className="text-primary" />
              <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Word Folders</h2>
              <span className="ml-auto font-mono text-[9px] text-muted-foreground">{words.length} words</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <FolderTicker
                words={words}
                folders={folders}
                onDelete={deleteWord}
                onSelectFolder={setSelectedFolder}
                selectedFolder={selectedFolder}
              />
            </div>
          </div>
        </div>

        {/* ── Center Column: Dashboard ── */}
        <div className={`${mobileTab === "dashboard" ? "flex" : "hidden"} lg:flex w-full h-full flex-col relative z-10 lg:col-start-2 overflow-y-auto custom-scrollbar pb-8`}>

          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 flex items-center justify-between"
          >
            <h1 className="font-mono text-sm font-bold tracking-tight glow-text">word(vault)</h1>
            <div className="flex items-center gap-1.5">
              {words.length > 0 && (
                <>
                  <button onClick={() => setShowGraph(true)} className="flex h-6 items-center gap-1 rounded-full border border-border px-2 font-mono text-[9px] transition-colors hover:bg-accent"><Network size={9} />Graph</button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex h-6 items-center gap-1 rounded-full border border-border px-2 font-mono text-[9px] transition-colors hover:bg-accent"><Upload size={9} />Import</button>
                  <input type="file" accept=".tsv,.txt,.csv" className="hidden" ref={fileInputRef} onChange={handleImport} />
                  <button onClick={exportWords} className="flex h-6 items-center gap-1 rounded-full border border-border px-2 font-mono text-[9px] transition-colors hover:bg-accent"><Download size={9} />Export</button>
                </>
              )}
              <ThemeToggle isDark={isDark} toggle={toggle} />
            </div>
          </motion.header>

          {/* Word Discovery */}
          <WordDiscovery onSaveRequest={handleWordSubmit} />

          {/* Personality + Input */}
          <div className="my-3 flex flex-col gap-1">
            <AnimatePresence>
              {personality && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <p className="font-mono text-[11px] text-muted-foreground px-1 line-clamp-1">
                    {personality.statement} <span className="opacity-50">({personality.category.toLowerCase()})</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full">
              <WordInput onSubmit={handleWordSubmit} existingWords={words} />
            </motion.div>
          </div>

          {/* Folder Picker (save word) */}
          <div className="mb-4">
            <FolderPicker
              folders={folders}
              quickFolders={quickFolders}
              onSave={handleSave}
              pendingWord={pendingWord}
              onCancel={() => setPendingWord(null)}
            />
          </div>

          {/* Quiz */}
          <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Quiz</p>
            <QuizSection words={words} folders={folders} selectedFolder={selectedFolder} />
          </div>
        </div>

        {/* ── Right Column: My Tools ── */}
        <div className={`${mobileTab === "tools" ? "flex" : "hidden"} lg:flex flex-col h-full lg:col-start-3 w-full`}>
          <div className="bg-card/80 backdrop-blur-xl border border-border shadow-md rounded-2xl h-full flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-border/50 bg-secondary/30 flex-shrink-0">
              <Wrench size={14} className="text-primary" />
              <h2 className="font-mono text-sm font-bold uppercase tracking-widest">My Tools</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="mb-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Flashcards</p>
                <FlashcardsSection />
              </div>
            </div>
          </div>
        </div>

      </div>

      {showGraph && <GraphNetworkView words={words} onClose={() => setShowGraph(false)} />}
      
      {/* Mobile Bottom Nav */}
      <BottomNav activeTab={mobileTab} onTabChange={setMobileTab} />
    </div>
  );
};

export default Index;
