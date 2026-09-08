export function draftSaveError(error, fallback) {
  const data = error.response?.data
  const details = Array.isArray(data?.errors) ? data.errors.map(item => typeof item === 'string' ? item : item.msg || item.message || '').filter(Boolean) : []
  return [data?.message || fallback, ...details].join(': ')
}
