import { ApolloProvider } from "@apollo/client";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, type ReactNode, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { base } from "viem/chains";
import ErrorBoundary from "@/components/Common/ErrorBoundary";
import FullPageLoader from "@/components/Shared/FullPageLoader";
import { CHAIN, PRIVY_APP_ID } from "@/data/constants";
import authLink from "@/helpers/authLink";
import { ThemeProvider } from "@/hooks/useTheme";
import { createApolloClient } from "@/indexer/apollo/client";

const Web3Provider = lazy(() => import("./Web3Provider"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } }
});

const lensApolloClient = createApolloClient(authLink);

interface ProvidersProps {
  children: ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <ErrorBoundary>
      <PrivyProvider
        appId={PRIVY_APP_ID}
        config={{
          appearance: { walletChainType: "ethereum-only" },
          defaultChain: CHAIN,
          embeddedWallets: { ethereum: { createOnLogin: "off" } },
          loginMethods: ["email"],
          supportedChains: [CHAIN, base]
        }}
      >
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<FullPageLoader />}>
            <Web3Provider>
              <ApolloProvider client={lensApolloClient}>
                <HelmetProvider>
                  <ThemeProvider>{children}</ThemeProvider>
                </HelmetProvider>
              </ApolloProvider>
            </Web3Provider>
          </Suspense>
        </QueryClientProvider>
      </PrivyProvider>
    </ErrorBoundary>
  );
};

export default Providers;
