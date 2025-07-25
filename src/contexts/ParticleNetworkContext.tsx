/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { type Connector } from '@particle-network/connector-core';
import {
  type IAssetsResponse,
  type ISmartAccountOptions,
  UniversalAccount,
} from '@particle-network/universal-account-sdk';
import {
  useAccount,
  useDisconnect,
  useWallets,
} from '@particle-network/connectkit';
import type { EVMProvider } from '@particle-network/connectkit/auth';

export type SmartAccountInfo = Pick<ISmartAccountOptions, 'ownerAddress' | 'smartAccountAddress' | 'solanaSmartAccountAddress'>;

interface ConnectorContextValue {
  account?: string;
  universalAccount?: UniversalAccount;
  smartAccountInfo?: SmartAccountInfo;
  primaryAssets?: IAssetsResponse;
  chainId?: number;
  active?: boolean;
  connector?: Connector;
  deactivate: () => void;
  signMessage: (rootHash: string) => Promise<string>;
}

export const ParticleNetworkContext = React.createContext<ConnectorContextValue>({
  deactivate: () => { },
  signMessage: () => Promise.resolve(""),
});

interface ParticleNetworkContextProps { }

const ParticleNetworkProvider: React.FC<React.PropsWithChildren<ParticleNetworkContextProps>> = React.memo(({
  children,
}) => {
  const {
    address: eoaAddress, // EOA address
    chainId,
    connector,
  } = useAccount();
  const [primaryWallet] = useWallets();
  const { disconnect } = useDisconnect();

  // Universal Account instance states
  const [universalAccount, setUniversalAccount] = React.useState<UniversalAccount>();

  // Aggregated balance across all chains
  const [primaryAssets, setPrimaryAssets] = React.useState<IAssetsResponse>();

  // Smart account addresses for different chains
  const [smartAccountInfo, setSmartAccountInfo] = React.useState<SmartAccountInfo>({
    ownerAddress: '',
    smartAccountAddress: '', // EVM-based chains (Ethereum, Base, etc)
    solanaSmartAccountAddress: '', // Solana chain
  });

  const deactivate = () => {
    disconnect({ connector });
  };

  // === Initialize UniversalAccount ===
  React.useEffect(() => {
    if (eoaAddress) {
      // Create new UA instance when user connects
      const ua = new UniversalAccount({
        projectId: import.meta.env.VITE_PARTICLE_PROJECT_ID || '' as string,
        projectClientKey: import.meta.env.VITE_PARTICLE_CLIENT_KEY || '' as string,
        projectAppUuid: import.meta.env.VITE_PARTICLE_APP_ID || '' as string,
        ownerAddress: eoaAddress,
      });
      console.log('UniversalAccount initialized:', ua);
      setUniversalAccount(ua);
    }
  }, [eoaAddress]);

  // === Fetch Smart Account Addresses ===
  React.useEffect(() => {
    if (!universalAccount || !eoaAddress) return;

    const fetchSmartAccountAddresses = async () => {
      // Get smart account addresses for both EVM and Solana
      const { smartAccountAddress, solanaSmartAccountAddress } = await universalAccount.getSmartAccountOptions();
      setSmartAccountInfo({
        ownerAddress: eoaAddress, // EOA address
        smartAccountAddress: smartAccountAddress || '', // EVM smart account
        solanaSmartAccountAddress: solanaSmartAccountAddress || '', // Solana smart account
      });
    };

    fetchSmartAccountAddresses();
  }, [universalAccount, eoaAddress]);

  // === Fetch Primary Assets ===
  React.useEffect(() => {
    if (!universalAccount || !eoaAddress) return;

    const fetchPrimaryAssets = async () => {
      // Get aggregated balance across all chains
      // This includes ETH, USDC, USDT, etc. on various chains
      const assets = await universalAccount.getPrimaryAssets();
      setPrimaryAssets(assets);
    };

    fetchPrimaryAssets();
  }, [universalAccount, eoaAddress]);

  const signMessage = React.useCallback(async (rootHash: string) => {
    if (primaryWallet.connector.type !== "particleAuth") {
      const walletClient = primaryWallet?.getWalletClient();
      return walletClient?.signMessage({
        account: eoaAddress as `0x${string}`,
        message: { raw: rootHash as `0x${string}` },
      });
    }

    const provider = await primaryWallet.connector.getProvider();
    return (provider as EVMProvider).signMessage(rootHash);
  }, [primaryWallet, eoaAddress]);

  return (
    <ParticleNetworkContext.Provider
      value={{
        ...({
          chainId,
          account: eoaAddress,
          connector,
          universalAccount, // ua sdk instance
          primaryAssets,
          smartAccountInfo, // ua info
        }),
        deactivate,
        signMessage
      }}
    >
      {children}
    </ParticleNetworkContext.Provider>
  );
});

ParticleNetworkProvider.displayName = 'ParticleNetworkProviderInner';

export default ParticleNetworkProvider;
