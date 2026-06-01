/**
 * JD-relevance pre-filter for the engineer pool.
 *
 * Why: the matcher pool is now ~750+ profiles. Sending all of them to the LLM
 * in one prompt causes positional anchoring — the model resurfaces the same
 * people regardless of the JD. Scoring each profile against the JD and sending
 * only the most relevant shortlist makes results genuinely JD-specific (and far
 * faster). Ranking is skill/fit based only — availability is not considered.
 */

// Multi-word tech phrases → single canonical token (applied to JD and profiles).
const PHRASE_CANON = [
  [/ruby on rails/g, " ror "],
  [/react native/g, " reactnative "],
  [/react\.?js/g, " react "],
  [/node\.?js/g, " node "],
  [/next\.?js/g, " next "],
  [/nest\.?js/g, " nest "],
  [/vue\.?js/g, " vue "],
  [/express\.?js/g, " express "],
  [/\.net|dot ?net/g, " dotnet "],
  [/ai\s*\/\s*ml|machine learning|deep learning|\bml\b|\bai\b/g, " aiml "],
  [/power platform/g, " powerplatform "],
  [/dynamics 365|d365|dynamics f&o|finance and operations|fin ?ops/g, " dynamics "],
  [/business central/g, " businesscentral "],
  [/supply chain/g, " supplychain "],
  [/spring boot/g, " springboot "],
  [/computer vision/g, " computervision "],
  [/quality assurance|test automation|\bqa\b|\bsdet\b/g, " qa "],
];

// Single-token aliases → canonical form.
const TOKEN_ALIAS = {
  js: "javascript",
  ts: "typescript",
  rails: "ror",
  ruby: "ror",
  py: "python",
  golang: "go",
  postgres: "postgresql",
  k8s: "kubernetes",
  gen: null,
  genai: "genai",
  reactjs: "react",
  nodejs: "node",
  nextjs: "next",
};

// JD role / domain words → tech tokens they imply (improves recall on vague JDs).
const ROLE_EXPANSION = {
  frontend: ["react", "angular", "vue", "next", "javascript", "typescript"],
  "front-end": ["react", "angular", "vue", "next", "javascript", "typescript"],
  backend: ["node", "django", "ror", "python", "java", "dotnet", "php", "nest"],
  "back-end": ["node", "django", "ror", "python", "java", "dotnet", "php", "nest"],
  fullstack: ["mern", "react", "node", "ror", "next"],
  "full-stack": ["mern", "react", "node", "ror", "next"],
  mobile: ["reactnative", "flutter", "kotlin", "swift", "android", "ios"],
  devops: ["aws", "docker", "kubernetes", "terraform", "cicd", "azure", "gcp"],
  cloud: ["aws", "azure", "gcp", "docker", "kubernetes"],
  data: ["python", "sql", "aiml", "postgresql"],
  ml: ["aiml", "python", "mlops"],
  ai: ["aiml", "python", "genai"],
  erp: ["dynamics", "businesscentral", "supplychain"],
  crm: ["dynamics", "salesforce", "powerplatform"],
};

const STOPWORDS = new Set(
  ("a an the and or for with to of in on at as is are be we you our your they "
    + "this that will would should can could must have has had do does need needs "
    + "looking seeking strong experience experienced years year work working developer "
    + "engineer engineering software team role position candidate candidates ideal "
    + "responsibilities requirements required preferred plus knowledge skills skill "
    + "ability build building develop development design designing using use used "
    + "who whom what which when where why how able good great excellent best able").split(" ")
);

function canon(text) {
  let t = ` ${String(text || "").toLowerCase()} `;
  for (const [re, rep] of PHRASE_CANON) t = t.replace(re, rep);
  return t;
}

function tokenize(text) {
  const t = canon(text);
  const raw = t.match(/[a-z0-9#+]+/g) || [];
  const out = new Set();
  for (let tok of raw) {
    if (tok.length < 2 && tok !== "go") continue;
    if (STOPWORDS.has(tok)) continue;
    if (Object.prototype.hasOwnProperty.call(TOKEN_ALIAS, tok)) {
      const a = TOKEN_ALIAS[tok];
      if (a) out.add(a);
      continue;
    }
    out.add(tok);
  }
  return out;
}

/** Build the set of JD tokens, expanded with role/domain synonyms. */
export function jdTokens(jd) {
  const base = tokenize(jd);
  for (const tok of [...base]) {
    const expanded = ROLE_EXPANSION[tok];
    if (expanded) for (const e of expanded) base.add(e);
  }
  return base;
}

/** Relevance score of one resource against a JD token set (skill/fit only). */
export function scoreResource(resource, jdSet) {
  if (jdSet.size === 0) return 0;
  const primary = tokenize(resource.primary);
  const stacks = tokenize(resource.stacks);
  const context = tokenize(
    [resource.industries, resource.designation, resource.team].filter(Boolean).join(" ")
  );

  let score = 0;
  for (const tok of jdSet) {
    if (primary.has(tok)) score += 5;
    else if (stacks.has(tok)) score += 3;
    else if (context.has(tok)) score += 1;
  }
  return score;
}

/**
 * Return the most JD-relevant resources, best first.
 * Falls back to the full pool when the JD has no usable skill signal, so we
 * never silently drop everyone for a vague/garbled JD.
 */
export function shortlistResources(jd, resources, limit = 40) {
  const pool = Array.isArray(resources) ? resources : [];
  const jdSet = jdTokens(jd);
  if (jdSet.size === 0 || pool.length <= limit) {
    return { pool, filtered: false, scored: pool.length };
  }

  const scored = pool
    .map((r) => ({ r, s: scoreResource(r, jdSet) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  // Not enough signal to trust the filter — keep current behavior.
  if (scored.length < 5) {
    return { pool, filtered: false, scored: scored.length };
  }

  return {
    pool: scored.slice(0, limit).map((x) => x.r),
    filtered: true,
    scored: scored.length,
  };
}
