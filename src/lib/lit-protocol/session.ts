import * as ethers from "ethers";
import { type Connector } from "@particle-network/connector-core";
import type { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_ABILITY } from "@lit-protocol/constants";
import type { AuthMethod } from "@lit-protocol/types";
import {
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitAccessControlConditionResource,
  LitActionResource,
  type LitResourceAbilityRequest,
} from "@lit-protocol/auth-helpers";
import type { PKPEntity, SessionParams } from "./types";
import { capacityDelegationAuthSig } from "./constants";
import { initializePKPForAccount } from "./pkp";

export const createWeb3SessionSigs = async (
  client: LitNodeClient,
  connector: Connector,
  opts?: SessionParams,
) => {
  const provider = await connector.getProvider();
  const ethersProvider = new ethers.providers.Web3Provider(
    provider as ethers.providers.ExternalProvider,
  );
  const eoaSigner = ethersProvider.getSigner();

  const sessionSigs = await client.getSessionSigs({
    chain: opts?.chain || "ethereum",
    expiration: new Date(Date.now() + 1000 * 60 * 100).toISOString(), // 100 minutes
    resourceAbilityRequests: [
      {
        resource: new LitAccessControlConditionResource("*"),
        ability: LIT_ABILITY.AccessControlConditionDecryption,
      },
      {
        resource: new LitActionResource("*"),
        ability: LIT_ABILITY.LitActionExecution,
      },
    ],
    authNeededCallback: async ({
      uri,
      expiration,
      resourceAbilityRequests,
    }) => {
      const toSign = await createSiweMessageWithRecaps({
        litNodeClient: client,
        chainId: await connector.getChainId(), // Base chain ID
        nonce: await client.getLatestBlockhash(),

        // abilties and scopes
        uri: uri as string,
        statement: "Sign this message to access the media content",
        expiration: expiration as string,
        resources: resourceAbilityRequests as LitResourceAbilityRequest[],

        // @dev: danger zone, should match
        walletAddress: opts?.account || (await eoaSigner.getAddress()),
      });

      // see https://github.com/LIT-Protocol/js-sdk/blob/master/packages/auth-helpers/src/lib/generate-auth-sig.ts#L17
      const authSigArgs = {
        signer: eoaSigner,
        toSign,

        // if we enforce this value to be the smart account address instead of the
        // signer it just throws `Error 400 - NodeSIWEMessageError`
        // `The address in the SIWE message does not match the address in the auth sig`
        // address: smartAccountInfo?.smartAccountAddress as string,
        ...(opts?.account && {
          signer: {
            signMessage: async (message: string) => {
              return eoaSigner.signMessage(message);
            },
            getAddress: async () => {
              return opts?.account as string;
            },
          },
          // fix of nthe near `NodeSIWEMessageError`
          // but it throws another 400 error `NodeSIWECapabilityInvalid`
          // `validation error: Resource id not found in auth_sig capabilities: validation error: Could not find valid capability.`
          // `Invalid Capability object in SIWE resource ReCap`
        }),
      };
      const authSig = await generateAuthSig(authSigArgs);

      return authSig;
    },
  });

  return sessionSigs;
};

export const createSessionSigsFromPKP = async (
  client: LitNodeClient,
  pkp: PKPEntity,
  opts?: SessionParams,
) => {
  const sessionSigs = await client.getPkpSessionSigs({
    pkpPublicKey: pkp.pkpPublicKey,
    authMethods: opts?.authMethods,
    resourceAbilityRequests: [
      {
        resource: new LitAccessControlConditionResource("*"),
        ability: LIT_ABILITY.AccessControlConditionDecryption,
      },
      {
        resource: new LitActionResource("*"),
        ability: LIT_ABILITY.LitActionExecution,
      },
    ],
    expiration: new Date(Date.now() + 1000 * 60 * 100).toISOString(), // 100 minutes
    // @dev: we need manual delegation here
    // as the PKP is a volatile entity that could potentially
    // not among the delegation database
    capacityDelegationAuthSig,
  });

  return sessionSigs;
};

export const createSessionSigsFromLitAction = async (
  client: LitNodeClient,
  litActionCode: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  opts?: SessionParams & { jsParams?: Record<string, any> },
) => {
  const pkp = await initializePKPForAccount(
    client,
    opts?.account as string,
    opts?.authMethods?.[0] as AuthMethod,
  );

  const sessionSigs = await client.getLitActionSessionSigs({
    litActionCode: litActionCode,
    jsParams: opts?.jsParams || {},
    pkpPublicKey: pkp.pkpPublicKey,
    authMethods: opts?.authMethods,
    resourceAbilityRequests: [
      {
        resource: new LitAccessControlConditionResource("*"),
        ability: LIT_ABILITY.AccessControlConditionDecryption,
      },
      {
        resource: new LitActionResource("*"),
        ability: LIT_ABILITY.LitActionExecution,
      },
    ],
    expiration: new Date(Date.now() + 1000 * 60 * 100).toISOString(), // 100 minutes
    // @dev: we need manual delegation here
    // as the PKP is a volatile entity that could potentially
    // not among the delegation database
    capacityDelegationAuthSig,
  });

  return sessionSigs;
};
