import type { AuthMethod } from "@lit-protocol/types";

export interface PKPEntity {
  pkpTokenId: string;
  pkpPublicKey: string;
  pkpEthAddress: string;
}

export declare type PKPOptionalEntity = Partial<PKPEntity>;

export interface SessionParams {
  account?: string;
  authMethods?: AuthMethod[];
  chain?: string;
}
