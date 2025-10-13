import * as ethers from "ethers";

const contractsAddr = {
  8453: {
    factory: "0xb3f15a44f91a08a93a11c6fbf6a4933c623275fe",
    entryPoint: "0xba418fa699622de824b258c61eb150ed7a13967b",
  },
};

const resolveSmartAccountAddress = async (ownerAddress, rpcUrl) => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const { chainId } = await provider.getNetwork();
  const { factory, entryPoint } = contractsAddr[Number(chainId)] || {};

  if (!factory || !entryPoint) {
    // we will not able to derivate smart account
    // address without these input contracts
    return ethers.utils.getAddress(ownerAddress);
  }

  // -- Make a raw call to the factory address to get
  // see https://basescan.org/address/0x9406Cc6185a346906296840746125a0E44976454#code

  const initData = "0x2ede3bc0" + ownerAddress.slice(2).padStart(64, "0");
  const callData =
    "0x2e7a1a83" +
    entryPoint.slice(2).padStart(64, "0") +
    "0000000000000000000000000000000000000000000000000000000000000060" +
    "0000000000000000000000000000000000000000000000000000000000000000" +
    ((initData.length - 2) / 2).toString(16).padStart(64, "0") +
    initData.slice(2).padEnd(64, "0");

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: factory, data: callData }, "latest"],
    }),
  });

  const result = await response.json();
  console.log({result})
  const derived = "0x" + result.result.slice(-40);

  return ethers.utils.getAddress(derived);
};

const hasAccessByContentId = async (userAddress, kid, authority, rpcUrl) => {
  const contractAbi = [
    {
      inputs: [
        {
          name: "userAddress",
          type: "address",
        },
        {
          name: "contentId",
          type: "bytes16",
        },
      ],
      name: "hasAccessByContentId",
      outputs: [
        {
          name: "hasAccess",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  const authorityContract = new ethers.Contract(authority, contractAbi, new ethers.providers.JsonRpcProvider(rpcUrl));
  const saAddress = await resolveSmartAccountAddress(userAddress, rpcUrl);

  return await authorityContract.hasAccessByContentId(saAddress, kid);
};