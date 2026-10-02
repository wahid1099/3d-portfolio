export type TechGroup = "frontend" | "backend" | "cloud" | "security";

export type Tech = {
  id: string;
  label: string;
  group: TechGroup;
  desc: string;
  links: string[];
};

export const groups: { id: TechGroup; label: string; color: string; center: [number, number, number] }[] = [
  { id: "frontend", label: "Frontend", color: "#7cc8ff", center: [-3.3, 1.55, 0.2] },
  { id: "backend", label: "Backend", color: "#6fe0ee", center: [2.7, 1.75, -0.8] },
  { id: "cloud", label: "Cloud & DevOps", color: "#8a9cff", center: [2.9, -1.7, 0.4] },
  { id: "security", label: "Security", color: "#a98bff", center: [-2.7, -1.75, -0.4] },
];

export const tech: Tech[] = [
  { id: "react", label: "React", group: "frontend", desc: "Component-driven interfaces with predictable state.", links: ["typescript", "tailwind", "graphql"] },
  { id: "typescript", label: "TypeScript", group: "frontend", desc: "Typed contracts shared by client and server.", links: ["javascript", "nodejs", "prisma"] },
  { id: "javascript", label: "JavaScript", group: "frontend", desc: "The runtime language of the whole web stack.", links: ["nodejs"] },
  { id: "tailwind", label: "Tailwind CSS", group: "frontend", desc: "Utility-first styling for consistent design systems.", links: ["react"] },

  { id: "nodejs", label: "Node.js", group: "backend", desc: "Event-driven services and API runtimes.", links: ["express", "graphql", "docker"] },
  { id: "express", label: "Express", group: "backend", desc: "Lean HTTP routing and middleware.", links: ["nodejs", "postgresql"] },
  { id: "graphql", label: "GraphQL", group: "backend", desc: "A typed query layer between UI and services.", links: ["react", "nodejs", "postgresql"] },
  { id: "postgresql", label: "PostgreSQL", group: "backend", desc: "The relational source of truth.", links: ["prisma", "aws"] },
  { id: "prisma", label: "Prisma", group: "backend", desc: "Type-safe data access and schema migrations.", links: ["postgresql", "typescript"] },

  { id: "aws", label: "AWS", group: "cloud", desc: "Compute, storage and managed Kubernetes at scale.", links: ["terraform", "kubernetes", "linux"] },
  { id: "docker", label: "Docker", group: "cloud", desc: "Reproducible containers from laptop to production.", links: ["kubernetes", "actions", "linux"] },
  { id: "kubernetes", label: "Kubernetes", group: "cloud", desc: "Orchestration, scaling and service networking.", links: ["helm", "aws"] },
  { id: "terraform", label: "Terraform", group: "cloud", desc: "Infrastructure declared, reviewed and versioned as code.", links: ["aws"] },
  { id: "helm", label: "Helm", group: "cloud", desc: "Packaged, versioned Kubernetes releases.", links: ["kubernetes"] },
  { id: "actions", label: "GitHub Actions", group: "cloud", desc: "CI/CD pipelines that test and ship every push.", links: ["docker"] },
  { id: "linux", label: "Linux", group: "cloud", desc: "Where everything ultimately runs.", links: ["docker", "aws"] },

  { id: "pqc", label: "Post-Quantum Cryptography", group: "security", desc: "Lattice- and hash-based algorithms designed to resist quantum attacks.", links: ["qsafe", "cryptorisk"] },
  { id: "qsafe", label: "Quantum-Safe Security", group: "security", desc: "Migrating systems toward NIST algorithms like ML-KEM and ML-DSA.", links: ["secarch", "pqc"] },
  { id: "cryptorisk", label: "Cryptographic Risk", group: "security", desc: "Inventorying where vulnerable cryptography lives.", links: ["secarch", "postgresql"] },
  { id: "secarch", label: "Security Architecture", group: "security", desc: "Systems designed to be secure by default.", links: ["kubernetes", "nodejs"] },
];

export const techById = Object.fromEntries(tech.map((t) => [t.id, t])) as Record<string, Tech>;

/** Undirected adjacency used for hover highlighting. */
export const adjacency: Record<string, Set<string>> = (() => {
  const adj: Record<string, Set<string>> = {};
  tech.forEach((t) => (adj[t.id] = adj[t.id] || new Set()));
  tech.forEach((t) =>
    t.links.forEach((l) => {
      adj[t.id].add(l);
      (adj[l] = adj[l] || new Set()).add(t.id);
    }),
  );
  return adj;
})();

export const edges: [string, string][] = (() => {
  const seen = new Set<string>();
  const out: [string, string][] = [];
  tech.forEach((t) =>
    t.links.forEach((l) => {
      const key = [t.id, l].sort().join("|");
      if (!seen.has(key)) {
        seen.add(key);
        out.push([t.id, l]);
      }
    }),
  );
  return out;
})();

/** Hand-placed layout (local units). Long labels get their own rows so nothing collides. */
export const nodePositions: Record<string, [number, number, number]> = {
  react: [-2.9, 2.3, 0.2],
  typescript: [-1.5, 2.0, -0.2],
  javascript: [-3.0, 1.2, -0.3],
  tailwind: [-1.7, 0.95, 0.3],

  nodejs: [1.4, 2.4, 0.2],
  express: [3.1, 2.5, -0.3],
  graphql: [2.4, 1.75, 0.35],
  postgresql: [1.3, 1.05, -0.2],
  prisma: [3.2, 1.1, 0.2],

  docker: [1.3, -0.7, 0.3],
  kubernetes: [3.0, -0.75, -0.2],
  aws: [2.2, -1.35, 0.2],
  actions: [1.05, -2.0, -0.3],
  terraform: [3.3, -1.95, 0.3],
  helm: [2.45, -2.6, -0.1],
  linux: [1.2, -2.95, 0.2],

  pqc: [-2.4, -0.75, 0.2],
  qsafe: [-2.0, -1.45, -0.25],
  cryptorisk: [-2.9, -2.15, 0.3],
  secarch: [-1.9, -2.85, -0.15],
};

export const groupTitles: Record<TechGroup, [number, number, number]> = {
  frontend: [-2.3, 3.05, 0],
  backend: [2.25, 3.15, 0],
  cloud: [2.25, -3.55, 0],
  security: [-2.3, -3.55, 0],
};
