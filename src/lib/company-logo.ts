const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001/api/"

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "")

export function resolveCompanyLogoUrl(value?: string | null) {
  if (!value) {
    return null
  }

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  if (value.startsWith("/")) {
    return `${API_ORIGIN}${value}`
  }

  return `${API_ORIGIN}/${value}`
}
