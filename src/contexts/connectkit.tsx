/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import React from "react";
import {
  ConnectKitProvider,
  createConfig,
  type ConnectKitOptions,
} from "@particle-network/connectkit";
import { authWalletConnectors } from "@particle-network/connectkit/auth";
import { evmWalletConnectors } from "@particle-network/connectkit/evm";

import "./style.css";

// Import base chain directly to avoid wildcard export issues
const base = {
  id: 8453,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://mainnet.base.org"] },
    public: { http: ["https://mainnet.base.org"] },
  },
  blockExplorers: {
    default: { name: "BaseScan", url: "https://basescan.org" },
  },
  testnet: false,
};

/**
 * Context interface for Particle Network ConnectKit configuration
 */
interface ParticleConnectkitContextProps {
  config: ReturnType<typeof createConfig>;
}

/**
 * Props interface for the ParticleConnectkit component
 */
interface ParticleConnectkitProps {}

// Configure supported chains
// @todo: MERGE <These mainnet entries are included here for testing purposes only.
// The goal is to demonstrate to the user the ability to add predefined ERC-20 tokens
// set by Particle Network in the wallet, as direct addition in the code does not work.
// Please, DO NOT MERGE THIS BRANCH without carefully considering the implications,
// as it may disrupt the current flow>.
const chains: ConnectKitOptions["chains"] = [base];

/**
 * Creates the configuration for Particle Network ConnectKit
 * @param theme - Material UI theme object for consistent styling
 * @returns ConnectKit configuration object
 */
const config = createConfig({
  // Project configuration from environment variables
  projectId: import.meta.env.VITE_PARTICLE_PROJECT_ID as string,
  clientKey: import.meta.env.VITE_PARTICLE_CLIENT_KEY as string,
  appId: import.meta.env.VITE_PARTICLE_APP_ID as string,

  // Appearance configuration including theme integration
  appearance: {
    // UI configuration options
    splitEmailAndPhone: false,
    collapseWalletList: false,
    hideContinueButton: true,
    // Order of connection methods
    connectorsOrder: ["email", "phone", "social"],
    // logo: '/static/elacity/waving.png',
    language: "en-US",
    // Theme customization using Material UI colors
    theme: {
      "--pcm-font-family": '-apple-system,"Proxima Nova",Arial,sans-serif',
      "--pcm-rounded-sm": "4px",
      "--pcm-rounded-md": "8px",
      "--pcm-rounded-lg": "11px",
      "--pcm-rounded-xl": "22px",
      "--pcm-body-action-color": "var(--pcm-body-color)",
    },
  },

  // Configure wallet connectors
  walletConnectors: [
    // Authentication wallet connectors configuration
    authWalletConnectors({
      fiatCoin: "USD",
      promptSettingConfig: {
        promptMasterPasswordSettingWhenLogin: 1,
        promptPaymentPasswordSettingWhenSign: 1,
      },
    }),
    evmWalletConnectors({
      metadata: { name: "Elacity" },
      multiInjectedProviderDiscovery: true,
    }),
  ],
  chains,
} as unknown as ConnectKitOptions);

/**
 * Context for sharing Particle Network ConnectKit configuration
 */
export const ParticleConnectkitContext =
  React.createContext<ParticleConnectkitContextProps>({
    config,
  });

/**
 * ParticleConnectkit Component
 * Provides ConnectKit configuration and context to its children
 * @param children - Child components that will have access to ConnectKit functionality
 */
export const ParticleConnectkit = ({
  children,
}: React.PropsWithChildren<ParticleConnectkitProps>) => {
  return (
    <ParticleConnectkitContext.Provider
      value={{
        config,
      }}
    >
      <ConnectKitProvider config={config} reconnectOnMount>
        {children}
      </ConnectKitProvider>
    </ParticleConnectkitContext.Provider>
  );
};

/**
 * Hook to access the Particle Network ConnectKit configuration
 * @returns ConnectKit configuration context
 */
export const useConnectkitConfig = () =>
  React.useContext(ParticleConnectkitContext);

// Export memoized component to prevent unnecessary re-renders
export default React.memo(ParticleConnectkit);
