import * as ethers from "ethers";
import { LitContracts } from "@lit-protocol/contracts-sdk";

export const getPkpInfoFromMintReceipt = async (
  txReceipt: ethers.ContractReceipt,
  litContractsClient: LitContracts,
) => {
  const pkpMintedEvent = txReceipt?.logs!.find(
    (event) =>
      event.topics[0] ===
      "0x3b2cc0657d0387a736293d66389f78e4c8025e413c7a1ee67b7707d4418c46b8",
  );

  if (!pkpMintedEvent) {
    return Promise.reject(new Error("no event data to catch PKP info"));
  }

  const iface = new ethers.utils.Interface([
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "bytes",
          name: "pubkey",
          type: "bytes",
        },
      ],
      name: "PKPMinted",
      type: "event",
    },
  ]);

  const decoded = iface.decodeEventLog(
    "PKPMinted",
    pkpMintedEvent.data!,
    pkpMintedEvent.topics!,
  );

  const pkpPublicKey = decoded.pubkey;
  const pkpTokenId = decoded.tokenId as ethers.BigNumber;
  console.log("DEBUG", decoded, {
    pkpPublicKey,
    pkpTokenId: pkpTokenId.toString(),
  });
  const pkpEthAddress =
    await litContractsClient.pkpNftContract.read.getEthAddress(
      pkpTokenId.toString(),
    );

  return {
    pkpTokenId: pkpTokenId.toString(),
    pkpPublicKey,
    pkpEthAddress,
  };
};
