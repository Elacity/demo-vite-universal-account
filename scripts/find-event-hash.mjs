import pkg from "ethers";
const { utils } = pkg;
const { keccak256, toUtf8Bytes } = utils;
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const abiData = require("./lit-contracts-datil-test.cjs");

function getEventSignature(event) {
  const inputs = event.inputs
    .map((input) => {
      // Handle tuple types (structs)
      if (input.type.startsWith("tuple")) {
        return input.internalType || input.type;
      }
      return input.type;
    })
    .join(",");

  return `${event.name}(${inputs})`;
}

function findEventByHash(targetHash) {
  const results = [];

  // Iterate through all contracts in the ABI data
  for (const contractGroup of abiData.data) {
    for (const contract of contractGroup.contracts) {
      // Iterate through ABI entries
      for (const item of contract.ABI) {
        if (item.type === "event") {
          const signature = getEventSignature(item);
          const hash = keccak256(toUtf8Bytes(signature));

          if (hash.toLowerCase() === targetHash.toLowerCase()) {
            results.push({
              contractName: contractGroup.name,
              contractAddress: contract.address_hash,
              eventName: item.name,
              signature: signature,
              hash: hash,
              event: item,
            });
          }
        }
      }
    }
  }

  return results;
}

// Target hash
const targetHash = process.argv[2];

console.log("Searching for event with hash:", targetHash);
console.log("");

const matches = findEventByHash(targetHash);

if (matches.length > 0) {
  console.log("✅ Found matching event(s):");
  console.log("");

  matches.forEach((match, index) => {
    console.log(`Match #${index + 1}:`);
    console.log(`  Contract: ${match.contractName}`);
    console.log(`  Address: ${match.contractAddress}`);
    console.log(`  Event Name: ${match.eventName}`);
    console.log(`  Signature: ${match.signature}`);
    console.log(`  Hash: ${match.hash}`);
    console.log("");
    console.log("  Full Event Definition:");
    console.log(JSON.stringify(match.event, null, 2));
    console.log("");
  });
} else {
  console.log("❌ No matching event found");
  console.log("");
  console.log("Listing all events for reference:");

  // List first few events to help debug
  let count = 0;
  for (const contractGroup of abiData.data) {
    for (const contract of contractGroup.contracts) {
      for (const item of contract.ABI) {
        if (item.type === "event" && count < 10) {
          const signature = getEventSignature(item);
          const hash = keccak256(toUtf8Bytes(signature));
          console.log(`${signature} => ${hash}`);
          count++;
        }
      }
    }
  }
}
