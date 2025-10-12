import * as ethers from "ethers";
import bs58 from "bs58";
import type { LitNodeClient } from "@lit-protocol/lit-node-client";
import {
  AUTH_METHOD_SCOPE,
  LIT_ABILITY,
  LIT_RPC,
  AUTH_METHOD_TYPE,
} from "@lit-protocol/constants";
import { LitContracts } from "@lit-protocol/contracts-sdk";
import { PKPEthersWallet } from "@lit-protocol/pkp-ethers";
import type {
  AuthCallbackParams,
  AuthMethod,
  SignerLike,
} from "@lit-protocol/types";
import type { PKPEntity } from "./types";
import getRelayer from "./relayer";
import { LitActionResource } from "@lit-protocol/auth-helpers";
import { getPkpInfoFromMintReceipt } from "./utils";

// see this doc, about how private keys are derived to be used for PKPs
// https://github.com/WebOfTrustInfo/rwot1-sf/blob/master/topics-and-advance-readings/hierarchical-deterministic-keys--bip32-and-beyond.md

/**
 * create a new PKP (Programmable Key Pair) using the provided AuthMethod.
 * This function interacts with the Lit Protocol relayer to mint a new PKP.
 * The minted PKP will have the ability to sign anything and its Ethereum address
 *
 * @param client
 * @param authMethod
 * @returns
 */
export const createPKP = async (
  client: LitNodeClient,
  authMethod: AuthMethod,
): Promise<PKPEntity> => {
  const relay = getRelayer(client);
  const mintTx = await relay.mintPKPWithAuthMethods([authMethod], {
    pkpPermissionScopes: [[AUTH_METHOD_SCOPE.SignAnything]],
    addPkpEthAddressAsPermittedAddress: true,
  });

  return mintTx as PKPEntity;
};

/**
 * Instantiate a PKP as a Wallet-like object in terms of Lit Protocol.
 *
 * @param client
 * @param authMethod
 * @param pkp
 * @returns
 */
export const asWallet = async (
  client: LitNodeClient,
  authMethod: AuthMethod,
  pkp: PKPEntity,
): Promise<PKPEthersWallet> => {
  const pkpWallet = new PKPEthersWallet({
    litNodeClient: client,
    authContext: {
      getSessionSigsProps: {
        chain: "ethereum", // doesn't really matter
        expiration: new Date(Date.now() + 60_000 * 60).toISOString(),
        resourceAbilityRequests: [
          {
            resource: new LitActionResource("*"),
            ability: LIT_ABILITY.PKPSigning,
          },
        ],
        authNeededCallback: async (params: AuthCallbackParams) => {
          const response = await client.signSessionKey({
            statement: params.statement,
            authMethods: [authMethod],
            expiration: params.expiration,
            resources: params.resources,
            chainId: 1,
          });
          return response.authSig;
        },
      },
    },
    pkpPubKey: pkp.pkpPublicKey!,
    rpc: LIT_RPC.CHRONICLE_YELLOWSTONE,
  });

  await pkpWallet.init();

  return pkpWallet;
};

/**
 * Initialize a PKP for a smart account.
 * It will
 *
 * @param client
 * @param account
 * @param owner
 * @returns
 */
export const initializePKPForSmartAccount = async (
  client: LitNodeClient,
  account: string,
  owner: SignerLike,
): Promise<PKPEntity> => {
  const PKP_STORAGE_KEY = `lit-pkp_${account}`;
  let pkp: PKPEntity | undefined;
  const pkpRaw = localStorage.getItem(PKP_STORAGE_KEY);

  if (pkpRaw) {
    try {
      pkp = JSON.parse(pkpRaw) as PKPEntity;
      return pkp;
    } catch (e) {
      console.warn("Failed to parse stored PKP:", e);
    }
  }
  const litContracts = new LitContracts({
    signer: owner,
    network: client.config.litNetwork,
  });
  await litContracts.connect();

  console.log("🔄 Generating Auth Method type and ID...");
  const authMethodType = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("@particle-network/universal-account"),
  );
  const authMethodId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`sa:${account}`));
  console.log("✅ Generated Auth Method type and ID", {
    authMethodId,
    authMethodType,
  });

  // console.log("🔄 Getting PKP mint cost...");
  // const pkpMintCost = await litContracts.pkpNftContract.read.mintCost();
  // console.log("✅ Got PKP mint cost", pkpMintCost);

  const tx =
    await litContracts.pkpHelperContract.write.mintNextAndAddAuthMethods(
      AUTH_METHOD_TYPE.LitAction, // keyType
      [AUTH_METHOD_TYPE.LitAction, authMethodType], // permittedAuthMethodTypes
      [
        `0x${Buffer.from(bs58.decode("QmenYGBaQtqgw9TyszT1coDzn6nkLT4mA6ATUoWr4g25So")).toString("hex")}`,
        authMethodId,
      ], // permittedAuthMethodIds
      ["0x", "0x"], // permittedAuthMethodPubkeys
      [[AUTH_METHOD_SCOPE.SignAnything], [AUTH_METHOD_SCOPE.NoPermissions]], // permittedAuthMethodScopes
      true, // addPkpEthAddressAsPermittedAddress
      true, // sendPkpToItself
      //{ value: pkpMintCost },
    );
  const receipt = await tx.wait();
  console.log(`✅ Minted new PKP`, receipt);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  pkp = await getPkpInfoFromMintReceipt(receipt, litContracts);
  localStorage.setItem(PKP_STORAGE_KEY, JSON.stringify(pkp));

  return pkp!;
};

/**
 * Initialize a PKP for a given account.
 * If a PKP already exists for the account, it will be reused.
 * Otherwise, a new PKP will be minted using the provided AuthMethod.
 * The PKP information is stored in localStorage for future reuse.
 *
 * @param client
 * @param account
 * @param authMethod
 * @returns
 */
export const initializePKPForAccount = async (
  client: LitNodeClient,
  account: string,
  authMethod: AuthMethod,
): Promise<PKPEntity> => {
  const PKP_STORAGE_KEY = `lit-pkp_${account}`;
  let pkp: PKPEntity | undefined;
  const pkpRaw = localStorage.getItem(PKP_STORAGE_KEY);

  if (pkpRaw) {
    try {
      pkp = JSON.parse(pkpRaw) as PKPEntity;
      return pkp;
    } catch (e) {
      console.warn("Failed to parse stored PKP:", e);
    }
  }

  if (!pkp) {
    console.log("Minting new PKP...");

    // Mint PKP with auth method
    pkp = await createPKP(client, authMethod);

    // Store PKP for reuse
    localStorage.setItem(PKP_STORAGE_KEY, JSON.stringify(pkp));
  }

  return pkp;
};
