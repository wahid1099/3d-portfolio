import { useCallback } from "react";
import { registerSection } from "../lib/scroll";

/** Ref callback that registers a section with the scroll store. */
export function useSection(id: string) {
  return useCallback((el: HTMLElement | null) => registerSection(id, el), [id]);
}
