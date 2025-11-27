const base = process.env.NEXT_PUBLIC_API_BASE_URL

if (!base) {
  // 本番で気づけるように明示的に例外を投げる
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not set")
}

export const API_BASE_URL = base
