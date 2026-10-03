import { useEffect, useRef, useState } from "react";

/**
 * Floating mic toggle that listens to ambient audio and writes a normalized
 * 0..1 level into a shared ref. The ParticleField reads `audioLevelRef` and
 * uses it as an additional size multiplier.
 */
export const audioLevelRef = { current: 0 };

export function AudioOrb() {
  const [on, setOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const stop = () => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
    audioLevelRef.current = 0;
    setOn(false);
  };

  const start = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        // smooth + scale
        audioLevelRef.current = audioLevelRef.current * 0.7 + Math.min(rms * 4, 1) * 0.3;
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      ctxRef.current = ctx;
      streamRef.current = stream;
      setOn(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "mic unavailable");
      stop();
    }
  };

  useEffect(() => stop, []);

  return (
    <button
      type="button"
      onClick={() => (on ? stop() : start())}
      aria-pressed={on}
      aria-label={on ? "Stop audio-reactive mode" : "Start audio-reactive mode"}
      title={error ?? (on ? "Mic live — particles react to sound" : "Mic off — enable audio-reactive particles")}
      className="mono fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[rgba(8,13,28,0.7)] px-4 py-2 text-[12px] uppercase tracking-[0.18em] text-[color:var(--muted)] backdrop-blur-md transition-colors hover:text-[color:var(--ink)]"
    >
      <span
        className="size-2 rounded-full transition-colors"
        style={{
          background: on ? "var(--safe)" : "var(--muted)",
          boxShadow: on ? "0 0 8px var(--safe)" : "none",
          animation: on ? "pulse 1.2s ease-in-out infinite" : "none",
        }}
      />
      {on ? "mic live" : "mic"}
      {error && <span className="ml-2 text-[color:var(--threat)]">{error}</span>}
    </button>
  );
}