// netlify/functions/ask.mjs
// Portfolio Q&A: takes { question } from the in-page terminal and answers using
// the portfolio knowledge base + an LLM. Falls back gracefully to a hand-written
// matcher when OPENAI_API_KEY isn't configured, so the demo never errors out.

import { json, error, preflight, readBody } from "./_shared.mjs";

const PORTFOLIO_KB = `
You are the digital twin of Md. Wahid, a Junior Software Engineer who specializes in
backend, cloud, DevOps, and post-quantum / quantum-safe security. Answer questions on
his behalf using only the facts below. Be concise (max 5 sentences), confident, and
speak in first person as Wahid.

IDENTITY
- Full name: Md. Wahid
- Role: Backend & Cloud Engineer · Quantum-Safe Security
- Location: Dhaka, Bangladesh
- Education: B.Sc. Computer Science & Engineering, Daffodil International University
  (CGPA 3.75, 2025)
- GitHub: github.com/wahid1099
- LinkedIn: linkedin.com/in/md-wahid1
- LeetCode: leetcode.com/wahidahmed890
- Email: wahidahmed890@gmail.com
- Resume: https://drive.google.com/file/d/1ARVe8QWQkd9elngtTioIg4svz11aStC1/view

EXPERIENCE
- Builds systems for ISARA Advance (cryptographic risk + PQC migration).
- Built EduSphere, a multi-tenant education management SaaS.
- Builds ReliefLink (offline-first emergency messaging over Bluetooth mesh),
  Seller Commerce OS, AI Content CMS, and a Portfolio API.

STACK
- Languages: TypeScript, JavaScript, Node.js, Python, PHP, Go.
- Backend: Express, GraphQL, REST, Prisma.
- Data: PostgreSQL, MySQL, MongoDB, OpenSearch, Redis.
- Cloud & DevOps: AWS (ECS, RDS, Lambda), Docker, Kubernetes, Helm, Terraform,
  GitHub Actions, Linux.
- Security: Post-Quantum Cryptography (ML-KEM-768, ML-DSA-65), cryptographic risk
  inventories, NIST PQC migration.

INTERESTS / NOW
- Building a quantum-safe key rotation service using ML-KEM-768.
- Learning Rust and Cloudflare Workers.
- Reading "Cryptography Engineering" by Ferguson, Schneier & Kohno.

PRINCIPLES
- Build systems that solve real problems.
- Treat security as part of engineering, not an afterthought.
- Reduce repetitive work via infrastructure and CI/CD.
- Continuously explore new technologies and deeper systems knowledge.

RULES
- Never invent tools, employers, or metrics not in this brief.
- If asked something not covered, say "I haven't shared that publicly yet — happy
  to talk on a call" and direct them to the contact section.
- Keep replies under 90 words unless the visitor clearly asked for depth.
`;

const FALLBACKS = [
  { match: /(resume|cv)/, reply: "You can grab my résumé from the link in the hero or the contact section. Want me to open it?" },
  { match: /(linkedin)/, reply: "linkedin.com/in/md-wahid1 — the link is in the nav and the contact section." },
  { match: /(github|repo|code)/, reply: "github.com/wahid1099 — the projects section pulls live data from there." },
  { match: /(email|contact|hire|reach)/, reply: "wahidahmed890@gmail.com — the contact terminal will open your mail client." },
  { match: /(leetcode|dsa|algorith)/, reply: "leetcode.com/wahidahmed890 — I've solved 300+ problems and keep a 300-day streak." },
  { match: /(quantum|post-quantum|pqc|ml-kem|ml-dsa)/, reply: "My focus: post-quantum cryptography. ML-KEM-768 for key exchange, ML-DSA-65 for signatures. See the Security section and the handshake demo." },
  { match: /(stack|skills|tech)/, reply: "TypeScript · Node.js · PostgreSQL · AWS · Docker · Kubernetes · ML-KEM-768. See the Full-Stack constellation." },
  { match: /(experience|work|job|company|isara|edusphere)/, reply: "ISARA Advance (cryptographic risk + PQC migration), EduSphere (multi-tenant school SaaS), plus ReliefLink and Seller Commerce OS as side builds." },
];

function fallbackAnswer(q) {
  for (const { match, reply } of FALLBACKS) {
    if (match.test(q)) return reply;
  }
  return "I haven't shared that publicly yet — happy to talk on a call. wahidahmed890@gmail.com.";
}

export default async (request) => {
  if (request.method === "OPTIONS") return preflight();
  if (request.method !== "POST") return error("POST only");

  const { question } = await readBody(request);
  if (!question || typeof question !== "string" || question.length > 400) {
    return error("Provide a question string under 400 chars.");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json({ ok: true, answer: fallbackAnswer(question), source: "fallback" });
  }

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 220,
        messages: [
          { role: "system", content: PORTFOLIO_KB },
          { role: "user", content: question },
        ],
      }),
    });
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    const data = await r.json();
    const answer = data?.choices?.[0]?.message?.content?.trim() ?? fallbackAnswer(question);
    return json({ ok: true, answer, source: "live" });
  } catch (err) {
    return json({ ok: true, answer: fallbackAnswer(question), source: "fallback", note: String(err) });
  }
};