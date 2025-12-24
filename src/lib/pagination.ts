export function resolveLimit(
  limit?: number,
  defaultLimit = 20,
  maxLimit = 50
): number {
  if (typeof limit !== "number" || Number.isNaN(limit)) return defaultLimit;
  const truncated = Math.trunc(limit);
  if (truncated < 1) return 1;
  if (truncated > maxLimit) return maxLimit;
  return truncated;
}

export function resolveOffset(page: number | undefined, limit: number): number {
  if (typeof page === "number" && Number.isFinite(page)) {
    const safePage = Math.max(1, Math.trunc(page));
    return (safePage - 1) * limit;
  }
  return 0;
}
