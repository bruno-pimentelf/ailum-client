"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // One QueryClient per browser session — useState ensures it's not recreated on re-renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 30 seconds before re-fetching
            staleTime: 30 * 1000,
            // Keep unused data in cache for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Retry once on failure before surfacing the error
            retry: 1,
            // Refetch when the user returns to the tab
            refetchOnWindowFocus: true,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
