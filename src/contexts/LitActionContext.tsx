/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import * as ethers from "ethers";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import type {
  ExecuteJsResponse,
  LIT_NETWORKS_KEYS,
  SessionSigsMap,
} from "@lit-protocol/types";
import { ParticleNetworkContext } from "./ParticleNetworkContext";
import { authenticateWeb3 } from "../lib/lit-protocol/eth-particle";
import {
  initializePKPForAccount,
  initializePKPForSmartAccount,
} from "../lib/lit-protocol/pkp";
import {
  createSessionSigsFromPKP,
  createWeb3SessionSigs,
  createSessionSigsFromLitAction,
} from "../lib/lit-protocol/session";
import type { PKPEntity } from "../lib/lit-protocol/types";

interface SessionData {
  sessionSigs: SessionSigsMap;
  expiration: string;
}

interface DecryptionResult {
  decryptedData?: Uint8Array;
  license?: Record<string, unknown>;
}

interface LitActionContextValue {
  session?: SessionData | null;
  isCreatingSession?: boolean;
  isDecrypting?: boolean;
  output?: string;
  currentSession?: SessionData | null;
  isLitReady?: boolean;
  decryptCEK?: (
    kid: string,
    ciphertext: string,
    hash: string,
  ) => Promise<DecryptionResult>;
  executeAction?: (
    actionCode: string,
    params: Record<string, any>,
  ) => Promise<ExecuteJsResponse>;
  createSession?: (sessionType: string) => Promise<void>;
}

const LitActionContext = React.createContext<LitActionContextValue>({});

export const LitActionProvider: React.FC<
  React.PropsWithChildren<{ network: string }>
