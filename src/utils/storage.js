export const LS_KEYS = {
  distributors: 'silbo_distributors',
  visits: 'silbo_visits',
  sales: 'silbo_sales',
  candidates: 'silbo_candidates'
}

export function loadLS(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}
export function saveLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}
