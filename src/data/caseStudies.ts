import type { CaseStudy } from "../components/ui/CaseStudyModal";

export const caseStudies: CaseStudy[] = [
  {
    id: "isara",
    n: "01",
    category: "Quantum-Safe Security Platform",
    title: "ISARA Advance",
    tagline:
      "Cryptographic risk platform that inventories where vulnerable algorithms live and helps teams plan a migration to NIST post-quantum standards.",
    problem:
      "Enterprises don't know which systems still rely on RSA/ECC, where keys are pinned, or what breaks first under a quantum threat. Inventory is scattered across spreadsheets.",
    approach: [
      "Discovery scan that fingerprints crypto primitives across services, cert stores and code repos.",
      "Risk score per asset combining key age, exposure and algorithm strength.",
      "Migration planner that maps assets onto NIST PQC algorithms (ML-KEM, ML-DSA) with safe rollouts.",
    ],
    outcome:
      "Clear inventory, prioritised remediation list and a phased migration path. Designed so security teams can prove progress to auditors.",
    stack: ["Node.js", "TypeScript", "PostgreSQL", "AWS", "Kubernetes", "OpenSearch"],
    links: [
      { label: "Architecture", href: "#projects" },
      { label: "ISARA", href: "https://www.isara.com" },
    ],
  },
  {
    id: "edusphere",
    n: "02",
    category: "Education Management SaaS",
    title: "EduSphere",
    tagline:
      "Multi-tenant school and madrasa management platform for organisations in Bangladesh and the Middle East.",
    problem:
      "Schools juggle attendance, fees and reporting across paper, WhatsApp and disconnected tools. There's no shared view across tenants.",
    approach: [
      "Tenant-aware API built on Node.js + Express + Prisma.",
      "Role-based access for admins, teachers, parents and students.",
      "Redis-backed caching for reports and dashboards.",
    ],
    outcome:
      "Single source of truth per tenant. Reports that used to take days are generated on demand.",
    stack: ["React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Prisma", "Redis", "Docker"],
  },
];

export const caseStudyById = Object.fromEntries(caseStudies.map((c) => [c.id, c]));