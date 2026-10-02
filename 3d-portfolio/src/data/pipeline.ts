export type Stage = { id: string; label: string; role: string; desc: string; shape: string };

export const pipeline: Stage[] = [
  { id: "dev", label: "Developer", role: "Source", desc: "Write the change, open a pull request.", shape: "octa" },
  { id: "git", label: "Git", role: "Version control", desc: "Every change reviewed, versioned and traceable.", shape: "ring" },
  { id: "actions", label: "GitHub Actions", role: "Continuous integration", desc: "Lint, test and build automatically on every push.", shape: "cube" },
  { id: "docker", label: "Docker", role: "Packaging", desc: "Package applications into reproducible containers.", shape: "stack" },
  { id: "registry", label: "Container Registry", role: "Artifact storage", desc: "Store versioned, immutable images ready to deploy.", shape: "cyl" },
  { id: "k8s", label: "Kubernetes", role: "Orchestration", desc: "Orchestrate containers, scaling, networking and deployment.", shape: "hept" },
  { id: "eks", label: "AWS EKS", role: "Cloud platform", desc: "Deploy and operate scalable cloud infrastructure.", shape: "dodeca" },
  { id: "prod", label: "Production", role: "Live", desc: "Observable, healthy services serving real users.", shape: "sphere" },
];

/** World-space layout: the pipeline recedes into depth so scrolling flies through it. */
export const pipelinePositions: [number, number, number][] = pipeline.map((_, i) => [
  Math.sin(i * 1.15) * 1.7,
  Math.cos(i * 0.9) * 0.7 - 0.2,
  -i * 4.6,
]);
