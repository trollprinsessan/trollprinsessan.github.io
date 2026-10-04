import { LAYOUTS, SWITCHES } from "./versions";

/* What a component uses to read the page's settings (versions.ts). */
export * from "./versions";

/* a switch: true when on */
export function useToggle(id: string) {
  return SWITCHES[id] === true;
}

/* the layout a part is built in */
export function useVersion(id: string) {
  return LAYOUTS[id] ?? "v1";
}
