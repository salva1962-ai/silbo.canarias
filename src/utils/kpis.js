export function getWeeklyBounds(date = new Date()) {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7 // Lunes=0
  const start = new Date(d)
  start.setDate(d.getDate() - day)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  return { start, end }
}
export function inWeek(d, { start, end }) {
  const x = new Date(d)
  return x >= start && x < end
}
