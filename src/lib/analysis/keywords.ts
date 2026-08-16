export const CANONICAL_SKILLS = [
  "react",
  "next.js",
  "typescript",
  "javascript",
  "node.js",
  "python",
  "sql",
  "postgresql",
  "mysql",
  "mongodb",
  "redis",
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "gcp",
  "tailwind",
  "figma",
  "excel",
  "power bi",
  "tableau",
  "data analysis",
  "machine learning",
  "llm",
  "prompt engineering",
  "product management",
  "project management",
  "communication",
  "leadership",
  "customer success",
  "salesforce",
  "git",
  "rest api",
  "graphql",
  "testing",
  "cypress",
  "playwright",
  "seo",
  "content strategy",
  "copywriting",
  "user research",
  "accessibility",
  "agile",
  "scrum",
];

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "because",
  "between",
  "could",
  "first",
  "great",
  "having",
  "there",
  "their",
  "these",
  "those",
  "while",
  "where",
  "which",
  "would",
  "using",
  "build",
  "built",
  "needs",
  "need",
  "role",
  "team",
  "work",
  "works",
  "must",
  "want",
  "with",
  "your",
  "from",
  "into",
  "that",
  "this",
  "will",
  "have",
  "has",
  "had",
  "were",
  "been",
  "them",
  "they",
  "then",
  "than",
]);

export function normalizeText(input: string) {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

export function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export function extractKeywords(text: string) {
  const normalized = normalizeText(text);
  const canonicalHits = CANONICAL_SKILLS.filter((skill) =>
    normalized.includes(skill),
  );

  const tokenHits = normalized
    .replace(/[^a-z0-9+\-./# ]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token));

  return unique([...canonicalHits, ...tokenHits]).slice(0, 30);
}

export function sentenceSplit(text: string) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length >= 20);
}
