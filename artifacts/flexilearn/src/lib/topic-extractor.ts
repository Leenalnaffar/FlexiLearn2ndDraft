export interface ExtractedTopic {
  topic: string;
  subject: string;
  scoreBoost: number;
}

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  Biology: [
    "biology", "cell", "dna", "rna", "photosynthesis", "evolution", "genetics",
    "gene", "protein", "organism", "ecosystem", "bacteria", "virus", "enzyme",
    "metabolism", "mitosis", "meiosis", "chlorophyll", "respiration", "anatomy",
    "physiology", "ecology", "biodiversity", "chromosome", "mutation",
  ],
  Mathematics: [
    "math", "algebra", "calculus", "geometry", "equation", "derivative",
    "integral", "matrix", "vector", "probability", "statistics", "trigonometry",
    "polynomial", "function", "graph", "quadratic", "linear", "theorem",
    "proof", "number theory", "logarithm", "exponent", "fraction", "ratio",
  ],
  Physics: [
    "physics", "force", "energy", "motion", "gravity", "quantum", "electron",
    "wave", "thermodynamics", "velocity", "acceleration", "momentum", "optics",
    "electromagnetism", "nuclear", "relativity", "particle", "mass", "friction",
    "pressure", "temperature", "light", "sound", "magnetism",
  ],
  Chemistry: [
    "chemistry", "molecule", "atom", "reaction", "acid", "base", "periodic",
    "bond", "compound", "solution", "oxidation", "element", "ion", "covalent",
    "ionic", "organic", "inorganic", "mole", "concentration", "titration",
    "catalyst", "equilibrium", "enthalpy", "electrode", "polymer",
  ],
  History: [
    "history", "war", "revolution", "empire", "civilization", "ancient",
    "medieval", "renaissance", "colonization", "independence", "world war",
    "dynasty", "parliament", "treaty", "political", "industrial revolution",
    "monarchy", "republic", "democracy", "election", "president", "constitution",
  ],
  Literature: [
    "literature", "novel", "poem", "poetry", "shakespeare", "metaphor", "theme",
    "narrative", "character", "plot", "symbolism", "protagonist", "antagonist",
    "allegory", "irony", "fiction", "nonfiction", "essay", "genre", "author",
  ],
  "Computer Science": [
    "programming", "algorithm", "code", "function", "variable", "loop",
    "data structure", "software", "machine learning", "ai", "neural network",
    "database", "api", "object", "class", "inheritance", "recursion",
    "sorting", "binary", "javascript", "python", "java", "typescript",
  ],
  Economics: [
    "economics", "supply", "demand", "market", "inflation", "gdp", "trade",
    "fiscal", "monetary", "microeconomics", "macroeconomics", "price",
    "competition", "monopoly", "currency", "unemployment", "interest rate",
    "investment", "capital", "labor", "productivity",
  ],
  Psychology: [
    "psychology", "behavior", "cognitive", "memory", "emotion", "motivation",
    "perception", "consciousness", "personality", "therapy", "mental health",
    "freud", "pavlov", "conditioning", "stimulus", "response", "social psychology",
  ],
  Geography: [
    "geography", "climate", "continent", "ocean", "biome", "latitude",
    "longitude", "erosion", "tectonic", "plate", "river", "mountain", "desert",
    "rainforest", "weather", "population", "urbanization", "migration",
  ],
  Philosophy: [
    "philosophy", "ethics", "logic", "morality", "plato", "aristotle",
    "socrates", "kant", "epistemology", "metaphysics", "consciousness",
    "free will", "existentialism", "utilitarianism",
  ],
};

export function extractTopics(text: string): ExtractedTopic[] {
  const lower = text.toLowerCase();
  const found: ExtractedTopic[] = [];
  const seenSubjects = new Set<string>();

  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw) && !seenSubjects.has(subject)) {
        seenSubjects.add(subject);
        const topic = kw
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        found.push({ topic, subject, scoreBoost: 12 });
        break;
      }
    }
  }

  return found;
}
