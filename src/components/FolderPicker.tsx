import { useState } from "react";
import { Folder, FolderPlus, Check, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Folder as FolderType } from "@/hooks/useWordStore";

interface FolderPickerProps {
  folders: FolderType[];
  quickFolders: FolderType[];
  onSave: (folder: string) => void;
  pendingWord: string | null;
  onCancel: () => void;
}

const DEFAULT_FOLDERS = ["General", "Study", "Work", "Slang"];

export function FolderPicker({ folders, quickFolders, onSave, pendingWord, onCancel }: FolderPickerProps) {
  const [newFolder, setNewFolder] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  if (!pendingWord) return null;

  const allFolderNames = [
    ...new Set([
      ...DEFAULT_FOLDERS,
      ...folders.map((f) => f.name),
    ]),
  ];

  const handleCreate = () => {
    if (newFolder.trim()) {
      onSave(newFolder.trim());
      setNewFolder("");
      setShowCreate(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="rounded-lg border border-border bg-card p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-sm text-muted-foreground">
            Save "<span className="text-foreground font-semibold">{pendingWord}</span>" to:
          </p>
          <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        </div>

        {/* Quick save buttons */}
        {quickFolders.length > 0 && (
          <div className="mb-3">
            <p className="mb-2 flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <Zap size={12} /> QUICK SAVE
            </p>
            <div className="flex flex-wrap gap-2">
              {quickFolders.map((f) => (
                <button
                  key={f.name}
                  onClick={() => onSave(f.name)}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 font-mono text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Zap size={12} />
                  {f.name}
                  <span className="text-xs text-muted-foreground">({f.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All folders */}
        <p className="mb-2 flex items-center gap-1 font-mono text-xs text-muted-foreground">
          <Folder size={12} /> ALL FOLDERS
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {allFolderNames.map((name) => (
            <button
              key={name}
              onClick={() => onSave(name)}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Folder size={12} />
              {name}
            </button>
          ))}
        </div>

        {/* Create new folder */}
        {showCreate ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Folder name..."
              className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 font-mono text-sm outline-none focus:border-foreground"
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={!newFolder.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-30"
            >
              <Check size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 font-mono text-sm text-muted-foreground hover:text-foreground"
          >
            <FolderPlus size={14} /> New folder
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
