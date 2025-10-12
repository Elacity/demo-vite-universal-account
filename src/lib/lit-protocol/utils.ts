import * as ethers from "ethers";
import { LitContracts } from "@lit-protocol/contracts-sdk";

export const getPkpInfoFromMintReceipt = async (
  txReceipt: ethers.ContractReceipt,
  litContractsClient: LitContracts,
) => {
  const pkpMintedEvent = txReceipt?.events!.find(
    (event) =>
      event.topics[0] ===
      "0x3b2cc0657d0387a736293d66389f78e4c8025e413c7a1ee67b7707d4418c46b8",
  );

  if (!pkpMintedEvent) {
    return Promise.reject(
      new Error("no event data to catch PKP info")
    )
  }

  const pkpPublicKey = "0x" + pkpMintedEvent!.data.slice(130, 260);
  const pkpTokenId = ethers.utils.keccak256(pkpPublicKey);
  const pkpEthAddress =
    await litContractsClient.pkpNftContract.read.getEthAddress(pkpTokenId);

  return {
    pkpTokenId: ethers.BigNumber.from(pkpTokenId).toString(),
    pkpPublicKey,
    pkpEthAddress,
  };
};
