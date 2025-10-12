## -- title: Lit Protocol Implementation for Smart Account

# Lit Protocol implementation for Smart Account

```mermaid
---
config:
  layout: elk
  look: handDrawn
---
stateDiagram
  direction TB
  classDef Rose stroke-width:1px,stroke-dasharray:none,stroke:#FF5978,fill:#FFDFE5,color:#8E2236;
  classDef Sky stroke-width:1px,stroke-dasharray:none,stroke:#374D7C,fill:#E2EBFF,color:#374D7C;
  classDef Peach stroke-width:1px,stroke-dasharray:none,stroke:#FBB35A,fill:#FFEFDB,color:#8F632D;
  classDef Ash stroke-width:1px,stroke-dasharray:none,stroke:#999999,fill:#EEEEEE,color:#000000;
  classDef Fire stroke-width:4px,stroke-dasharray: 0,color:#D50000,stroke:#D50000,fill:#FFE0B2;
  state User {
    direction TB
    EOA --> SA:Initialize<br>ERC-4337<br>Simple Account factory
    EOA
    SA
  }
  EOA --> S
  LIT --> S
  S --> Args
  MEDIA --> Args
  Args --> D
  D --> FAIL
  User:Account Abstraction
  EOA:**EOA**
  SA:**Smart Account**<br>(owns media access tokens<br>or has subscription)
  S:.sessionSigs
  LIT:**Lit Protocol**<br>Initialization and connection
  Args:Arguments from media<br>{hash, ciphertext, actionIpfsId,...}
  MEDIA:**Media**<br>ERC-1155 + specific flow for subscription handling
  D:**Decryption**<br>Lit action execution<br>EOA used in ACC<br>resolution (.userAddress)
  FAIL:**Failure**<br>ACC rejection<br>No access for EOA
  class FAIL Rose
  class SA Sky
  class EOA,S,D Peach
  class Args,MEDIA Ash
  class LIT Fire
  style SA stroke-width:2px
  style MEDIA stroke-width: 3px, fill: #e5f5e0
```

Here is a simplified flowchart of how it is implemented.

The main use of Lit protocol here is to store in a decentralized and secure way
the CEK (Content Encryption Key). We rely on ACC mechanism to achieve the
ownership and condition for user to get access to it. Also, we perfom such a
process via Lit action which holds a Auth context where the connected user is
resolved.

```json
{
  conditionType: "evmBasic",
  contractAddress: "ipfs://....",
  standardContractType: "LitAction",
  chain: chain,
  method: "hasAccessByContentId",
  parameters: [":userAddress", kid, authority, rpc],
  returnValueTest: { comparator: "=", value: "true" }
}
```

The connected user here is always the EOA, ultimately we are seeking for a way
to make the Lit action to be executed as the smart account (enable to create
proper .sessionSigs)

already checked the
[EIP-1271 suggested](https://github.com/LIT-Protocol/developer-guides-code/tree/wyatt/eip-1271-contract/eip-1271/nodejs)
which is a signature verification flow seemingly.
