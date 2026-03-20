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

  // globalThis에 프로퍼티 정의 헬퍼
 
  const define = (key: string, value: unknown) => {
    // 이미 정의된 경우 덮어쓰지 않음
    const existing = Object.getOwnPropertyDescriptor(globalThis, key);
    if (existing && !existing.configurable) return;
    try {

      Object.defineProperty(globalThis, key, {
        value,
        configurable: true,
        writable: true,
      });
    } catch {
      try {
        (globalThis as Record<string, unknown>)[key] = value;
      } catch {}
    }
  };

  define("window", win);
  define("document", dom.window.document);
  define("navigator", dom.window.navigator);
  define("Node", dom.window.Node);
  define("Element", dom.window.Element);
  define("HTMLElement", dom.window.HTMLElement);
  define("DOMParser", dom.window.DOMParser);

  isInstalled = true;
}
