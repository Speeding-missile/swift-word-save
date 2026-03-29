import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  colorIndex: number;
}

interface TodoStore {
  todos: Todo[];
  addTodo: (text: string, colorIndex?: number) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  updateTodoText: (id: string, text: string) => void;
  updateTodoColor: (id: string, colorIndex: number) => void;
  reorderTodos: (newTodos: Todo[]) => void;
  moveTodo: (id: string, direction: "up" | "down") => void;
  clearAll: () => void;
}

export const useTodoStore = create<TodoStore>()(
  persist(
    (set) => ({
      todos: [],
      addTodo: (text, colorIndex = 0) => {
        const newTodo: Todo = {
          id: crypto.randomUUID(),
          text,
          completed: false,
          colorIndex,
        };
        set((state) => ({ todos: [newTodo, ...state.todos] }));
      },
      toggleTodo: (id) => {
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        }));
      },
      deleteTodo: (id) => {
        set((state) => ({
          todos: state.todos.filter((t) => t.id !== id),
        }));
      },
      updateTodoText: (id, text) => {
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id ? { ...t, text } : t
          ),
        }));
      },
      updateTodoColor: (id, colorIndex) => {
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id ? { ...t, colorIndex } : t
          ),
        }));
      },
      reorderTodos: (newTodos) => set({ todos: newTodos }),
      moveTodo: (id, direction) => {
        set((state) => {
          const index = state.todos.findIndex((t) => t.id === id);
          if (index === -1) return state;
          const newTodos = [...state.todos];
          const targetIndex = direction === "up" ? index - 1 : index + 1;
          if (targetIndex < 0 || targetIndex >= newTodos.length) return state;
          
          const temp = newTodos[index];
          newTodos[index] = newTodos[targetIndex];
          newTodos[targetIndex] = temp;
          
          return { todos: newTodos };
        });
      },
      clearAll: () => set({ todos: [] }),
    }),
    { name: "wordvault_todos" }
  )
);