> = ({ children, network }) => {
  const { account, connector, smartAccountInfo } = React.useContext(
    ParticleNetworkContext,
  );

  // Lit Protocol state
  const [litClient, setLitClient] = React.useState<LitNodeClient | null>(null);
  const [currentSession, setCurrentSession] =
    React.useState<SessionData | null>(null);
  const [isLitReady, setIsLitReady] = React.useState(false);

  // UI state
  const [isCreatingSession, setIsCreatingSession] = React.useState(false);
  const [isDecrypting, setIsDecrypting] = React.useState(false);
  const [output, setOutput] = React.useState("");

  // Initialize Lit client
  const initLit = React.useCallback(async () => {
    if (!litClient) {
      const client = new LitNodeClient({
        litNetwork: network as string as LIT_NETWORKS_KEYS,
        debug: true,
      });
      await client.connect();

      console.log("Lit client connected");
      setLitClient(client);
      setIsLitReady(true);
      return client;
    }
    return litClient;
  }, [litClient, network]);

  // Initialize on mount
  React.useEffect(() => {
    initLit().catch((error) => {
      console.error("Failed to initialize Lit Protocol:", error);
    });
  }, [initLit]);

  const createSession = React.useCallback(
    async (sessionType: string) => {
      try {
        if (!account || !smartAccountInfo?.smartAccountAddress) {
          throw new Error("Please connect your wallet first");
        }

        if (!connector) {
          throw new Error("Connector not available");
        }

        setIsCreatingSession(true);
        const client = await initLit();

        let session: SessionData | null = null;
        const expiration = new Date(Date.now() + 1000 * 60 * 100).toISOString();

        switch (sessionType) {
          case "straight":
            session = await (async function (expiration) {
              return {
                sessionSigs: await createWeb3SessionSigs(client, connector, {
                  account,
                  chain: "base",
                }),
                expiration,
              };
            })(expiration);
            break;
          case "pkp":
            session = await (async function (expiration) {
              const provider = await connector.getProvider();
              const ethersProvider = new ethers.providers.Web3Provider(
                provider as ethers.providers.ExternalProvider,
              );
              const eoaSigner = ethersProvider.getSigner();
              // Authenticate -> create AuthMethod
              const authMethod = await authenticateWeb3(client, connector);
              console.log("Auth method created:", authMethod);

              // Step 2: Check if PKP already exists for this EOA
              // Note: We use the EOA for PKP storage key since the PKP is tied to the EOA's auth
              const pkp = await initializePKPForSmartAccount(
                client,
                smartAccountInfo?.smartAccountAddress as string,
                eoaSigner,
              );
              console.log("Using PKP:", pkp.pkpEthAddress);

              // Step 4: Generate session signatures using the PKP
              console.log("Generating session signatures...");
              const sessionSigs = await createSessionSigsFromPKP(
                client,
                pkp as PKPEntity,
                {
                  litActionIpfsId:
                    "QmenYGBaQtqgw9TyszT1coDzn6nkLT4mA6ATUoWr4g25So",
                  jsParams: {
                    account: smartAccountInfo?.smartAccountAddress as string,
                    owner: account,
                  },
                },
              );

              // Step 5: Create and store session
              const session: SessionData = {
                sessionSigs,
                expiration,
              };

              return session;
            })(expiration);
            break;
          case "lit-action":
            session = await (async function (expiration) {
              // Authenticate -> create AuthMethod
              const authMethod = await authenticateWeb3(client, connector);
              console.log("Auth method created:", authMethod);

              // Step 2: Check if PKP already exists for this EOA
              // Note: We use the EOA for PKP storage key since the PKP is tied to the EOA's auth
              const pkp = await initializePKPForAccount(
                client,
                account,
                authMethod,
              );
              console.log("Using PKP:", pkp.pkpPublicKey);

              // Step 4: Generate session signatures using the PKP
              console.log("Generating session signatures...");
              const sessionSigs = await createSessionSigsFromLitAction(
                client,
                pkp,
                // A simple Lit Action that just logs parameters and returns true
                Buffer.from(
                  `
                  (async () => {
                    console.log("Lit Action running...");
                    console.log("EOA:", eoaAddress);
                    console.log("SA:", saAddress);
                    console.log("toSign:", toSign);
                    console.log("publicKey:", publicKey);
                    console.log("Auth", Lit.Auth);
                    
                    // Sign with PKP
                    // const sigShare = await Lit.Actions.signEcdsa({
                    //   toSign: Lit.Actions.uint8arrayFromString(toSign),
                    //   publicKey,
                    //   sigName: "sig",
                    // });
                    LitActions.setResponse({ response:"true" });
                  })();
                  `,
                ).toString("base64"),
                {
                  authMethods: [authMethod],
                  account,
                  jsParams: {
                    eoaAddress: account,
                    saAddress: smartAccountInfo?.smartAccountAddress,
                    toSign: `Authorize ${smartAccountInfo?.smartAccountAddress}`,
                    publicKey: pkp.pkpPublicKey,
                  },
                },
              );

              // Step 5: Create and store session
              const session: SessionData = {
                sessionSigs,
                expiration,
              };

              return session;
            })(expiration);
            break;
        }

        setCurrentSession(session);
        console.log("✅ Session created successfully!");
        setOutput(
          `Session created successfully!\nUsing ${Object.values(session?.sessionSigs || {}).at(0)?.address}`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("❌ Failed to create session:", error);
        setOutput(`Failed to create session: ${errorMessage}`);
        throw error;
      } finally {
        setIsCreatingSession(false);
      }
    },
    [account, smartAccountInfo?.smartAccountAddress, connector, initLit],
  );

  const executeAction = React.useCallback(
    async (actionCode: string, _params: Record<string, any>) => {
      console.log("Executing Lit Action:", actionCode, _params);
      const { isIpfsCid, ...params } = _params;

      if (!litClient) {
        throw new Error("Lit client not initialized");
      }

      if (!currentSession) {
        throw new Error("Please create a session first");
      }

      // Generate key pair for CEK transfer
      const keyAlg: KeyAlgorithm = { name: "X25519" };
      const keyPair = (await crypto.subtle.generateKey(keyAlg, true, [
        "deriveKey",
        "deriveBits",
      ])) as CryptoKeyPair;
      const localPublicKey = Buffer.from(
        await crypto.subtle.exportKey("raw", keyPair.publicKey),
      ).toString("hex");

      const response = await litClient.executeJs({
        ...(isIpfsCid ? {
          ipfsId: actionCode,
        } : {
          code: actionCode,
        }),
        sessionSigs: currentSession.sessionSigs,
        jsParams: {
          publicKey: localPublicKey,
          //saAddress: smartAccountInfo?.smartAccountAddress,
          keyAlg: { name: "X25519" },

          // chain setup
          rpc: "https://d5a533ecb86a.ngrok-free.app",
          authority: "0x8fe6bf9877B78BF0126819ff2593235E54Ee1E29",
          chain: "base",

          // cipher payload
          ...params,
          dataToEncryptHash: params.hash,
        },
      });

      setOutput(
        `Lit Action executed successfully!\n\nResponse:\n${JSON.stringify(response, null, 2)}`,
      );

      return response;
    },
    [currentSession, litClient],
  );

  // Decrypt with Lit Action
  const decryptCEK = React.useCallback(
    async (kid: string, ciphertext: string, hash: string) => {
      try {
        if (!account) {
          throw new Error("Please connect your wallet first");
        }

        if (!currentSession) {
          throw new Error("Please create a session first");
        }

        if (!litClient) {
          throw new Error("Lit client not initialized");
        }

        setIsDecrypting(true);
        setOutput("Processing Lit Action decryption...\n");

        console.log("Decrypting with Lit Action:", { ciphertext, hash });

        // Generate key pair for CEK transfer
        const keyAlg: KeyAlgorithm = { name: "X25519" };
        const keyPair = (await crypto.subtle.generateKey(keyAlg, true, [
          "deriveKey",
          "deriveBits",
        ])) as CryptoKeyPair;
        const localPublicKey = Buffer.from(
          await crypto.subtle.exportKey("raw", keyPair.publicKey),
        ).toString("hex");

        console.log("Transferring CEK to", { localPublicKey });
        const actionIpfsId = "QmWDBNCk1xHk8giLn1cxFrBke7aPFTuXsMDsnn9Pom1wZu";

        const { response: license } = await litClient.executeJs({
          ipfsId: actionIpfsId,
          sessionSigs: currentSession.sessionSigs,
          jsParams: {
            // Lit-based inputs
            ciphertext,
            dataToEncryptHash: hash,

            kid,
            actionIpfsId,
            //rpc: "https://base-public.nodies.app",
            rpc: "https://d5a533ecb86a.ngrok-free.app",
            authority: "0x8fe6bf9877B78BF0126819ff2593235E54Ee1E29",
            chain: "base",

            // Security parameters
            publicKey: localPublicKey,
            keyAlg: { name: "X25519" },

            // Account abstraction
            // saAddress: smartAccountInfo?.smartAccountAddress,
          },
        });

        console.log("Lit Action Decrypted Data:", license);

        const result: DecryptionResult = {
          license:
            typeof license === "object" && license !== null
              ? (license as Record<string, unknown>)
              : { value: license },
        };
        setOutput(
          `Lit Action decryption successful!\n\nLicense:\n${JSON.stringify(license, null, 2)}`,
        );
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const errorStack = error instanceof Error ? error.stack : "";
        console.error("Lit Action decryption error:", error);
        setOutput(
          `Lit Action decryption failed!\n\nError:\n${errorMessage}\n\nStack trace:\n${errorStack}`,
        );
        throw error;
      } finally {
        setIsDecrypting(false);
      }
    },
    [account, currentSession, litClient, smartAccountInfo?.smartAccountAddress],
  );

  const context = React.useMemo(
    () => ({
      session: currentSession,
      isCreatingSession,
      isDecrypting,
      output,
      currentSession,
      isLitReady,
      decryptCEK,
      executeAction,
      createSession,
    }),
    [
      currentSession,
      decryptCEK,
      createSession,
      isCreatingSession,
      isDecrypting,
      isLitReady,
      output,
      executeAction,
    ],
  );

  return (
    <LitActionContext.Provider value={context}>
      {children}
    </LitActionContext.Provider>
  );
};

export default LitActionContext;
