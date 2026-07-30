/**
 * Placeholder HTTP client. Phase 1 has no backend, so nothing here is called
 * yet — it exists so `events.ts` / `polities.ts` can be written as if they
 * were already talking to a real API, making the Phase 2 swap a matter of
 * implementing this client rather than rewriting call sites.
 */

const API_BASE_URL: string | undefined = import.meta.env.VITE_API_BASE_URL

export async function apiGet<T>(path: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(
      `apiGet(${path}) called with no VITE_API_BASE_URL configured. ` +
        'Phase 1 should be reading from data/curatedDates.ts instead of calling apiGet.',
    )
  }
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`)
  }
  return response.json() as Promise<T>
}
