import { useState, useCallback } from "react";

interface ValidationResult {
  isValid: boolean;
  suggestions: string[];
  message?: string;
}

// Common English words for suggestion matching
const COMMON_WORDS = [
  "about", "above", "accept", "across", "action", "active", "actual", "added",
  "adjust", "admit", "adult", "advance", "advice", "affect", "afford", "afraid",
  "after", "again", "agree", "ahead", "allow", "almost", "alone", "along",
  "already", "always", "amount", "ancient", "anger", "angle", "animal", "annual",
  "answer", "apart", "appeal", "appear", "apply", "approach", "approve", "argue",
  "arise", "arrange", "arrive", "aside", "assume", "attach", "attack", "attempt",
  "attend", "avoid", "aware", "basic", "basis", "beach", "beautiful", "become",
  "before", "begin", "behind", "believe", "belong", "beneath", "beside", "better",
  "beyond", "bitter", "blame", "blend", "blind", "block", "blood", "board",
  "border", "bother", "bottom", "branch", "brave", "break", "breath", "bridge",
  "brief", "bright", "bring", "broad", "broken", "brother", "budget", "build",
  "burden", "cabinet", "calculate", "capable", "capture", "careful", "carry",
  "castle", "casual", "caught", "cause", "center", "certain", "chair", "challenge",
  "chance", "change", "chapter", "charge", "chart", "cheap", "check", "chief",
  "child", "choice", "choose", "circle", "citizen", "civil", "claim", "class",
  "clean", "clear", "client", "climb", "close", "cloth", "cloud", "coach",
  "coast", "coffee", "collect", "college", "color", "column", "combine", "come",
  "comfort", "command", "comment", "commit", "common", "communicate", "community",
  "company", "compare", "compete", "complete", "complex", "concern", "condition",
  "conduct", "confirm", "conflict", "connect", "consider", "consist", "constant",
  "contact", "contain", "content", "context", "continue", "contract", "control",
  "conversation", "convert", "convince", "correct", "count", "country", "couple",
  "courage", "course", "cover", "create", "credit", "crime", "crisis", "critical",
  "cross", "crowd", "crucial", "cultural", "culture", "current", "customer",
  "damage", "danger", "debate", "decade", "decide", "declare", "decline", "deep",
  "defeat", "defend", "define", "degree", "delay", "deliver", "demand", "demonstrate",
  "deny", "depart", "depend", "derive", "describe", "design", "desire", "despite",
  "detail", "detect", "determine", "develop", "device", "devote", "differ",
  "difficult", "dinner", "direct", "disappear", "discover", "discuss", "disease",
  "display", "distance", "distinct", "distribute", "district", "divide", "doctor",
  "document", "domain", "domestic", "doubt", "draft", "drama", "draw", "dream",
  "drive", "during", "eager", "early", "earth", "easily", "economic", "education",
  "effect", "effort", "eight", "either", "elect", "element", "eliminate", "emerge",
  "emotion", "emphasis", "employ", "enable", "encounter", "encourage", "enemy",
  "energy", "engage", "engine", "enjoy", "enormous", "enough", "ensure", "enter",
  "entire", "entry", "environment", "equal", "error", "escape", "essential",
  "establish", "evaluate", "evening", "event", "eventually", "every", "evidence",
  "evolve", "exact", "examine", "example", "excellent", "except", "exchange",
  "excite", "execute", "exercise", "exhibit", "exist", "expand", "expect",
  "expense", "experience", "experiment", "expert", "explain", "explore", "expose",
  "extend", "external", "extra", "extreme", "fabric", "facility", "factor",
  "failure", "faith", "familiar", "family", "famous", "fancy", "fashion", "father",
  "fault", "favor", "feature", "federal", "fellow", "field", "fight", "figure",
  "final", "finance", "finger", "finish", "first", "floor", "focus", "follow",
  "force", "foreign", "forest", "forget", "formal", "former", "fortune", "forward",
  "found", "foundation", "frame", "freedom", "friend", "front", "fruit", "function",
  "future", "garden", "gather", "general", "generate", "gentle", "giant", "global",
  "golden", "govern", "grace", "grade", "grand", "grant", "grass", "great",
  "green", "ground", "group", "growth", "guard", "guess", "guide", "guilty",
  "handle", "happen", "happy", "harbor", "hardly", "health", "heart", "heavy",
  "height", "hello", "hence", "hidden", "highly", "history", "honor", "horse",
  "hospital", "hotel", "house", "human", "humor", "hungry", "identify", "ignore",
  "illustrate", "image", "imagine", "immediate", "impact", "implement", "imply",
  "import", "impose", "improve", "incident", "include", "increase", "indeed",
  "indicate", "individual", "industry", "influence", "inform", "initial", "inner",
  "input", "inquiry", "insert", "inside", "insist", "install", "instance",
  "instead", "institution", "intend", "interest", "internal", "interpret",
  "introduce", "invest", "investigate", "invite", "involve", "island", "issue",
  "journey", "judge", "junior", "justice", "justify", "kernel", "kitchen",
  "knowledge", "labor", "landscape", "language", "large", "later", "latter",
  "launch", "layer", "leader", "learn", "least", "leave", "legal", "length",
  "lesson", "letter", "level", "liberal", "library", "light", "limit", "linked",
  "listen", "little", "local", "locate", "lonely", "lovely", "lower", "lucky",
  "machine", "magic", "maintain", "major", "manage", "manner", "march", "margin",
  "market", "master", "match", "material", "matter", "maybe", "measure", "media",
  "medical", "medium", "member", "memory", "mental", "mention", "merely", "method",
  "middle", "might", "military", "mind", "minister", "minor", "minute", "mirror",
  "mission", "mistake", "mixed", "model", "modern", "modify", "moment", "money",
  "monitor", "month", "moral", "moreover", "mother", "motion", "mountain", "mouth",
  "movement", "multiple", "murder", "muscle", "music", "mutual", "mystery",
  "narrow", "nation", "native", "natural", "nature", "nearby", "nearly",
  "necessary", "negative", "neighbor", "neither", "nerve", "network", "never",
  "night", "noble", "nobody", "normal", "notice", "notion", "novel", "number",
  "object", "objective", "obligation", "observe", "obtain", "obvious", "occasion",
  "occupy", "occur", "offense", "offer", "office", "officer", "official", "often",
  "opening", "operate", "opinion", "oppose", "option", "orange", "order",
  "ordinary", "organize", "origin", "other", "otherwise", "ought", "outcome",
  "outside", "overall", "overcome", "owner", "package", "palace", "panel",
  "parent", "partly", "partner", "passage", "passion", "patient", "pattern",
  "pause", "payment", "peace", "people", "perceive", "perfect", "perform",
  "perhaps", "period", "permit", "person", "phase", "philosophy", "photograph",
  "physical", "piano", "picture", "piece", "pilot", "pitch", "place", "plain",
  "planet", "plant", "plate", "platform", "player", "please", "pleasure", "plenty",
  "pocket", "poetry", "point", "police", "policy", "political", "popular",
  "population", "portion", "portrait", "position", "positive", "possess",
  "possible", "potential", "poverty", "power", "practice", "prayer", "precise",
  "predict", "prefer", "prepare", "present", "preserve", "president", "press",
  "pressure", "pretty", "prevent", "previous", "price", "pride", "primary",
  "prince", "principle", "prior", "prison", "privacy", "private", "probably",
  "problem", "procedure", "proceed", "process", "produce", "product", "profession",
  "professor", "profit", "program", "progress", "project", "promise", "promote",
  "proper", "property", "proportion", "proposal", "propose", "prospect", "protect",
  "protein", "protest", "proud", "provide", "province", "public", "publish",
  "pull", "purchase", "pure", "purple", "purpose", "pursue", "qualify", "quarter",
  "question", "quick", "quiet", "quite", "quote", "radical", "range", "rapid",
  "rarely", "rather", "reach", "react", "reading", "ready", "reality", "realize",
  "really", "reason", "recall", "receive", "recent", "recognize", "recommend",
  "record", "recover", "reduce", "refer", "reflect", "reform", "regard", "region",
  "register", "regular", "reject", "relate", "relationship", "release", "relief",
  "religion", "remain", "remark", "remember", "remind", "remote", "remove",
  "repeat", "replace", "report", "represent", "republic", "request", "require",
  "research", "reserve", "resident", "resist", "resolve", "resource", "respond",
  "response", "restore", "result", "retain", "retire", "return", "reveal",
  "revenue", "review", "revolution", "rhythm", "right", "river", "rough", "round",
  "royal", "rural", "sacred", "safety", "sample", "satisfy", "scale", "scene",
  "schedule", "scheme", "scholar", "school", "science", "score", "screen", "search",
  "season", "secret", "section", "sector", "secure", "select", "senior", "sense",
  "sensitive", "separate", "sequence", "series", "serious", "serve", "service",
  "session", "settle", "seven", "severe", "shadow", "shape", "share", "sharp",
  "shelter", "shift", "shine", "shoot", "short", "should", "shoulder", "shout",
  "sight", "signal", "silence", "silver", "similar", "simple", "since", "single",
  "sister", "skill", "sleep", "slight", "slowly", "small", "smart", "smile",
  "smooth", "social", "society", "soldier", "solid", "solution", "solve",
  "someone", "somewhat", "sorry", "source", "southern", "space", "speak",
  "special", "specific", "speech", "speed", "spend", "spirit", "split", "sport",
  "spread", "spring", "square", "stable", "staff", "stage", "stand", "standard",
  "start", "state", "statement", "station", "status", "steady", "steel", "stick",
  "still", "stock", "stone", "store", "storm", "story", "straight", "strange",
  "strategic", "stream", "street", "strength", "stress", "stretch", "strict",
  "strike", "string", "strip", "strong", "structure", "struggle", "student",
  "study", "stuff", "style", "subject", "submit", "succeed", "success", "sudden",
  "suffer", "suggest", "summer", "super", "supply", "support", "suppose", "sure",
  "surface", "surprise", "surround", "survey", "survive", "suspect", "sustain",
  "sweet", "swing", "symbol", "sympathy", "system", "table", "tackle", "talent",
  "target", "teach", "technical", "technique", "technology", "temple", "temporary",
  "tendency", "tension", "terms", "terrible", "testify", "thank", "theater",
  "their", "theme", "theory", "therapy", "thick", "thing", "think", "third",
  "those", "though", "thought", "thousand", "threat", "three", "through",
  "throw", "tight", "tired", "title", "today", "together", "tomorrow", "tonight",
  "total", "touch", "tough", "toward", "tower", "track", "trade", "tradition",
  "traffic", "trail", "train", "transfer", "transform", "transition", "travel",
  "treat", "treatment", "trend", "trial", "trick", "trigger", "triumph", "trouble",
  "truly", "trust", "truth", "twelve", "twice", "typical", "ultimate", "unable",
  "uncle", "under", "understand", "unfortunately", "union", "unique", "united",
  "universe", "university", "unknown", "unless", "unlike", "until", "unusual",
  "upper", "urban", "usual", "useful", "valley", "valuable", "value", "variety",
  "various", "vehicle", "venture", "version", "victim", "victory", "video",
  "village", "violence", "virtue", "visible", "vision", "visit", "visual", "vital",
  "voice", "volume", "voter", "vulnerable", "wage", "waste", "watch", "water",
  "weapon", "weather", "weight", "welcome", "welfare", "western", "whatever",
  "wheel", "where", "whether", "which", "while", "whisper", "white", "whole",
  "widely", "willing", "window", "winter", "wisdom", "withdraw", "within",
  "without", "witness", "woman", "wonder", "wooden", "worker", "world", "worry",
  "worth", "would", "wound", "write", "writer", "wrong", "yellow", "young", "youth"
];

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function getSuggestions(word: string, max = 3): string[] {
  const lower = word.toLowerCase();
  const scored = COMMON_WORDS
    .map((w) => ({ word: w, dist: levenshtein(lower, w) }))
    .filter((s) => s.dist <= 3 && s.dist > 0)
    .sort((a, b) => a.dist - b.dist);
  return scored.slice(0, max).map((s) => s.word);
}

export function useWordValidation() {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  const validate = useCallback(async (word: string): Promise<boolean> => {
    const trimmed = word.trim().toLowerCase();
    if (!trimmed) return false;

    setValidating(true);
    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(trimmed)}`
      );
      if (res.ok) {
        setValidationResult(null);
        setValidating(false);
        return true;
      }
      // Word not found
      const suggestions = getSuggestions(trimmed);
      setValidationResult({
        isValid: false,
        suggestions,
        message: `"${word}" not found in dictionary`,
      });
      setValidating(false);
      return false;
    } catch {
      // On network error, allow the word
      setValidationResult(null);
      setValidating(false);
      return true;
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);

  return { validate, validationResult, validating, clearValidation };
}
