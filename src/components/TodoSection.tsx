import { useState, useRef, useEffect } from "react";
import { Plus, CheckCircle2, ChevronDown, ChevronUp, Trash2, GripVertical, Settings, MoreHorizontal, Eraser, Check } from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useTodoStore, type Todo } from "@/hooks/useTodoStore";

const TODO_COLORS = [
  { name: "Default", bg: "bg-secondary/20", text: "text-muted-foreground", border: "border-border", dot: "bg-muted-foreground/30" },
  { name: "Indigo", bg: "bg-indigo-500/20", text: "text-indigo-500", border: "border-indigo-500/30", dot: "bg-indigo-500" },
  { name: "Emerald", bg: "bg-emerald-500/20", text: "text-emerald-500", border: "border-emerald-500/30", dot: "bg-emerald-500" },
  { name: "Amber", bg: "bg-amber-500/20", text: "text-amber-500", border: "border-amber-500/30", dot: "bg-amber-500" },
  { name: "Rose", bg: "bg-rose-500/20", text: "text-rose-500", border: "border-rose-500/30", dot: "bg-rose-500" },
  { name: "Violet", bg: "bg-violet-500/20", text: "text-violet-500", border: "border-violet-500/30", dot: "bg-violet-500" },
];

function TodoItem({ todo, isFirst, isLast }: { todo: Todo; isFirst: boolean; isLast: boolean }) {
  const { toggleTodo, deleteTodo, updateTodoText, updateTodoColor, moveTodo } = useTodoStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const color = TODO_COLORS[todo.colorIndex] || TODO_COLORS[0];

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleBlur = () => {
    if (editText.trim()) {
      updateTodoText(todo.id, editText);
    } else {
      setEditText(todo.text);
    }
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      className={`group relative flex items-center gap-3 p-3 rounded-xl border border-border bg-card/60 backdrop-blur-sm transition-all hover:border-primary/20 ${todo.completed ? 'opacity-60' : ''}`}
      style={{ zIndex: showColorPicker ? 50 : 1 }}
    >
      {/* Up/Down buttons */}
      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => !isFirst && moveTodo(todo.id, "up")}
          disabled={isFirst}
          className={`p-0.5 rounded hover:bg-secondary transition-colors ${isFirst ? 'text-muted-foreground/10' : 'text-muted-foreground/40 hover:text-primary'}`}
        >
          <ChevronUp size={10} strokeWidth={3} />
        </button>
        <button
          onClick={() => !isLast && moveTodo(todo.id, "down")}
          disabled={isLast}
          className={`p-0.5 rounded hover:bg-secondary transition-colors ${isLast ? 'text-muted-foreground/10' : 'text-muted-foreground/40 hover:text-primary'}`}
        >
          <ChevronDown size={10} strokeWidth={3} />
        </button>
      </div>

      <button
        onClick={() => toggleTodo(todo.id)}
        className={`flex-shrink-0 h-4 w-4 rounded-full border flex items-center justify-center transition-all ${todo.completed ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 hover:border-primary'
          }`}
      >
        {todo.completed && <Check size={8} strokeWidth={4} />}
      </button>

      {/* Todo text / input */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === "Enter" && handleBlur()}
            className="w-full bg-transparent font-mono text-xs outline-none text-foreground border-b border-primary/40 pb-0.5"
          />
        ) : (
          <p
            onClick={() => !todo.completed && setIsEditing(true)}
            className={`font-mono text-xs truncate transition-all ${todo.completed ? 'line-through text-muted-foreground' : 'text-foreground hover:text-primary cursor-text'}`}
          >
            {todo.text}
          </p>
        )}
      </div>

      {/* Color Indicator & Menu */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`h-2.5 w-2.5 rounded-full ${color.dot} transition-transform hover:scale-125`}
          />
          <AnimatePresence>
            {showColorPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 5 }}
                  className="absolute right-0 top-full mt-2 z-50 p-1.5 bg-card/95 backdrop-blur-xl border border-border rounded-lg flex gap-1 shadow-2xl"
                >
                  {TODO_COLORS.map((c, idx) => (
                    <button
                      key={idx}
                      onClick={() => { updateTodoColor(todo.id, idx); setShowColorPicker(false); }}
                      className={`h-3 w-3 rounded-full ${c.dot} transition-all hover:scale-125 ${todo.colorIndex === idx ? 'ring-1 ring-offset-1 ring-offset-card ring-primary' : ''}`}
                    />
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => deleteTodo(todo.id)}
          className="p-1 text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>
  );
}

