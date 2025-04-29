import { QueryClient } from "@tanstack/react-query";

// Create a QueryClient with better configuration for Firestore
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
