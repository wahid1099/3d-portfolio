/*
 * SUBJECT: Md. Wahid, Junior Software Engineer (Backend · Cloud · Quantum-Safe Security, ISARA).
 * AUDIENCE: recruiters and engineering managers. JOB: prove depth from UI down to crypto in one scroll.
 *
 * DESIGN PLAN
 * - Spine: a descent through the stack. Person → Engineer → Full-Stack → Backend → Cloud/DevOps →
 *   Security → Quantum-Safe. A right-edge depth gauge shows the current layer (a real sequence, so numbered L00–L06).
 * - Real artifact borrowed: NIST FIPS 203 / lattice cryptography. The hero core is literally a lattice
 *   (Fibonacci-sphere nodes, nearest-neighbour edges) because post-quantum crypto is lattice-based.
 * - Type: Geist (600, tight tracking, statement scale) + Geist Mono for every machine-readable label.
 * - Colour: abyss navy #04060d · lattice cyan #6fdcef (lead) · signal blue #4f7dff · qubit violet #9a7bff ·
 *   threat amber #ff7a59 (only in the security sequence) · safe green #5ff0c8 (only for "live/verified").
 * - Layout: one fixed WebGL canvas; DOM sections scroll over it. Sticky sections (stack, devops, security)
 *   pin while the scene performs. Text column left, scene right.
 * - Signature: the voxel padlock that is swarmed by quantum particles, shatters, and re-forms as a hex shield
 *   while the algorithm table flips RSA/ECDH → ML-KEM/ML-DSA.
 * - Risk taken: the 3D constellation's labels are real DOM buttons projected onto WebGL nodes, so the
 *   most visual section is also fully keyboard accessible.
 */
import Portfolio from "./Portfolio";

export default function App() {
  return <Portfolio />;
}
