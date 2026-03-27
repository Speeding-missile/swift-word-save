import { useState, useEffect, useCallback } from "react";

export interface TagEntry {
  name: string;
  color: string; // HSL random color generated once at creation
}

export interface NoteFolder {
  id: string;
  name: string;
  emoji?: string;
  createdAt: number;
}

export interface DocEntry {
  id: string;
  title: string;
  content: string; // HTML string (rich text)
  tags: TagEntry[];
  folderId?: string;
  createdAt: number;
  updatedAt: number;
  visitCount: number;
}

const STORAGE_KEY = "wordvault-notes-v2";
const FOLDERS_KEY = "wordvault-note-folders";

function generateTagColor(): string {
  // Generate a vivid, aesthetically pleasing HSL color
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 50%)`;
}

function loadNotes(): DocEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function loadFolders(): NoteFolder[] {
  try {
    return JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveNotes(notes: DocEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function saveFolders(folders: NoteFolder[]) {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export { generateTagColor };

export function useDocsStore() {
  const [docs, setDocs] = useState<DocEntry[]>(loadNotes);
  const [folders, setFolders] = useState<NoteFolder[]>(loadFolders);

  useEffect(() => { saveNotes(docs); }, [docs]);
  useEffect(() => { saveFolders(folders); }, [folders]);

  // --- Folder actions ---
  const addFolder = useCallback((name: string, emoji?: string) => {
    const entry: NoteFolder = {
      id: crypto.randomUUID(),
      name: name.trim(),
      emoji: emoji?.trim() || undefined,
      createdAt: Date.now(),
    };
    setFolders(prev => [entry, ...prev]);
    return entry.id;
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    // Remove folder references from notes
    setDocs(prev => prev.map(d => d.folderId === id ? { ...d, folderId: undefined } : d));
  }, []);

  const updateFolder = useCallback((id: string, name: string, emoji?: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name: name.trim(), emoji: emoji?.trim() || undefined } : f));
  }, []);

  // --- Note actions ---
  const addDoc = useCallback((title: string, content: string, tags: TagEntry[] = [], folderId?: string) => {
    const entry: DocEntry = {
      id: crypto.randomUUID(),
      title,
      content,
      tags,
      folderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      visitCount: 0,
    };
    setDocs(prev => [entry, ...prev]);
    return entry.id;
  }, []);

  const updateDoc = useCallback((id: string, patch: Partial<Pick<DocEntry, 'title' | 'content' | 'tags' | 'folderId'>>) => {
    setDocs(prev => prev.map(d => d.id === id
      ? { ...d, ...patch, updatedAt: Date.now() }
      : d
    ));
  }, []);

  const visitDoc = useCallback((id: string) => {
    setDocs(prev => prev.map(d => d.id === id
      ? { ...d, visitCount: d.visitCount + 1 }
      : d
    ));
  }, []);

  const deleteDoc = useCallback((id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
  }, []);

  // Collect all unique tag names across all notes
  const allTags: TagEntry[] = (() => {
    const map = new Map<string, string>();
    docs.forEach(d => d.tags.forEach(t => {
      if (!map.has(t.name)) map.set(t.name, t.color);
    }));
    return Array.from(map.entries()).map(([name, color]) => ({ name, color }));
  })();

  return { docs, folders, addDoc, updateDoc, deleteDoc, visitDoc, addFolder, updateFolder, deleteFolder, allTags };
}
