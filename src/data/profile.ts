export const profile = {
  name: "Md. Wahid",
  role: "Junior Software Engineer",
  title: "Backend & Cloud Engineer · Quantum-Safe Security",
  email: "wahidahmed890@gmail.com",
  github: "https://github.com/wahid1099",
  githubLabel: "github.com/wahid1099",
  linkedin: "https://www.linkedin.com/in/md-wahid1/",
  linkedinLabel: "linkedin.com/in/md-wahid1",
  portfolio: "https://eng-wahid-portfoliio.netlify.app/",
  leetcode: "https://leetcode.com/u/wahidahmed890/",
  leetcodeUser: "wahidahmed890",
  resume: "https://drive.google.com/file/d/1ARVe8QWQkd9elngtTioIg4svz11aStC1/view?usp=sharing",
  resumeFileName: "Md-Wahid-Resume.pdf",
};

/** The story the scroll travels through. A real sequence, so it is numbered. */
export const storyLayers = [
  "Person",
  "Engineer",
  "Full-Stack",
  "Backend",
  "Cloud / DevOps",
  "Security",
  "Quantum-Safe",
] as const;

export const sectionLayer: Record<string, number> = {
  hero: 0,
  about: 1,
  stack: 2,
  experience: 3,
  projects: 3,
  contributions: 3,
  devops: 4,
  security: 5,
  philosophy: 6,
  leetcode: 6,
  now: 6,
  testimonials: 6,
  contact: 6,
};

export const profileFields = [
  { k: "IDENTITY", v: ["Md. Wahid"] },
  { k: "ROLE", v: ["Junior Software Engineer"] },
  { k: "SPECIALIZATION", v: ["Backend • Cloud • DevOps • Security"] },
  { k: "FOCUS", v: ["Quantum-Safe Technology"] },
  {
    k: "EDUCATION",
    v: ["B.Sc. Computer Science & Engineering", "Daffodil International University", "CGPA 3.75 · 2025"],
  },
];

export const experienceTags = [
  "React",
  "Node.js",
  "Express",
  "GraphQL",
  "PostgreSQL",
  "AWS",
  "Docker",
  "OpenSearch",
  "CI/CD",
  "Jest",
];

export const experienceModules = [
  { label: "Backend systems", detail: "Node.js · Express · GraphQL" },
  { label: "Cloud infrastructure", detail: "AWS · Docker · Kubernetes" },
  { label: "CI/CD", detail: "GitHub Actions · Jest" },
  { label: "Data processing", detail: "PostgreSQL · OpenSearch" },
  { label: "Web applications", detail: "React · TypeScript" },
];

export const principles = [
  { k: "BUILD", v: "Design systems that solve real problems.", glyph: "build" },
  { k: "SECURE", v: "Treat security as part of engineering, not an afterthought.", glyph: "secure" },
  { k: "AUTOMATE", v: "Reduce repetitive work through infrastructure and CI/CD.", glyph: "automate" },
  { k: "LEARN", v: "Continuously explore new technologies and deeper systems knowledge.", glyph: "learn" },
] as const;
