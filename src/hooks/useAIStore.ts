import { create } from 'zustand';

interface AIState {
  isSupported: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error';
  progress: number;
  loadingMessage: string;
  autoLoad: () => void;
  loadModel: () => void;
  getWordDetails: (word: string) => Promise<{ phonetic: string; meaning: string; usage: string }>;
  generateFakeDefinitions: (word: string, actualMeaning: string) => Promise<string[]>;
}

let worker: Worker | null = null;
let resolveGeneration: ((value: any) => void) | null = null;
let rejectGeneration: ((reason?: any) => void) | null = null;

export const useAIStore = create<AIState>((set, get) => ({
  isSupported: typeof Worker !== 'undefined',
  status: 'idle',
  progress: 0,
  loadingMessage: '',
  
  autoLoad: () => {
    if (get().status === 'idle') {
      get().loadModel();
    }
  },

  loadModel: () => {
    if (get().status === 'ready' || get().status === 'loading') return;
    
    set({ status: 'loading', loadingMessage: 'Starting local AI engine...' });
    
    if (!worker) {
      worker = new Worker(new URL('../workers/ai.worker.ts', import.meta.url), {
        type: 'module'
      });

      worker.addEventListener('message', (e) => {
        const { status, name, file, progress, output, word } = e.data;

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
          case 'completeDetails':
            if (resolveGeneration && output && output[0]?.generated_text) {
               const rawText = output[0].generated_text as string;
               const details = {
                 phonetic: rawText.match(/Phonetic:\s*(.*)/i)?.[1]?.trim() || "",
                 meaning: rawText.match(/Meaning:\s*(.*)/i)?.[1]?.trim() || "",
                 usage: rawText.match(/Usage:\s*(.*)/i)?.[1]?.trim() || "",
               };
               resolveGeneration(details as any);
               resolveGeneration = null;
               rejectGeneration = null;
            }
            break;
          case 'complete':
            if (resolveGeneration && output && output[0]?.generated_text) {
               const rawText = output[0].generated_text as string;
               let options: string[] = [];
               if (rawText.includes(',')) {
                 options = rawText.split(',').map(w => w.trim().replace(/[^a-zA-Z]/g, '')).filter(w => w.length > 2);
               } else {
                 options = rawText.split(/(?:\n|\.\s)/)
                   .map(l => l.replace(/^[0-9\.\-\* ]+/, '').trim().split(' ')[0]) 
                   .filter(w => w && w.length > 2);
               }
               
               options = options.slice(0, 3);
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

    worker.postMessage({ type: 'load' });
  },

  getWordDetails: (word: string) => {
    return new Promise((resolve, reject) => {
       if (!worker || get().status !== 'ready') {
          reject(new Error("AI Model not loaded or not ready"));
          return;
       }
       resolveGeneration = resolve;
       rejectGeneration = reject;
       worker.postMessage({ type: 'getWordDetails', word });
    });
  },

  generateFakeDefinitions: (word: string, meaning: string) => {
     return new Promise((resolve, reject) => {
        if (!worker || get().status !== 'ready') {
           reject(new Error("AI Model not loaded or not ready"));
           return;
        }
        
        resolveGeneration = resolve;
        rejectGeneration = reject;

        const prompt = `Task: Provide 3 valid English vocabulary words that are completely unrelated to "${word}".\nRule: Output strictly a comma-separated list of exactly 3 words. No extra text, no numbers, no explanations.`;
        
        worker.postMessage({ type: 'generate', text: prompt });
     });
  }
}));
