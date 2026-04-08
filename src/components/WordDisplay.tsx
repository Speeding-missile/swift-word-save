import { useEffect, useState } from 'react';
import { loadWordNet, lookupWord } from '../lib/wordnetClient';

export default function WordDisplay({ word }: { word: string }) {
    const [data, setData] = useState<ReturnType<typeof lookupWord>>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        loadWordNet().then(() => {
            if (mounted) {
                setData(lookupWord(word));
                setLoading(false);
            }
        });
        return () => { mounted = false; };
    }, [word]);

    if (loading) return <div className="text-sm text-gray-500">Loading dictionary...</div>;
    if (!data) return <div className="text-sm text-red-500">Word not in database</div>;

    return (
        <div className="p-3 border rounded bg-white dark:bg-gray-800 space-y-2">
            <div className="flex justify-between">
                <h3 className="font-semibold capitalize">{data.word}</h3>
                <span className="text-xs italic text-gray-500">{data.pos}</span>
            </div>
            <p className="text-sm">{data.definition}</p>
            {data.examples.length > 0 && (
                <ul className="pl-2 border-l-2 border-blue-500 space-y-1">
                    {data.examples.map((ex, i) => (
                        <li key={i} className="text-sm text-gray-600 dark:text-gray-400 italic">“{ex}”</li>
                    ))}
                </ul>
            )}
        </div>
    );
}