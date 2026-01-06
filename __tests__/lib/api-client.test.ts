import { ApiError, apiFetch, apiFetchResult, createApiClient } from "@/lib/api-client"

function mockFetchOnce(data: any, ok = true, status = 200) {
  ; (global as any).fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: jest.fn().mockResolvedValue(data),
  })
}

describe("apiFetch", () => {
  beforeEach(() => {
    ; (global as any).fetch = jest.fn()
  })

  it("calls configured baseUrl for relative paths and returns parsed JSON", async () => {
    mockFetchOnce({ foo: "bar" })

    const client = createApiClient({ baseUrl: "https://example.com" })
    const data = await client.apiFetch<{ foo: string }>("/test-endpoint")

    expect(data).toEqual({ foo: "bar" })
    expect(global.fetch).toHaveBeenCalledTimes(1)
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe("https://example.com/test-endpoint")
    expect(init).toEqual(
      expect.objectContaining({
        cache: "no-store",
      }),
    )
  })

  it("skips JSON parsing when parseJson is false", async () => {
    ; (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: jest.fn(),
    })

    const result = await apiFetch<void>("/no-content", { method: "DELETE", parseJson: false })

    expect(result).toBeUndefined()
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it("throws ApiError with detail message from error response", async () => {
    mockFetchOnce({ detail: "bad request" }, false, 400)

    await expect(apiFetch("/error")).rejects.toEqual(
      expect.objectContaining({
        message: "bad request",
        status: 400,
      }),
    )
  })

  it("uses fallbackMessage when error response has no detail", async () => {
    mockFetchOnce({ error: "something" }, false, 500)

    await expect(apiFetch("/error", { fallbackMessage: "fallback message" })).rejects.toEqual(
      expect.objectContaining({
        message: "fallback message",
        status: 500,
      }),
    )
  })

  it("wraps network errors into ApiError with fallback message", async () => {
    ; (global as any).fetch = jest.fn().mockRejectedValue(new Error("network down"))

    await expect(apiFetch("/error", { fallbackMessage: "temporary error" })).rejects.toEqual(
      expect.objectContaining({
        message: "temporary error",
      }),
    )
  })
})

describe("apiFetchResult", () => {
  beforeEach(() => {
    ; (global as any).fetch = jest.fn()
  })

  it("returns ok result on success", async () => {
    mockFetchOnce({ value: 1 })

    const result = await apiFetchResult<{ value: number }>("/ok")

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toEqual({ value: 1 })
    }
  })

  it("returns error result when apiFetch fails", async () => {
    mockFetchOnce({}, false, 500)

    const result = await apiFetchResult("/error", { fallbackMessage: "fallback" })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ApiError)
      expect(result.error.message).toBe("fallback")
    }
  })
})

