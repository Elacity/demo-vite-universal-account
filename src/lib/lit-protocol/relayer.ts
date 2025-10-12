import { LitRelay } from "@lit-protocol/lit-auth-client";
import type { LitNodeClient } from "@lit-protocol/lit-node-client";

let relayer: LitRelay | null = null;

export default (litNodeClient: LitNodeClient): LitRelay => {
  if (!relayer) {
    relayer = new LitRelay({
      relayUrl: LitRelay.getRelayUrl(litNodeClient.config.litNetwork),
      relayApiKey: import.meta.env.VITE_LIT_RELAYER_API_KEY,
    });
  }

  return relayer;
};
