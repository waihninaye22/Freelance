export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "")

export type ApiErrorShape = { code: string; message: string; details?: unknown }

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message)
    this.name = "ApiError"
  }
}

export function getToken() {
  return typeof window === "undefined" ? null : window.localStorage.getItem("archer.accessToken")
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return
  if (token) window.localStorage.setItem("archer.accessToken", token)
  else window.localStorage.removeItem("archer.accessToken")
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(init.headers)
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", `Bearer ${token}`)
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  if (response.status === 204) return undefined as T
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && token) setToken(null)
    const error = payload?.error as ApiErrorShape | undefined
    throw new ApiError(response.status, error?.code ?? "REQUEST_FAILED", error?.message ?? "The request could not be completed.", error?.details)
  }
  return payload as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
}

export type Page<T> = { data: T[]; pagination: { page: number; limit: number; total: number; pages: number } }
export type Result<T> = { data: T }
export type Currency = "USD" | "MMK"
export type User = {
  id: string; name: string; email?: string; isAdmin?: boolean
  freelancerProfile?: { headline?: string | null; bio?: string | null; hourlyRateMinor?: number | null; rateCurrency?: Currency | null; skills?: { skill: { name: string } }[] }
  clientProfile?: { displayName: string; description?: string | null; location?: string | null }
}
export type Job = {
  id: string; title: string; description: string; budgetType: "fixed" | "hourly"; minAmountMinor?: number | null; maxAmountMinor?: number | null
  currency: Currency; experienceLevel?: string | null; status: string; createdAt: string; updatedAt?: string
  category?: { id: string; name: string }; skills?: { skill: { name: string } }[]
  client?: { id: string; name: string; clientProfile?: { displayName: string; location?: string | null } | null }
  _count?: { proposals: number }
}
export type Proposal = { id: string; jobId: string; coverMessage: string; amountMinor: number; currency: Currency; status: string; estimatedDurationDays?: number | null; job?: Job; freelancer?: User; createdAt: string }
export type Project = { id: string; jobId: string; job?: Job; clientId: string; freelancerId: string; client?: User; freelancer?: User; amountMinor: number; currency: Currency; status: string; scopeSummary: string; createdAt: string; updatedAt: string; _count?: { messages: number } }
export type Message = { id: string; body: string; createdAt: string; sender: User }
export type Notification = { id: string; type: string; message: string; href?: string | null; readAt?: string | null; createdAt: string }

export function formatMoney(amountMinor: number, currency: Currency) {
  const value = currency === "USD" ? amountMinor / 100 : amountMinor
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: currency === "USD" ? 2 : 0 }).format(value)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again."
}
