"use client"
import type { ReactNode } from "react"
import { base } from "wagmi/chains"
import { OnchainKitProvider } from "@coinbase/onchainkit"
import { SafeArea } from "@coinbase/onchainkit/minikit"
import { WagmiProvider, createConfig, http } from "wagmi"
import { coinbaseWallet } from "wagmi/connectors"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient()

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: "Pasta Maker",
      preference: "all",
    }),
  ],
  ssr: true,
  transports: {
    [base.id]: http(),
  },
})

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base}
          config={{
            appearance: {
              mode: "auto",
            },
            wallet: {
              display: "modal",
            },
          }}
          miniKit={{
            enabled: true,
            autoConnect: true,
            notificationProxyUrl: undefined,
          }}
        >
          <SafeArea>{children}</SafeArea>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
