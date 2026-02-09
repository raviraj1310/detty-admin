export const formatDate = (dateValue) => {
  if (!dateValue) return '-'
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return String(dateValue || '')
  }
}
