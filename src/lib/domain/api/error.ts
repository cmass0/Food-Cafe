export async function throwApiError(res: Response): Promise<never> {
  try {
    const data = await res.json();
    const message =
      data?.details?.message ||
      data?.details?.hint ||
      data?.details ||
      data?.message ||
      data?.error ||
      res.statusText ||
      `Request failed: ${res.status}`;
    throw new Error(message);
  } catch {
    throw new Error(res.statusText || `Request failed: ${res.status}`);
  }
}
