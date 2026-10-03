/**
 * Curated set of surahs + reciters. Full-surah audio is served by QuranicAudio.com
 * (downstream of Quran.com). Each URL is a single MP3.
 *
 *   <reciter-folder>/<surah-number-3-digit>.mp3
 */

export type Reciter = {
  id: string;
  name: string;
  folder: string; // path segment under quranicaudio.com/quranicaudio/<folder>
  bitrate: "128kbps" | "192kbps";
};

export const RECITERS: Reciter[] = [
  { id: "mishari", name: "Mishary Rashid Alafasy", folder: "mishari_al_afasy/murattal", bitrate: "128kbps" },
  { id: "husary", name: "Mahmoud Khalil Al-Husary", folder: "husary/murattal", bitrate: "128kbps" },
  { id: "sudais", name: "Abdur-Rahman as-Sudais", folder: "sudais/murattal", bitrate: "128kbps" },
  { id: "minshawi", name: "Mohamed Siddiq al-Minshawi", folder: "minshawi/murattal", bitrate: "128kbps" },
];

/**
 * Curated surahs. Names in English + Arabic (rounded for the UI).
 * IDs follow Mushaf order (1..114).
 */
export type Surah = {
  id: number;
  name: string;
  arabic: string;
  verses: number;
  type: "makki" | "madani";
};

export const SURAHS: Surah[] = [
  { id: 1, name: "Al-Fatihah", arabic: "الفاتحة", verses: 7, type: "makki" },
  { id: 18, name: "Al-Kahf", arabic: "الكهف", verses: 110, type: "makki" },
  { id: 36, name: "Ya-Sin", arabic: "يس", verses: 83, type: "makki" },
  { id: 55, name: "Ar-Rahman", arabic: "الرحمن", verses: 78, type: "madani" },
  { id: 56, name: "Al-Waqi'ah", arabic: "الواقعة", verses: 96, type: "makki" },
  { id: 67, name: "Al-Mulk", arabic: "الملك", verses: 30, type: "makki" },
  { id: 112, name: "Al-Ikhlas", arabic: "الإخلاص", verses: 4, type: "makki" },
  { id: 113, name: "Al-Falaq", arabic: "الفلق", verses: 5, type: "makki" },
  { id: 114, name: "An-Nas", arabic: "الناس", verses: 6, type: "makki" },
];

const pad3 = (n: number) => String(n).padStart(3, "0");

export function audioUrl(reciter: Reciter, surah: Surah): string {
  return `https://download.quranicaudio.com/qdc/${reciter.folder}/${pad3(surah.id)}.mp3`;
}