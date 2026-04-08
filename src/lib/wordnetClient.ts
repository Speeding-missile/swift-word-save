// src/lib/wordnetClient.ts
export interface WordNetResult {
    word: string;
    pos: string;
    definition: string;
    examples: string[];
}

let wordnetCache: Record<string, { pos: string; definition: string; examples: string[] }> | null = null;
let loadPromise: Promise<void> | null = null;

export async function loadWordNet(): Promise<void> {
    if (wordnetCache) return;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        try {
            const res = await fetch('/wordnet.json');
            if (!res.ok) throw new Error('Failed to load WordNet');
            wordnetCache = await res.json();
        } catch (err) {
            console.error('WordNet load error:', err);
            wordnetCache = {};
        }
    })();

    return loadPromise;
}

export function lookupWord(word: string): WordNetResult | null {
    if (!wordnetCache) return null;
    const entry = wordnetCache[word.toLowerCase()];
    if (!entry) return null;

    return {
        word: word.toLowerCase(),
        pos: entry.pos,
        definition: entry.definition,
        examples: (entry.examples || []).slice(0, 2)
    };
}