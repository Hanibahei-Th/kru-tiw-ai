export async function readFunctionError(error: unknown, fallback: string): Promise<string> {
  const context = (error as { context?: Response } | null)?.context;
  if (!context) return fallback;

  try {
    const raw = await context.text();
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as { error?: string };
    return parsed?.error || fallback;
  } catch {
    return fallback;
  }
}