export function TodoSection() {
  const { todos, addTodo, reorderTodos, clearAll } = useTodoStore();
  const [newText, setNewText] = useState("");
  const [selectedColor, setSelectedColor] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  const handleAdd = () => {
    if (newText.trim()) {
      addTodo(newText.trim(), selectedColor);
      setNewText("");
    }
  };

  const handleDeleteAll = () => {
    if (isDeleting) {
      clearAll();
      setIsDeleting(false);
    } else {
      setIsDeleting(true);
      setTimeout(() => setIsDeleting(false), 3000); // Reset confirmation after 3s
    }
  };

  return (
    <div className="p-4 rounded-2xl border border-border bg-card/40 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Focus</p>
          <h3 className="font-mono text-xs font-bold uppercase tracking-tight">Tasks</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`p-1.5 rounded-lg border border-border transition-all hover:bg-accent font-mono text-[9px] uppercase font-bold flex items-center gap-1.5 ${showCompleted ? 'text-primary border-primary/30' : 'text-muted-foreground'}`}
          >
            {showCompleted ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {showCompleted ? "Hide Done" : "View Done"}
          </button>

          {todos.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className={`p-1.5 rounded-lg border transition-all font-mono text-[9px] uppercase font-bold flex items-center gap-1.5 ${isDeleting ? 'bg-destructive/10 border-destructive shadow-sm text-destructive animate-pulse' : 'border-border text-muted-foreground/40 hover:text-destructive hover:border-destructive/30'}`}
            >
              <Trash2 size={10} />
              {isDeleting ? "Sure?" : ""}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Input area */}
        <div className="flex flex-col gap-2 p-1.5 rounded-xl border border-border bg-card/60 group focus-within:border-primary/40 transition-all">
          <div className="flex items-center gap-2">
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Add quick task..."
              className="flex-1 bg-transparent font-mono text-xs px-2 py-1 outline-none text-foreground placeholder:text-muted-foreground/30"
            />
            <button
              onClick={handleAdd}
              disabled={!newText.trim()}
              className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3 px-2 py-1 border-t border-border/20 pt-1.5 mt-0.5">
            <span className="font-mono text-[8px] uppercase font-bold text-muted-foreground/50 tracking-tighter">Category:</span>
            <div className="flex items-center gap-2">
              {TODO_COLORS.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedColor(idx)}
                  className={`h-2.5 w-2.5 rounded-full ${c.dot} transition-all hover:scale-125 ${selectedColor === idx ? 'ring-2 ring-offset-2 ring-offset-card ring-primary' : 'opacity-40 hover:opacity-100'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="relative max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
          <div className="space-y-2">
            <AnimatePresence mode="popLayout" initial={false}>
              {activeTodos.map((todo, idx) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  isFirst={idx === 0}
                  isLast={idx === activeTodos.length - 1}
                />
              ))}
            </AnimatePresence>
          </div>

          {activeTodos.length === 0 && !showCompleted && (
            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-border rounded-xl opacity-20 grayscale">
              <CheckCircle2 size={24} className="mb-2" />
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] font-bold">Inbox Zero</p>
            </div>
          )}

          {/* Completed Section */}
          <AnimatePresence>
            {showCompleted && completedTodos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-4 pt-4 border-t border-border/50"
              >
                <div className="space-y-2">
                  {completedTodos.map((todo, idx) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      isFirst={idx === 0}
                      isLast={idx === completedTodos.length - 1}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
