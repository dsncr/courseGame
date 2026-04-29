type ApiResponse<T> = T & {
  error?: string;
};

export async function apiPost<T>(
  endpoint: string,
  action: string,
  input: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, input }),
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? "Ошибка API.");
  }

  return payload as T;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Неизвестная ошибка.";
}
