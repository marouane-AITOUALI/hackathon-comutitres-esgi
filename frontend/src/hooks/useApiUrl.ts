export function useApiUrl() {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
}
