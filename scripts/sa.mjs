import ethers from "ethers";

async function getParticleSmartAccount(ownerAddress) {
  const factory = "0xb3f15a44f91a08a93a11c6fbf6a4933c623275fe";
  const entryPoint = "0xba418fa699622de824b258c61eb150ed7a13967b";

  const initData = "0x2ede3bc0" + ownerAddress.slice(2).padStart(64, "0");
  const callData =
    "0x2e7a1a83" +
    entryPoint.slice(2).padStart(64, "0") +
    "0000000000000000000000000000000000000000000000000000000000000060" +
    "0000000000000000000000000000000000000000000000000000000000000000" +
    ((initData.length - 2) / 2).toString(16).padStart(64, "0") +
    initData.slice(2).padEnd(64, "0");

  console.log({ initData, callData });

  const response = await fetch("https://mainnet.base.org", {
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
  const derived = "0x" + result.result.slice(-40);

  return ethers.utils.getAddress(derived);
}

getParticleSmartAccount(process.argv[2]).then(console.log).catch(console.error);
