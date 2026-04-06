export const AUTH_TOKEN_KEY = "@alternativa-base:token"
export const AUTH_COOKIE_KEY = AUTH_TOKEN_KEY

export const AUTH_REDIRECT_REASON = {
  authRequired: "auth-required",
  sessionExpired: "session-expired",
} as const

export type AuthRedirectReason =
  (typeof AUTH_REDIRECT_REASON)[keyof typeof AUTH_REDIRECT_REASON]

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padding = normalized.length % 4
  const padded = padding === 0 ? normalized : normalized.padEnd(normalized.length + (4 - padding), "=")

  try {
    if (typeof atob === "function") {
      return atob(padded)
    }

    if (typeof Buffer !== "undefined") {
      return Buffer.from(padded, "base64").toString("utf-8")
    }
  } catch {
    return null
  }

  return null
}

export function decodeJwtPayload(token: string) {
  const parts = token.split(".")

  if (parts.length < 2) {
    return null
  }

  const decoded = decodeBase64Url(parts[1])

  if (!decoded) {
    return null
  }

  try {
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

export function getTokenExpirationTime(token: string) {
  const payload = decodeJwtPayload(token)
  const exp = payload?.exp

  if (typeof exp !== "number") {
    return null
  }

  return exp * 1000
}

export function isTokenExpired(token: string, clockSkewMs = 30_000) {
  const expirationTime = getTokenExpirationTime(token)

  if (!expirationTime) {
    return true
  }

  return Date.now() >= expirationTime - clockSkewMs
}

export function buildSafeNextPath(pathname: string, search = "") {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    return null
  }

  if (pathname === "/sign-in") {
    return null
  }

  return `${pathname}${search}`
}

export function buildSignInPath(
  nextPath?: string | null,
  reason?: AuthRedirectReason,
) {
  const searchParams = new URLSearchParams()

  if (nextPath) {
    searchParams.set("next", nextPath)
  }

  if (reason) {
    searchParams.set("reason", reason)
  }

  const query = searchParams.toString()

  return query ? `/sign-in?${query}` : "/sign-in"
}

export function getClientCurrentPath() {
  if (typeof window === "undefined") {
    return null
  }

  return buildSafeNextPath(window.location.pathname, window.location.search)
}
