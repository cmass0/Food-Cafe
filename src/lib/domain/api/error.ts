export async function throwApiError(res: Response): Promise<never> {
  let message = res.statusText || `Request failed: ${res.status}`;

  try {
    const data = await res.json();
    message =
      data?.details?.message ||
      data?.details?.hint ||
      data?.details ||
      data?.message ||
      data?.error ||
      message;
  } catch {
    // Keep the default status message when the response is not JSON.
  }

  throw new Error(message);
}
