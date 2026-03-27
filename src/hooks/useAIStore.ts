import { create } from 'zustand';

interface AIState {
  isSupported: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error';
  progress: number;
  loadingMessage: string;
  loadModel: () => void;
  generateFakeDefinitions: (word: string, actualMeaning: string) => Promise<string[]>;
}

let worker: Worker | null = null;
let resolveGeneration: ((value: string[]) => void) | null = null;
let rejectGeneration: ((reason?: any) => void) | null = null;

export const useAIStore = create<AIState>((set, get) => ({
  isSupported: typeof Worker !== 'undefined',
  status: 'idle',
  progress: 0,
  loadingMessage: '',

  loadModel: () => {
    if (get().status === 'ready' || get().status === 'loading') return;
    
    set({ status: 'loading', loadingMessage: 'Starting local AI engine...' });
    
    if (!worker) {
      // Import the worker using Vite's built-in worker query
      worker = new Worker(new URL('../workers/ai.worker.ts', import.meta.url), {
        type: 'module'
      });

      worker.addEventListener('message', (e) => {
        const { status, name, file, progress, output } = e.data;

        switch (status) {
          case 'initiate':
            set({ loadingMessage: `Connecting to ${name}...` });
            break;
          case 'progress':
            set({ loadingMessage: `Downloading AI brain (${file})...`, progress: Math.round(progress) });
            break;
          case 'done':
            set({ loadingMessage: `Loaded ${file}` });
            break;
          case 'ready':
            set({ status: 'ready', progress: 100, loadingMessage: 'AI Ready!' });
            break;
          case 'complete':
            if (resolveGeneration && output && output[0]?.generated_text) {
               const rawText = output[0].generated_text as string;
               // The model might output something like "apple, orange, banana" or "1. apple\n2. orange..."
               // We try to extract words
               let options: string[] = [];
               if (rawText.includes(',')) {
                 options = rawText.split(',').map(w => w.trim().replace(/[^a-zA-Z]/g, '')).filter(w => w.length > 2);
               } else {
                 options = rawText.split(/(?:\n|\.\s)/)
                   .map(l => l.replace(/^[0-9\.\-\* ]+/, '').trim().split(' ')[0]) // take first word of each line
                   .filter(w => w && w.length > 2);
               }
               
               options = options.slice(0, 3);

               // Fallback if the small model fails instruction
               const fallbacks = ["luminous", "erratic", "placid", "verbose", "tactile"];
               while(options.length < 3) {
                 const fb = fallbacks[Math.floor(Math.random() * fallbacks.length)];
                 if (!options.includes(fb)) options.push(fb);
               }

               resolveGeneration(options);
               resolveGeneration = null;
               rejectGeneration = null;
            } else if (rejectGeneration) {
               rejectGeneration(new Error("Empty AI output"));
            }
            break;
        }
      });
    }

    // Ping worker to load the pipeline entirely
    worker.postMessage({ type: 'load' });
  },

  generateFakeDefinitions: (word: string, meaning: string) => {
     return new Promise((resolve, reject) => {
        if (!worker || get().status !== 'ready') {
           reject(new Error("AI Model not loaded or not ready"));
           return;
        }
        
        resolveGeneration = resolve;
        rejectGeneration = reject;

        // LaMini-Flan follows precise instructions. We ask for 3 distinct false words.
        const prompt = `Task: Provide 3 valid English vocabulary words that are completely unrelated to "${word}".\nRule: Output strictly a comma-separated list of exactly 3 words. No extra text, no numbers, no explanations.`;
        
        worker.postMessage({ type: 'generate', text: prompt });
     });
  }
}));
