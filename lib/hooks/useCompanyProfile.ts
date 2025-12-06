import { useCallback, useEffect, useState } from "react"

import { ApiError, DEFAULT_API_ERROR_MESSAGE, getCompanyProfile, type CompanyProfile } from "@/lib/api"

type State = {
  data: CompanyProfile | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useCompanyProfile(userId: string): State {
  const [data, setData] = useState<CompanyProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const profile = await getCompanyProfile(userId)
      setData(profile)
    } catch (err) {
      console.error(err)
      const message = err instanceof ApiError ? err.message : DEFAULT_API_ERROR_MESSAGE
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  return { data, isLoading, error, refetch: fetchProfile }
}
