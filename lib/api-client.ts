import { API_BASE_URL } from "./config"

export const DEFAULT_API_ERROR_MESSAGE = "通信に失敗しました。時間をおいて再度お試しください。"
export const LLM_FALLBACK_MESSAGE = "Yorizo が考えるのに失敗しました……管理者にお問い合わせください。"

export class ApiError extends Error {
  status?: number
  data?: unknown

  constructor(message: string, status?: number, data?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false
      error: ApiError
    }

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | null
  json?: unknown
  fallbackMessage?: string
  parseJson?: boolean
}

function resolveApiUrl(path: string) {
  if (path.startsWith("http")) return path
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE_URL}${normalized}`
}

async function parseJsonSafe(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { json, fallbackMessage, parseJson = true, body: rawBody, ...init } = options
  const headers = new Headers(init.headers)
  let body = rawBody as BodyInit | undefined

  if (json !== undefined) {
    body = JSON.stringify(json)
    headers.set("Content-Type", "application/json")
  }

  try {
    const response = await fetch(resolveApiUrl(path), {
      ...init,
      headers,
      body,
      cache: init.cache ?? "no-store",
    })

    const data = parseJson ? await parseJsonSafe(response) : null
    if (!response.ok) {
      const message =
        typeof (data as any)?.detail === "string" ? (data as any).detail : fallbackMessage ?? DEFAULT_API_ERROR_MESSAGE
      throw new ApiError(message, response.status, data)
    }
    return (parseJson ? (data as T) : (undefined as T))
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(fallbackMessage ?? DEFAULT_API_ERROR_MESSAGE)
  }
}

export async function apiFetchResult<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiResult<T>> {
  try {
    const data = await apiFetch<T>(path, options)
    return { ok: true, data }
  } catch (error) {
    const apiError =
      error instanceof ApiError ? error : new ApiError(options.fallbackMessage ?? DEFAULT_API_ERROR_MESSAGE)
    return { ok: false, error: apiError }
  }
}
