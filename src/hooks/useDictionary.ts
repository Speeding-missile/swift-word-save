import { useState, useEffect, useCallback } from "react";

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  meanings: {
    partOfSpeech: string;
    synonyms?: string[];
    antonyms?: string[];
    definitions: {
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }[];
  }[];
}

const cache = new Map<string, DictionaryEntry | null>();

export function useDictionary() {
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async (word: string): Promise<DictionaryEntry | null> => {
    const key = word.toLowerCase().trim();
    if (cache.has(key)) return cache.get(key)!;

    setLoading(true);
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`);
      if (!res.ok) {
        cache.set(key, null);
        setLoading(false);
        return null;
      }
      const data = await res.json();
      const entry: DictionaryEntry = {
        word: data[0]?.word || key,
        phonetic: data[0]?.phonetic || data[0]?.phonetics?.[0]?.text,
        meanings: (data[0]?.meanings || []).map((m: any) => ({
          partOfSpeech: m.partOfSpeech,
          definitions: (m.definitions || []).slice(0, 2).map((d: any) => ({
            definition: d.definition,
            example: d.example,
          })),
        })),
      };
      cache.set(key, entry);
      setLoading(false);
      return entry;
    } catch {
      cache.set(key, null);
      setLoading(false);
      return null;
    }
  }, []);

  return { lookup, loading };
}
