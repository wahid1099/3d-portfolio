import { useEffect, useState } from "react";

const SEQ = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

export function useKonami() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let buffer: string[] = [];
    const onKey = (e: KeyboardEvent) => {
      buffer.push(e.key);
      if (buffer.length > SEQ.length) buffer.shift();
      if (buffer.length === SEQ.length && buffer.every((k, i) => k.toLowerCase() === SEQ[i].toLowerCase())) {
        setOpen(true);
        buffer = [];
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}