import { useState, useEffect, useRef, useCallback } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { WordEntry } from "@/hooks/useWordStore";
import { useDictionary } from "@/hooks/useDictionary";
import { CATEGORIES, categorizeWord } from "@/lib/wordCategories";

interface CategoryData {
  category: string;
  label: string;
  words: string[];
  count: number;
}

interface GraphNetworkViewProps {
  words: WordEntry[];
  onClose: () => void;
}

// Simple force-directed node positions
function layoutNodes(categories: CategoryData[], width: number, height: number) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.32;

  return categories.map((cat, i) => {
    const angle = (2 * Math.PI * i) / categories.length - Math.PI / 2;
    return {
      ...cat,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      size: Math.max(28, Math.min(55, 28 + cat.count * 6)),
    };
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  praise: "hsl(142, 50%, 45%)",
  scold: "hsl(0, 60%, 50%)",
  emotion: "hsl(280, 50%, 55%)",
  action: "hsl(30, 70%, 50%)",
  intellect: "hsl(210, 60%, 50%)",
  nature: "hsl(150, 60%, 40%)",
  social: "hsl(190, 60%, 45%)",
  descriptive: "hsl(50, 60%, 45%)",
  uncategorized: "hsl(0, 0%, 50%)",
};

export function GraphNetworkView({ words, onClose }: GraphNetworkViewProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [categorized, setCategorized] = useState<CategoryData[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const { lookup } = useDictionary();

  useEffect(() => {
    const categorize = async () => {
      const catMap: Record<string, Set<string>> = {};

      for (const w of words) {
        const entry = await lookup(w.word);
        const def = entry?.meanings[0]?.definitions[0]?.definition || "";
        const cats = categorizeWord(w.word, def);
        cats.forEach((c) => {
          if (!catMap[c]) catMap[c] = new Set();
          catMap[c].add(w.word);
        });
      }

      const result: CategoryData[] = Object.entries(catMap)
        .map(([cat, wordSet]) => ({
          category: cat,
          label: CATEGORIES[cat]?.label || "Other",
          words: [...wordSet],
          count: wordSet.size,
        }))
        .sort((a, b) => b.count - a.count);

      setCategorized(result);
    };

    categorize();
  }, [words, lookup]);

  const svgWidth = 380;
  const svgHeight = 400;
  const nodes = layoutNodes(categorized, svgWidth, svgHeight);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto"
      >
        <div className="mx-auto w-full max-w-lg px-4 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-widest">
                Word Network
              </h2>
              <p className="font-mono text-[10px] text-muted-foreground">
                {words.length} words across {categorized.length} categories
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-accent"
              >
                <ZoomIn size={12} />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-accent"
              >
                <ZoomOut size={12} />
              </button>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-accent"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Graph */}
          <div
            ref={canvasRef}
            className="rounded-lg border border-border bg-card overflow-hidden mb-4"
          >
            <svg
              width="100%"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
            >
              {/* Lines from center to nodes */}
              {nodes.map((node) => (
                <line
                  key={`line-${node.category}`}
                  x1={svgWidth / 2}
                  y1={svgHeight / 2}
                  x2={node.x}
                  y2={node.y}
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity={0.5}
                />
              ))}

              {/* Center node */}
              <circle
                cx={svgWidth / 2}
                cy={svgHeight / 2}
                r={20}
                fill="hsl(var(--primary))"
                opacity={0.9}
              />
              <text
                x={svgWidth / 2}
                y={svgHeight / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(var(--primary-foreground))"
                fontSize="7"
                fontFamily="monospace"
                fontWeight="bold"
              >
                YOU
              </text>

              {/* Category nodes */}
              {nodes.map((node) => (
                <g
                  key={node.category}
                  onClick={() =>
                    setSelectedCat(selectedCat === node.category ? null : node.category)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size / 2}
                    fill={CATEGORY_COLORS[node.category] || "hsl(0,0%,50%)"}
                    opacity={
                      selectedCat === null || selectedCat === node.category ? 0.85 : 0.25
                    }
                    stroke={
                      selectedCat === node.category
                        ? "hsl(var(--foreground))"
                        : "transparent"
                    }
                    strokeWidth="2"
                  />
                  <text
                    x={node.x}
                    y={node.y - 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {node.label}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + 9}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(255,255,255,0.7)"
                    fontSize="7"
                    fontFamily="monospace"
                  >
                    {node.count}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Selected category detail */}
          <AnimatePresence>
            {selectedCat && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="rounded-lg border border-border bg-card p-3 mb-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor:
                          CATEGORY_COLORS[selectedCat] || "hsl(0,0%,50%)",
                      }}
                    />
                    <h3 className="font-mono text-sm font-bold">
                      {CATEGORIES[selectedCat]?.label || "Other"}
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {categorized.find((c) => c.category === selectedCat)?.count || 0} words
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {categorized
                    .find((c) => c.category === selectedCat)
                    ?.words.map((w) => (
                      <span
                        key={w}
                        className="rounded-md border border-border px-2 py-0.5 font-mono text-xs"
                      >
                        {w}
                      </span>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category breakdown list */}
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Category Breakdown
            </p>
            {categorized.map((cat) => {
              const pct = words.length > 0 ? Math.round((cat.count / words.length) * 100) : 0;
              return (
                <div
                  key={cat.category}
                  onClick={() =>
                    setSelectedCat(selectedCat === cat.category ? null : cat.category)
                  }
                  className="flex items-center gap-3 rounded-md border border-border bg-card p-2.5 cursor-pointer hover:border-muted-foreground transition-colors"
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[cat.category] || "hsl(0,0%,50%)",
                    }}
                  />
                  <span className="font-mono text-xs font-bold flex-1">{cat.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            CATEGORY_COLORS[cat.category] || "hsl(0,0%,50%)",
                        }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground w-8 text-right">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
