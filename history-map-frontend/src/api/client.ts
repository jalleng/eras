/**
 * Thin HTTP client for the Phase 2 FastAPI backend. `VITE_API_BASE_URL` is
 * set in `.env.local` for local development (see `.env.example`) and should
 * point at the deployed API's origin in production.
 */

const API_BASE_URL: string | undefined = import.meta.env.VITE_API_BASE_URL

export async function apiGet<T>(path: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(
      `apiGet(${path}) called with no VITE_API_BASE_URL configured. ` +
        'Set VITE_API_BASE_URL in .env.local to point at the backend.',
    )
  }
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`)
  }
  return response.json() as Promise<T>
}
