"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { PopupMessageCenter } from "@/components/ui/popup-message-center";
import { setHttpClientAuthTokenGetter } from "@/lib/api/http-client";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const { getToken } = useAuth();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  useEffect(() => {
    setHttpClientAuthTokenGetter(() => getToken());

    return () => {
      setHttpClientAuthTokenGetter(null);
    };
  }, [getToken]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <PopupMessageCenter />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
