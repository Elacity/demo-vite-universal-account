# Universal Accounts Demo

A React + TypeScript + Vite application demonstrating Particle Network's
Universal Account SDK and ConnectKit integration.

## Getting Started

### Prerequisites

- Node.js (see `.nvmrc` for required version)
- Yarn package manager

### Installation and Development

1. **Use the correct Node.js version:**
   ```bash
   nvm use
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Start development server:**
   ```bash
   yarn run dev
   ```

4. **Build for production:**
   ```bash
   yarn run build
   ```

### Environment Setup

Copy `.env.example` to `.env` and configure your Particle Network credentials:

```bash
cp .env.example .env
```

Then edit `.env` with your actual Particle Network project details from
https://dashboard.particle.network/

## Lit protocol

### Setup relayer (as part of payment delegation database component)

see https://developer.litprotocol.com/paying-for-lit/payment-delegation-db and
https://github.com/LIT-Protocol/developer-guides-code/tree/master/payment-delegation-db-relayer/nodejs

- registering new payer

```
curl -vL -X POST \
   -H 'Content-Type: application/json' \
   -H 'api-key: <KEY>' \ # https://developer.litprotocol.com/paying-for-lit/payment-delegation-db#registering-a-payer-wallet
   https://datil-test-relayer.getlit.dev/register-payer
```

- adding users as payees

```
curl -vL -X POST \
   -H 'Content-Type: application/json' \
   -H 'api-key: <KEY>' \ # https://developer.litprotocol.com/paying-for-lit/payment-delegation-db#registering-a-payer-wallet
   -H 'payer-secret-key: <>' # response .payerSecretKey from above\
   https://datil-test-relayer.getlit.dev/add-users
```


## Features

- Wallet connection with Particle ConnectKit
- Universal Account management (EVM + Solana)
- Cross-chain asset aggregation
- Smart contract interactions on Base mainnet
- Transaction error handling and user feedback
- Lit procotol sandboxing
