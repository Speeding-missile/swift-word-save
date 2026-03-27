import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Trash2, FolderPlus, Tag, ChevronDown, ChevronRight, X, Bold, Italic, Underline, List, AlignLeft, Clock, Eye, Calendar, ArrowDownAZ, Folder as FolderIcon, FileText, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDocsStore, type DocEntry, type TagEntry, type NoteFolder, generateTagColor } from "@/hooks/useDocsStore";

type SortMode = "recent" | "visited" | "date" | "tag";

// ─── Tiny Tag pill ────────────────────────────────────────────────────────────
function TagPill({ tag, onRemove }: { tag: TagEntry; onRemove?: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium text-white"
      style={{ backgroundColor: tag.color }}
    >
      {tag.name}
      {onRemove && (
        <button onClick={onRemove} className="opacity-70 hover:opacity-100">
          <X size={8} />
        </button>
      )}
    </span>
  );
}

// ─── Tag input with autocomplete ─────────────────────────────────────────────
function TagInput({ tags, allTags, onChange }: {
  tags: TagEntry[];
  allTags: TagEntry[];
  onChange: (tags: TagEntry[]) => void;
}) {
  const [input, setInput] = useState("");
  const existing = allTags.find(t => t.name.toLowerCase() === input.trim().toLowerCase());

  const addTag = () => {
    const name = input.trim();
    if (!name || tags.find(t => t.name.toLowerCase() === name.toLowerCase())) {
      setInput("");
      return;
    }
    const color = existing?.color ?? generateTagColor();
    onChange([...tags, { name, color }]);
    setInput("");
  };

  const suggestions = input.length > 0
    ? allTags.filter(t =>
        t.name.toLowerCase().startsWith(input.toLowerCase()) &&
        !tags.find(tt => tt.name === t.name)
      ).slice(0, 4)
    : [];

  return (
    <div className="flex flex-wrap gap-1 p-1.5 border border-border rounded-md bg-background/50 relative">
      {tags.map(t => (
        <TagPill key={t.name} tag={t} onRemove={() => onChange(tags.filter(tt => tt.name !== t.name))} />
      ))}
      <div className="relative flex-1 min-w-[80px]">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
            if (e.key === 'Backspace' && !input && tags.length > 0) {
              onChange(tags.slice(0, -1));
            }
          }}
          placeholder="Add tag…"
          className="bg-transparent text-[11px] font-mono outline-none w-full placeholder:text-muted-foreground/50"
        />
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 z-50 mt-1 rounded-md border border-border bg-card shadow-lg py-1 min-w-[120px]">
            {suggestions.map(s => (
              <button
                key={s.name}
                onClick={() => { onChange([...tags, s]); setInput(""); }}
                className="flex items-center gap-2 w-full px-2 py-1 hover:bg-accent text-[11px] font-mono text-left"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Rich Text Toolbar ────────────────────────────────────────────────────────
function RichTextBar({ editorRef }: { editorRef: React.RefObject<HTMLDivElement | null> }) {
  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  };
  const tools = [
    { icon: Bold, cmd: "bold", title: "Bold" },
    { icon: Italic, cmd: "italic", title: "Italic" },
    { icon: Underline, cmd: "underline", title: "Underline" },
    { icon: List, cmd: "insertUnorderedList", title: "Bullet List" },
    { icon: AlignLeft, cmd: "justifyLeft", title: "Align Left" },
  ];
  return (
    <div className="flex items-center gap-0.5 p-1 border-b border-border/50 bg-secondary/20">
      {tools.map(({ icon: Icon, cmd, title }) => (
        <button
          key={cmd}
          onMouseDown={e => { e.preventDefault(); exec(cmd); }}
          title={title}
          className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon size={12} />
        </button>
      ))}
      <div className="w-px h-4 bg-border mx-1" />
      <select
        onMouseDown={e => e.stopPropagation()}
        onChange={e => exec("formatBlock", e.target.value)}
        className="text-[10px] font-mono bg-transparent border border-border rounded px-1 py-0.5 cursor-pointer"
      >
        <option value="p">Normal</option>
        <option value="h2">Heading</option>
        <option value="h3">Sub-heading</option>
        <option value="blockquote">Quote</option>
      </select>
    </div>
  );
}

// ─── Note Editor Modal ────────────────────────────────────────────────────────
function NoteEditor({
  note, folders, allTags, onSave, onClose
}: {
  note?: DocEntry;
  folders: NoteFolder[];
  allTags: TagEntry[];
  onSave: (title: string, content: string, tags: TagEntry[], folderId?: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [tags, setTags] = useState<TagEntry[]>(note?.tags ?? []);
  const [folderId, setFolderId] = useState<string | undefined>(note?.folderId);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && note?.content) {
      editorRef.current.innerHTML = note.content;
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Untitled Note"
            className="bg-transparent font-mono text-sm font-bold w-full outline-none placeholder:text-muted-foreground/40"
          />
          <button onClick={onClose} className="ml-2 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
            <X size={14} />
          </button>
        </div>

        {/* Meta */}
        <div className="px-4 py-2 border-b border-border/30 space-y-2">
          <TagInput tags={tags} allTags={allTags} onChange={setTags} />
          {folders.length > 0 && (
            <select
              value={folderId ?? ""}
              onChange={e => setFolderId(e.target.value || undefined)}
              className="text-[11px] font-mono bg-secondary/50 border border-border rounded px-2 py-1 w-full outline-none"
            >
              <option value="">No folder</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.emoji ? `${f.emoji} ` : ""}{f.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Rich Text Editor */}
        <RichTextBar editorRef={editorRef} />
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="flex-1 overflow-y-auto p-4 font-mono text-sm outline-none prose prose-sm max-w-none dark:prose-invert [&>ul]:list-disc [&>ul]:pl-4 [&>blockquote]:border-l-2 [&>blockquote]:border-primary [&>blockquote]:pl-3 [&>blockquote]:text-muted-foreground [&>h2]:text-base [&>h2]:font-bold [&>h3]:text-sm [&>h3]:font-semibold"
          data-placeholder="Start typing your note..."
          style={{ minHeight: "200px" }}
        />

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-3 border-t border-border/30 bg-secondary/10">
          <button onClick={onClose} className="px-3 py-1.5 font-mono text-xs rounded-md border border-border hover:bg-accent">
            Cancel
          </button>
          <button
            onClick={() => {
              const content = editorRef.current?.innerHTML ?? "";
              onSave(title || "Untitled", content, tags, folderId);
            }}
            className="flex items-center gap-1 px-3 py-1.5 font-mono text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Check size={10} /> Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Folder Creator ────────────────────────────────────────────────────────────
function FolderCreator({ onAdd, onClose }: { onAdd: (name: string, emoji?: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg border border-border/50"
    >
      <input
        value={emoji}
        onChange={e => setEmoji(e.target.value)}
        placeholder="📁"
        maxLength={2}
        className="w-8 text-center bg-transparent font-mono text-sm outline-none border border-border rounded px-1"
      />
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && name.trim()) { onAdd(name, emoji); onClose(); } }}
        placeholder="Folder name…"
        autoFocus
        className="flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground/40"
      />
      <button
        onClick={() => { if (name.trim()) { onAdd(name, emoji); onClose(); } }}
        className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded font-mono"
      >
        Add
      </button>
      <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={12} /></button>
    </motion.div>
  );
}

// ─── Main DocsSection ─────────────────────────────────────────────────────────
export function DocsSection() {
  const { docs, folders, addDoc, updateDoc, deleteDoc, visitDoc, addFolder, deleteFolder, allTags } = useDocsStore();
  const [sort, setSort] = useState<SortMode>("recent");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [editingNote, setEditingNote] = useState<DocEntry | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);
  const [showFolderCreator, setShowFolderCreator] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  // ─ sort ─
  const sorted = [...docs].sort((a, b) => {
    switch (sort) {
      case "visited": return b.visitCount - a.visitCount;
      case "date": return a.createdAt - b.createdAt;
      case "tag": return (a.tags[0]?.name ?? "").localeCompare(b.tags[0]?.name ?? "");
      default: return b.updatedAt - a.updatedAt;
    }
  });

  // ─ filter ─
  const filtered = sorted.filter(d => {
    if (activeTagFilter && !d.tags.find(t => t.name === activeTagFilter)) return false;
    return true;
  });

  // Group by folder (null = no folder)
  const folderlessDocs = filtered.filter(d => !d.folderId);
  const docsInFolder = (fid: string) => filtered.filter(d => d.folderId === fid);

  const openEditor = (note?: DocEntry) => {
    setEditingNote(note);
    setIsCreating(!note);
    setEditorOpen(true);
  };

  const handleSave = (title: string, content: string, tags: TagEntry[], folderId?: string) => {
    if (editingNote) {
      updateDoc(editingNote.id, { title, content, tags, folderId });
    } else {
      addDoc(title, content, tags, folderId);
    }
    setEditorOpen(false);
    setEditingNote(undefined);
  };

  const handleOpen = (note: DocEntry) => {
    visitDoc(note.id);
    openEditor(note);
  };

  const sortOptions: { value: SortMode; icon: React.ElementType; label: string }[] = [
    { value: "recent", icon: Clock, label: "Recent" },
    { value: "visited", icon: Eye, label: "Visited" },
    { value: "date", icon: Calendar, label: "Date" },
    { value: "tag", icon: ArrowDownAZ, label: "Tag" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-1">
          {sortOptions.map(o => (
            <button
              key={o.value}
              onClick={() => setSort(o.value)}
              title={o.label}
              className={`p-1.5 rounded-md transition-colors ${sort === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
            >
              <o.icon size={11} />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowFolderCreator(v => !v)}
            className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="New Folder"
          >
            <FolderPlus size={11} />
          </button>
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground font-mono text-[10px] hover:bg-primary/90 transition-colors"
          >
            <Plus size={10} /> New Note
          </button>
        </div>
      </div>

      {/* Folder Creator */}
      <AnimatePresence>
        {showFolderCreator && (
          <div className="mb-2">
            <FolderCreator
              onAdd={addFolder}
              onClose={() => setShowFolderCreator(false)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          <button
            onClick={() => setActiveTagFilter(null)}
            className={`px-2 py-0.5 rounded-full font-mono text-[10px] border transition-colors ${!activeTagFilter ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"}`}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag.name}
              onClick={() => setActiveTagFilter(activeTagFilter === tag.name ? null : tag.name)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] text-white transition-opacity"
              style={{
                backgroundColor: tag.color,
                opacity: activeTagFilter && activeTagFilter !== tag.name ? 0.45 : 1
              }}
            >
              <Tag size={7} />
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">

        {/* ── Folders first ── */}
        {folders.map(folder => {
          const isOpen = openFolders.has(folder.id);
          const folderDocs = docsInFolder(folder.id);
          return (
            <div key={folder.id}>
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/50 cursor-pointer group transition-colors"
                onClick={() => setOpenFolders(prev => {
                  const next = new Set(prev);
                  next.has(folder.id) ? next.delete(folder.id) : next.add(folder.id);
                  return next;
                })}
              >
                {isOpen ? <ChevronDown size={11} className="text-muted-foreground" /> : <ChevronRight size={11} className="text-muted-foreground" />}
                <span className="text-sm">{folder.emoji || <FolderIcon size={12} className="text-amber-500" />}</span>
                <span className="font-mono text-xs font-semibold flex-1 truncate">{folder.name}</span>
                <span className="font-mono text-[9px] text-muted-foreground/60">{folderDocs.length}</span>
                <button
                  onClick={e => { e.stopPropagation(); deleteFolder(folder.id); }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 size={10} />
                </button>
              </div>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden ml-4 border-l border-border/40 pl-2 mt-0.5 space-y-0.5"
                  >
                    {folderDocs.length === 0 && (
                      <p className="font-mono text-[10px] text-muted-foreground/50 py-1 pl-1">Empty folder</p>
                    )}
                    {folderDocs.map(note => (
                      <NoteRow key={note.id} note={note} onOpen={handleOpen} onDelete={deleteDoc} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* ── Folder-less notes ── */}
        {folderlessDocs.length === 0 && folders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/40">
            <FileText size={28} className="mb-2" />
            <p className="font-mono text-[11px]">No notes yet. Click + New Note.</p>
          </div>
        )}
        {folderlessDocs.map(note => (
          <NoteRow key={note.id} note={note} onOpen={handleOpen} onDelete={deleteDoc} />
        ))}
      </div>

      {/* Editor modal */}
      <AnimatePresence>
        {editorOpen && (
          <NoteEditor
            note={editingNote}
            folders={folders}
            allTags={allTags}
            onSave={handleSave}
            onClose={() => { setEditorOpen(false); setEditingNote(undefined); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Note Row ─────────────────────────────────────────────────────────────────
function NoteRow({ note, onOpen, onDelete }: {
  note: DocEntry;
  onOpen: (note: DocEntry) => void;
  onDelete: (id: string) => void;
}) {
  const preview = note.content.replace(/<[^>]+>/g, "").slice(0, 60);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-accent/60 cursor-pointer group transition-colors"
      onClick={() => onOpen(note)}
    >
      <FileText size={12} className="mt-0.5 flex-shrink-0 text-primary/70" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[11px] font-semibold truncate max-w-[140px]">{note.title}</span>
          {note.tags.map(t => (
            <TagPill key={t.name} tag={t} />
          ))}
        </div>
        {preview && (
          <p className="font-mono text-[9px] text-muted-foreground/60 truncate mt-0.5">{preview}</p>
        )}
        <p className="font-mono text-[8px] text-muted-foreground/40 mt-0.5">
          {new Date(note.updatedAt).toLocaleDateString()} · {note.visitCount} visits
        </p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(note.id); }}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0 mt-0.5"
      >
        <Trash2 size={10} />
      </button>
    </motion.div>
  );
}
