"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { PopupMessageCenter } from "@/components/ui/popup-message-center";
import { setHttpClientAuthTokenGetter } from "@/lib/api/http-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

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
       <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
