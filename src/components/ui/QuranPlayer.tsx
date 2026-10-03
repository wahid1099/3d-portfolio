import { useEffect, useRef, useState } from "react";
import { RECITERS, SURAHS, audioUrl, type Reciter, type Surah } from "../../data/quran";

function format(t: number) {
  if (!isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function QuranPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [surahId, setSurahId] = useState(55); // Ar-Rahman default
  const [reciterId, setReciterId] = useState("mishari");
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const reciter: Reciter = RECITERS.find((r) => r.id === reciterId) ?? RECITERS[0];
  const surah: Surah = SURAHS.find((s) => s.id === surahId) ?? SURAHS[0];
  const src_url = audioUrl(reciter, surah);

  // Build audio graph + analyser
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let ctx: AudioContext | null = null;
    const onPlay = () => {
      if (!ctx) {
        ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const src = ctx.createMediaElementSource(audio);
        const an = ctx.createAnalyser();
        an.fftSize = 128;
        src.connect(an);
        an.connect(ctx.destination);
        setAnalyser(an);
      }
      if (ctx.state === "suspended") void ctx.resume();
      setPlaying(true);
    };
    const onPause = () => setPlaying(false);
    const onLoaded = () => {
      setDuration(audio.duration || 0);
      setLoading(false);
      setError(null);
    };
    const onErr = () => {
      setError("Audio failed to load. Try another reciter.");
      setLoading(false);
      setPlaying(false);
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("error", onErr);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("error", onErr);
    };
  }, []);

  // Swap track when surah or reciter changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setLoading(true);
    setProgress(0);
    setDuration(0);
    setError(null);
    audio.src = src_url;
    audio.load();
  }, [src_url]);

  // Progress + waveform
  useEffect(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas) return;
    let raf = 0;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const fit = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    const tick = () => {
      const r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const p = audio.duration ? audio.currentTime / audio.duration : 0;
      setProgress(p);
      // Background bar
      ctx.fillStyle = "rgba(111,220,239,0.08)";
      ctx.fillRect(0, canvas.height / 2 - 1, canvas.width, 2);
      // Played
      ctx.fillStyle = "rgba(111,220,239,0.9)";
      ctx.fillRect(0, canvas.height / 2 - 1, canvas.width * p, 2);

      const bars = 64;
      const w = canvas.width / bars;
      const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
      if (analyser && data) analyser.getByteFrequencyData(data);
      for (let i = 0; i < bars; i++) {
        const v = data ? data[i] / 255 : 0;
        const h = 6 + v * (canvas.height * 0.42);
        const x = i * w + w * 0.15;
        const y = canvas.height / 2 - h / 2;
        ctx.fillStyle = i / bars < p ? `rgba(111,220,239,${0.4 + v * 0.6})` : `rgba(130,165,255,${0.18 + v * 0.4})`;
        ctx.fillRect(x, y, w * 0.7, h);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [analyser, surahId, reciterId]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Playback blocked");
      }
    } else {
      audio.pause();
    }
  };

  const seek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    audio.currentTime = Math.max(0, Math.min(1, x)) * duration;
  };

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mono flex items-center gap-2 text-[12px] uppercase tracking-[0.22em] text-[color:var(--cyan)]">
            <span className="size-1.5 rounded-full bg-[color:var(--cyan)] shadow-[0_0_6px_rgba(111,220,239,0.7)]" />
            Qur'an recitation
          </p>
          <p className="mt-2 flex items-baseline gap-3">
            <span className="text-[28px] font-semibold leading-none tracking-[-0.02em]">{surah.name}</span>
            <span className="text-[28px] font-arabic text-[color:var(--muted)]" dir="rtl" lang="ar">
              {surah.arabic}
            </span>
          </p>
          <p className="mono mt-2 text-[12px] uppercase tracking-[0.18em] text-[color:var(--faint)]">
            {surah.verses} verses · {surah.type === "makki" ? "Makki" : "Madani"} · {reciter.name}
          </p>
        </div>
        <button
          type="button"
          data-cursor="hover"
          onClick={toggle}
          aria-label={playing ? "Pause recitation" : "Play recitation"}
          className="grid size-14 shrink-0 place-items-center rounded-full bg-[color:var(--ink)] text-[#060a16] transition-transform hover:scale-105 active:scale-95"
        >
          {loading ? (
            <span className="inline-block size-3 animate-spin rounded-full border-2 border-[#060a16] border-t-transparent" />
          ) : playing ? (
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="size-5 translate-x-[1px]" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          )}
        </button>
      </div>

      <div className="relative mt-6">
        <canvas
          ref={canvasRef}
          onClick={seek}
          aria-label="Seek through the recitation"
          className="block h-16 w-full cursor-pointer"
        />
        <div className="mono mt-1 flex justify-between text-[11px] uppercase tracking-[0.18em] text-[color:var(--faint)]">
          <span>{format(progress * duration)}</span>
          <span>{format(duration)}</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mono mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-[color:var(--faint)]">Surah</span>
          <select
            data-cursor="hover"
            value={surahId}
            onChange={(e) => setSurahId(Number(e.target.value))}
            className="w-full appearance-none rounded-lg border border-[color:var(--line)] bg-[rgba(8,13,28,0.7)] px-3 py-2 text-[14px] text-[color:var(--ink)] outline-none focus:border-[rgba(111,220,239,0.55)]"
          >
            {SURAHS.map((s) => (
              <option key={s.id} value={s.id}>
                {String(s.id).padStart(3, "0")} · {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mono mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-[color:var(--faint)]">Reciter</span>
          <select
            data-cursor="hover"
            value={reciterId}
            onChange={(e) => setReciterId(e.target.value)}
            className="w-full appearance-none rounded-lg border border-[color:var(--line)] bg-[rgba(8,13,28,0.7)] px-3 py-2 text-[14px] text-[color:var(--ink)] outline-none focus:border-[rgba(111,220,239,0.55)]"
          >
            {RECITERS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p className="mono mt-3 text-[12px] text-[color:var(--threat)]">{error}</p>
      )}
      <p className="mono mt-4 text-[11px] leading-[1.6] text-[color:var(--faint)]">
        Audio streamed from quranicaudio.com · recitation credits to the named reciters.
        Use ⏎ on the play button for hands-free listening.
      </p>

      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
    </div>
  );
}