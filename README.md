# Universal Accounts Demo

A React + TypeScript + Vite application demonstrating Particle Network's Universal Account SDK and ConnectKit integration.

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

Then edit `.env` with your actual Particle Network project details from https://dashboard.particle.network/

## Features

- Wallet connection with Particle ConnectKit
- Universal Account management (EVM + Solana)
- Cross-chain asset aggregation
- Smart contract interactions on Base mainnet
- Transaction error handling and user feedback
