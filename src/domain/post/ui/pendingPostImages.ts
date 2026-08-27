import type { SerializedEditorState } from "lexical";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function collectPendingImageSources(
  value: unknown,
  pendingFiles: ReadonlyMap<string, File>,
  result = new Set<string>()
): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectPendingImageSources(item, pendingFiles, result);
    return result;
  }
  if (!isRecord(value)) return result;

  if (value.type === "image" && typeof value.src === "string" && pendingFiles.has(value.src)) {
    result.add(value.src);
  }
  for (const item of Object.values(value)) {
    collectPendingImageSources(item, pendingFiles, result);
  }
  return result;
}

function replacePendingSources(value: unknown, replacements: ReadonlyMap<string, string>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => replacePendingSources(item, replacements));
  }
  if (!isRecord(value)) return value;

  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    next[key] = replacePendingSources(item, replacements);
  }
  if (value.type === "image" && typeof value.src === "string") {
    next.src = replacements.get(value.src) ?? value.src;
  }
  return next;
}

export function replacePendingImageSources(
  state: SerializedEditorState,
  replacements: ReadonlyMap<string, string>
): SerializedEditorState {
  return replacePendingSources(state, replacements) as SerializedEditorState;
}
