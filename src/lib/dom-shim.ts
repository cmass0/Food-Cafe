import { JSDOM } from "jsdom";

let isInstalled = false;

export function ensureDom(): void {
  if (isInstalled) return;
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    isInstalled = true;
    return;
  }

  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const win = dom.window as unknown as typeof globalThis;

  (globalThis as { window?: unknown }).window = win;
  (globalThis as { document?: unknown }).document = dom.window.document;
  (globalThis as { navigator?: unknown }).navigator = dom.window.navigator;
  (globalThis as { Node?: unknown }).Node = dom.window.Node;
  (globalThis as { HTMLElement?: unknown }).HTMLElement = dom.window.HTMLElement;
  (globalThis as { DOMParser?: unknown }).DOMParser = dom.window.DOMParser;

  isInstalled = true;
}
