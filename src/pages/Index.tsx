import { useState, useMemo, useRef } from "react"; // Removed unused 'useEffect'
import { Download, Upload, Folder, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SettingsPanel } from "@/components/SettingsPanel";
import { WordInput } from "@/components/WordInput";
import { FolderTicker } from "@/components/FolderTicker";
import { WordDiscovery } from "@/components/WordDiscovery";
import { QuizSection } from "@/components/QuizSection";
import { TodoSection } from "@/components/TodoSection";
import { FlashcardsSection } from "@/components/FlashcardsSection";
import { BottomNav, type MobileTab } from "@/components/BottomNav";
import { useTheme } from "@/hooks/useTheme";
import { useWordStore } from "@/hooks/useWordStore";
import { getPersonalityStatement } from "@/lib/wordCategories";

export type SectionType = "folders" | "quiz" | null;

const Index = () => {
  const { isDark, toggle } = useTheme();
  const { words, addWord, deleteWord, deleteFolder, folders, exportWords, importWords } = useWordStore(); // Removed unused 'quickFolders'
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("dashboard");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      // Safely ensure the result is a string before trying to import
      if (typeof event.target?.result === "string") {
        importWords(event.target.result);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const personality = useMemo(() => getPersonalityStatement(words), [words]);

  const handleWordSubmit = (word: string, folder: string = "General") => {
    addWord(word, folder);
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
                onDeleteFolder={deleteFolder}
                onSelectFolder={setSelectedFolder}
                selectedFolder={selectedFolder}
              />
            </div>
          </div>
        </div>

        {/* ── Center Column: Dashboard ── */}
        <div className={`${mobileTab === "dashboard" ? "flex" : "hidden"} lg:flex w-full h-full flex-col relative z-10 lg:col-start-2 min-h-0`}>

          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0 mb-4 flex items-center justify-between"
          >
            <h1 className="font-mono text-sm font-bold tracking-tight glow-text">vocabulary(vault)</h1>
            <div className="flex items-center gap-1.5">
              {words.length > 0 && (
                <>
                  <button onClick={() => fileInputRef.current?.click()} className="flex h-6 items-center gap-1 rounded-full border border-border px-2 font-mono text-[9px] transition-colors hover:bg-accent"><Upload size={9} />Import</button>
                  <input type="file" accept=".tsv,.txt,.csv" className="hidden" ref={fileInputRef} onChange={handleImport} />
                  <button onClick={exportWords} className="flex h-6 items-center gap-1 rounded-full border border-border px-2 font-mono text-[9px] transition-colors hover:bg-accent"><Download size={9} />Export</button>
                </>
              )}
              <SettingsPanel isDark={isDark} toggleTheme={toggle} />
            </div>
          </motion.header>

          <div className="flex-1 overflow-y-auto custom-scrollbar no-scrollbar pb-10 space-y-6">

            {/* Personality + Search Component (Inline) */}
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {personality && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-1">
                    <p className="font-mono text-[10px] text-muted-foreground/40 px-2 uppercase font-bold tracking-[0.1em]">
                      {personality.statement}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <WordInput
                  onSubmit={handleWordSubmit}
                  existingWords={words}
                />
              </div>
            </div>

            {/* Word Discovery */}
            <WordDiscovery onSaveRequest={handleWordSubmit} />

            {/* Quiz */}
            <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Quiz</p>
              <QuizSection words={words} folders={folders} selectedFolder={selectedFolder} />
            </div>
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
              <div className="mt-8">
                <TodoSection />
              </div>
            </div>
          </div>
        </div>



      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav activeTab={mobileTab} onTabChange={setMobileTab} />
    </div>
  );
};

export default Index;