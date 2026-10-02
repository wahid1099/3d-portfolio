export const isaraLayers = [
  { label: "React", note: "Interface" },
  { label: "GraphQL / API", note: "Query layer" },
  { label: "Node.js", note: "Services" },
  { label: "PostgreSQL", note: "Relational data" },
  { label: "OpenSearch", note: "Search & analytics" },
  { label: "AWS / Docker / Kubernetes", note: "Infrastructure" },
];

export const eduTech = ["React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Prisma", "Redis", "Docker"];

/**
 * Engineering projects. Static on purpose: this build cannot call the GitHub API,
 * so the list is curated here. Swap in a fetch to api.github.com/users/wahid1099/repos
 * when hosting this on your own domain.
 */
export const repos = [
  {
    name: "ReliefLink",
    kind: "Mobile · Offline-first",
    desc: "Emergency messaging that keeps working without internet, relayed over a Bluetooth mesh.",
    tech: ["Flutter", "flutter_blue_plus", "GATT"],
  },
  {
    name: "Seller Commerce OS",
    kind: "SaaS · In progress",
    desc: "Order, customer and sales tracking for Facebook and Instagram sellers via Messenger and WhatsApp.",
    tech: ["Node.js", "PostgreSQL", "Meta APIs"],
  },
  {
    name: "AI Content CMS",
    kind: "Web · AI",
    desc: "A CMS that generates, rewrites, summarizes and SEO-optimizes content.",
    tech: ["React", "Node.js", "LLM APIs"],
  },
  {
    name: "Portfolio API",
    kind: "Backend",
    desc: "REST API serving projects with media, tech tags, links and timestamps.",
    tech: ["Express", "PostgreSQL", "REST"],
  },
];
