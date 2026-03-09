import { useQuery } from "@tanstack/react-query"
import { authApi, type MeResponse } from "@/lib/api/auth-me"

export function useMe() {
  return useQuery<MeResponse>({
    queryKey: ["me"],
    queryFn: () => authApi.me(),
    staleTime: 5 * 60_000,
    retry: false,
  })
}
