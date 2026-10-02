import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { registerSection } from "../../lib/scroll";
import { Eyebrow, Reveal } from "../ui/Reveal";

const stages = [
  {
    at: 0,
    code: "CLASSICAL",
    tone: "steel",
    line: "Public-key cryptography secures today's internet: TLS, VPNs, code signing, identity.",
  },
  {
    at: 0.16,
    code: "QUANTUM THREAT",
    tone: "threat",
    line: "A large enough quantum computer running Shor's algorithm could break RSA and elliptic-curve cryptography. Data harvested now can be decrypted later.",
  },
  {
    at: 0.36,
    code: "DETECT",
    tone: "threat",
    line: "Build a cryptographic inventory: find every certificate, key, library and protocol that relies on vulnerable algorithms.",
  },
  {
    at: 0.56,
    code: "MIGRATE",
    tone: "safe",
    line: "Move to NIST's post-quantum standards: ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205).",
  },
  {
    at: 0.8,
    code: "QUANTUM-SAFE",
    tone: "safe",
    line: "Crypto-agile systems that resist both classical and quantum attacks, and can keep adapting.",
  },
];

const rows = [
  { use: "Key exchange", from: "ECDH P-256", to: "ML-KEM-768" },
  { use: "Signatures", from: "RSA-2048 · ECDSA", to: "ML-DSA-65" },
  { use: "Symmetric", from: "AES-256", to: "AES-256", note: "already strong" },
];

const statusFor = (s: number) =>
  [
    { t: "secure (classical)", c: "#a9c4ff" },
    { t: "at risk", c: "var(--threat)" },
    { t: "flagged", c: "var(--threat)" },
    { t: "migrating", c: "var(--cyan)" },
    { t: "quantum-safe", c: "var(--safe)" },
  ][s];

export function Security() {
  const el = useRef<HTMLElement | null>(null);
  const [stage, setStage] = useState(0);
  const { scrollYProgress } = useScroll({ target: el, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    let s = 0;
    stages.forEach((st, i) => p >= st.at && (s = i));
    setStage((cur) => (cur === s ? cur : s));
  });
  const st = stages[stage];
  const toneColor = st.tone === "threat" ? "var(--threat)" : st.tone === "safe" ? "var(--safe)" : "#a9c4ff";
  const status = statusFor(stage);

  return (
    <section
      id="security"
      ref={(n) => {
        el.current = n;
        registerSection("security", n);
      }}
      className="relative h-[460vh]"
    >
      <div className="sticky top-0 flex h-screen items-end pb-10 md:items-center md:pb-0">
        <div className="shell">
          <div className="max-w-[540px]">
            <Reveal>
              <Eyebrow layer={stage >= 4 ? 6 : 5}>{stage >= 4 ? "Quantum-Safe" : "Security"}</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-5 text-[clamp(32px,4.2vw,60px)] font-semibold leading-[1.0] tracking-[-0.045em]">
                Security for a World
                <br />
                After Quantum.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 hidden max-w-[480px] text-[16px] leading-[1.65] text-[color:var(--muted)] sm:block">
                Quantum computing introduces new risks to widely used public-key cryptography. My work focuses on
                technologies that help organizations understand cryptographic risk and prepare for the post-quantum era.
              </p>
            </Reveal>

            <div className="glass mt-8 overflow-hidden rounded-2xl" aria-live="polite">
              <div className="mono flex items-center justify-between border-b border-[color:var(--line)] px-5 py-3 text-[13px] uppercase tracking-[0.18em]">
                <span className="flex items-center gap-2" style={{ color: toneColor }}>
                  <span className="size-1.5 rounded-full" style={{ background: toneColor, boxShadow: `0 0 10px ${toneColor}` }} />
                  {st.code}
                </span>
                <span className="text-[color:var(--faint)]">
                  {stage + 1}/{stages.length}
                </span>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={st.code}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="min-h-[84px] px-5 pt-4 text-[16px] leading-[1.6] text-[color:var(--ink)]"
                >
                  {st.line}
                </motion.p>
              </AnimatePresence>
              <table className="mono mt-2 w-full text-left text-[13px]">
                <caption className="sr-only">Algorithm migration status</caption>
                <thead className="sr-only">
                  <tr>
                    <th>Use</th>
                    <th>Algorithm</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const migrated = stage >= 3;
                    const symmetric = r.from === r.to;
                    const rowStatus = symmetric ? (stage >= 1 ? { t: r.note!, c: "#a9c4ff" } : status) : status;
                    return (
                      <tr key={r.use} className="border-t border-[color:var(--line)]">
                        <td className="hidden px-5 py-3 text-[color:var(--faint)] sm:table-cell">{r.use}</td>
                        <td className="py-3 pl-5 text-[color:var(--ink)] sm:pl-0">
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={migrated ? "to" : "from"}
                              initial={{ opacity: 0, filter: "blur(4px)" }}
                              animate={{ opacity: 1, filter: "blur(0px)" }}
                              exit={{ opacity: 0, filter: "blur(4px)" }}
                              transition={{ duration: 0.35 }}
                              className="inline-block"
                            >
                              {migrated ? r.to : r.from}
                            </motion.span>
                          </AnimatePresence>
                        </td>
                        <td className="px-5 py-3 text-right uppercase tracking-[0.1em]" style={{ color: rowStatus.c }}>
                          {rowStatus.t}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
