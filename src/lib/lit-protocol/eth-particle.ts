import * as ethers from "ethers";
import { type Connector } from "@particle-network/connector-core";
import type { LitNodeClient } from "@lit-protocol/lit-node-client";
import { EthWalletProvider } from "@lit-protocol/lit-auth-client";
import type { AuthMethod } from "@lit-protocol/types";
import getRelayer from "./relayer";

export const authenticateWeb3 = async (
  client: LitNodeClient,
  connector: Connector,
  account?: string,
): Promise<AuthMethod> => {
  const provider = await connector.getProvider();
  const ethersProvider = new ethers.providers.Web3Provider(
    provider as ethers.providers.ExternalProvider,
  );
  const eoaSigner = ethersProvider.getSigner();
  const eoaAddress = await eoaSigner.getAddress();

  const relay = getRelayer(client);

  const ethWalletProvider = new EthWalletProvider({
    relay,
    litNodeClient: client,
  });
  const authMethod = await ethWalletProvider.authenticate({
    address: account ?? eoaAddress,
    getAddress: () => {
      return account ?? eoaAddress;
    },
    signMessage: async (message: string) => {
      return await eoaSigner.signMessage(message);
    },
  });

  return authMethod;
};
