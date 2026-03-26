// Shared word categories and categorization logic

export const CATEGORIES: Record<string, { keywords: string[]; label: string }> = {
  praise: {
    label: "Praising",
    keywords: [
      "good", "great", "excellent", "wonderful", "beautiful", "amazing", "brilliant",
      "superb", "magnificent", "admire", "commend", "praise", "love", "adore", "cherish",
      "noble", "glorious", "splendid", "divine", "graceful", "elegant", "lovely",
      "kind", "gentle", "generous", "benevolent", "virtuous", "honorable", "worthy",
      "approve", "applaud", "celebrate", "acclaim", "exalt", "glorify", "revere",
    ],
  },
  scold: {
    label: "Scolding",
    keywords: [
      "bad", "terrible", "horrible", "awful", "ugly", "disgust", "hate", "despise",
      "condemn", "criticize", "blame", "scold", "rebuke", "reprimand", "reproach",
      "wicked", "evil", "vile", "nasty", "cruel", "harsh", "bitter", "hostile",
      "denounce", "chastise", "berate", "castigate", "censure", "admonish",
    ],
  },
  emotion: {
    label: "Emotion",
    keywords: [
      "happy", "sad", "angry", "fear", "joy", "sorrow", "grief", "delight",
      "anxiety", "worry", "calm", "peace", "rage", "fury", "bliss", "ecstasy",
      "melancholy", "nostalgia", "empathy", "sympathy", "passion", "desire",
      "hope", "despair", "pride", "shame", "guilt", "envy", "jealousy", "awe",
    ],
  },
  action: {
    label: "Action",
    keywords: [
      "run", "walk", "jump", "fly", "swim", "fight", "build", "create", "destroy",
      "make", "break", "push", "pull", "throw", "catch", "climb", "fall", "rise",
      "move", "stop", "start", "begin", "end", "finish", "complete", "achieve",
      "accomplish", "perform", "execute", "operate", "manage", "handle", "drive",
    ],
  },
  intellect: {
    label: "Intellect",
    keywords: [
      "think", "know", "learn", "study", "understand", "reason", "logic", "wisdom",
      "knowledge", "intelligence", "clever", "smart", "bright", "genius", "insight",
      "analyze", "examine", "investigate", "research", "discover", "invent", "solve",
      "comprehend", "perceive", "recognize", "realize", "imagine", "conceive", "ponder",
    ],
  },
  nature: {
    label: "Nature",
    keywords: [
      "tree", "flower", "river", "mountain", "ocean", "forest", "garden", "sun",
      "moon", "star", "sky", "rain", "wind", "earth", "fire", "water", "cloud",
      "stone", "leaf", "seed", "root", "bloom", "spring", "summer", "winter", "autumn",
    ],
  },
  social: {
    label: "Social",
    keywords: [
      "friend", "family", "community", "society", "group", "team", "partner",
      "relationship", "bond", "connect", "communicate", "share", "help", "support",
      "cooperate", "collaborate", "together", "unite", "gather", "belong", "trust",
      "respect", "honor", "welcome", "greet", "invite", "include", "embrace",
    ],
  },
  descriptive: {
    label: "Descriptive",
    keywords: [
      "big", "small", "tall", "short", "long", "wide", "narrow", "thick", "thin",
      "fast", "slow", "hot", "cold", "warm", "cool", "bright", "dark", "light",
      "heavy", "soft", "hard", "smooth", "rough", "sharp", "dull", "loud", "quiet",
      "fresh", "stale", "clean", "dirty", "pure", "rich", "poor", "deep", "shallow",
    ],
  },
};

export function categorizeWord(word: string, definition?: string): string[] {
  const lower = word.toLowerCase();
  const defLower = (definition || "").toLowerCase();
  const categories: string[] = [];

  for (const [cat, data] of Object.entries(CATEGORIES)) {
    const match = data.keywords.some(
      (kw) => lower.includes(kw) || kw.includes(lower) || defLower.includes(kw)
    );
    if (match) categories.push(cat);
  }

  return categories.length > 0 ? categories : ["uncategorized"];
}

// Fun personality statements based on dominant category
const PERSONALITY_STATEMENTS: Record<string, string[]> = {
  praise: [
    "Hello there, Prince Charming! 👑 Your words drip honey.",
    "Look at you, spreading good vibes like confetti! ✨",
    "Certified hype machine — you never run out of nice things to say!",
    "Your vocabulary is basically a group hug in word form 🤗",
    "Professional compliment dealer detected 💐",
  ],
  scold: [
    "Okay Shakespeare of Shade 🎭 who hurt you?",
    "Your word collection reads like a villain's monologue 😈",
    "Gordon Ramsay would be proud of this vocabulary 🔥",
    "You don't hold back, do you? Respect. 💀",
    "Certified roast master — words that cut deep ⚔️",
  ],
  emotion: [
    "Heart on your sleeve, words on your screen 💕",
    "You're basically a walking feelings dictionary 🎭",
    "Emotionally fluent — therapists would love you 🧠",
    "Your vocabulary hits right in the feels every time 🥹",
    "Main character energy with all these emotional words ✨",
  ],
  action: [
    "All action, no filler — you're a verb machine! 🚀",
    "Your word vault reads like an action movie script 💥",
    "Nike called — they want their 'Just Do It' energy back 🏃",
    "You collect verbs like Pokémon. Gotta catch 'em all! ⚡",
    "Clearly someone who gets things done 💪",
  ],
  intellect: [
    "Big brain energy detected 🧠✨",
    "Your vocabulary is basically a PhD thesis 📚",
    "Okay smarty pants, we get it — you read books 🤓",
    "Walking encyclopedia vibes over here 🎓",
    "Certified nerd (affectionate) with impeccable word taste 💡",
  ],
  nature: [
    "Mother Nature's favorite wordsmith 🌿",
    "Touch grass? You practically ARE grass at this point 🌱",
    "Your word vault is basically a botanical garden 🌸",
    "Planet Earth narrator in the making 🌍",
    "You speak fluent forest 🌲",
  ],
  social: [
    "The ultimate people person — your words prove it 🤝",
    "Social butterfly with a vocabulary to match 🦋",
    "You'd befriend a rock and write a word about it 💛",
    "Community builder, one word at a time 🏘️",
    "Your vocabulary is a group chat in word form 💬",
  ],
  descriptive: [
    "You paint with words — every detail matters to you 🎨",
    "Certified over-describer (complimentary) 🖌️",
    "Your eyes miss nothing — and your words prove it 👁️",
    "Living thesaurus for adjectives right here 📖",
    "You could describe water and make it sound interesting 💧",
  ],
};

export function getPersonalityStatement(
  words: { word: string }[]
): { category: string; statement: string } | null {
  if (words.length < 2) return null;

  // Count words per category
  const counts: Record<string, number> = {};
  words.forEach((w) => {
    const cats = categorizeWord(w.word);
    cats.forEach((c) => {
      counts[c] = (counts[c] || 0) + 1;
    });
  });

  // Find dominant category
  let maxCat = "";
  let maxCount = 0;
  for (const [cat, count] of Object.entries(counts)) {
    if (cat !== "uncategorized" && count > maxCount) {
      maxCount = count;
      maxCat = cat;
    }
  }

  if (!maxCat || !PERSONALITY_STATEMENTS[maxCat]) return null;

  const statements = PERSONALITY_STATEMENTS[maxCat];
  // Use a seeded-ish pick based on word count so it doesn't change every render
  const idx = words.length % statements.length;
  return { category: CATEGORIES[maxCat]?.label || maxCat, statement: statements[idx] };
}
