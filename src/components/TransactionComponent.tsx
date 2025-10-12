import { useAccount } from "@particle-network/connectkit";
import { useParticleNetwork } from "../hooks";
import { useState } from "react";
import * as ethers from "ethers";
import ConnectWallet from "./ConnectWallet";
import styles from "./styles/mint.module.css";
// import { SUPPORTED_TOKEN_TYPE } from "@particle-network/universal-account-sdk";

const MintComponent = () => {
  const { address, isConnected } = useAccount();
  const {
    universalAccount,
    smartAccountInfo,
    primaryAssets,
    deactivate,
    signMessage,
  } = useParticleNetwork();

  // Transaction state - stores the URL of the latest transaction
  const [transactionUrl, setTransactionUrl] = useState("");
  // Error state for displaying errors in UI
  const [error, setError] = useState("");
  // Loading state for transaction
  const [isLoading, setIsLoading] = useState(false);

  // === Send Cross-chain Transaction ===
  // !@DEV: this seems working fine
  /* const handleTransaction = async () => {
    // Safety check - all these are required for transactions
    if (!universalAccount || !isConnected) {
      console.error("Transaction prerequisites not met");
      return;
    }

      // Clear previous error and transaction URL
    setError("");
    setTransactionUrl("");
    setIsLoading(true);

    try {
      const contractAddress = "0x2361a02e6727Ff1798920186b8ACf0f100f621C0";
      const interf = new Interface(["function checkIn() public"]);

      const transaction = await universalAccount.createUniversalTransaction({
        chainId: 8453, // Base mainnet
        expectTokens: [],
        transactions: [
          {
            to: contractAddress,
            data: interf.encodeFunctionData("checkIn"),
            value: "0x0",
          },
        ],
      });

      const signature = await signMessage(transaction.rootHash);
      const sendResult = await universalAccount.sendTransaction(transaction, signature);

    console.log("sendResult", sendResult);
    console.log("explorer url", `https://universalx.app/activity/details?id=${sendResult.transactionId}`);
     console.log('TXID', sendResult.transactionId);
      setTransactionUrl(sendResult.transactionId);
    } catch (error: unknown) {
      console.error("Transaction failed:", error);
      
      // Extract meaningful error message
      let errorMessage = "Transaction failed. Please try again.";
      
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as Error).message;
      } else if (error && typeof error === 'object' && 'reason' in error) {
        errorMessage = (error as { reason: string }).reason;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }; */

  // !@DEV: this one is failing
  const handleMintTransaction = async () => {
    // Safety check - all these are required for transactions
    if (!universalAccount || !isConnected) {
      setError(
        "Transaction prerequisites not met. Please ensure wallet is connected.",
      );
      return;
    }

    // Clear previous error and transaction URL
    setError("");
    setTransactionUrl("");
    setIsLoading(true);

    try {
      const contractAddress = "0xc2d8a086f730036eb5578d890307f01133b0e22d";
      const interf = new ethers.utils.Interface([
        "function mint(string _uri, uint16 opType, bytes opRawData, bytes sellRawData)",
      ]);

      const transaction = await universalAccount.createUniversalTransaction({
        chainId: 8453, // Base mainnet
        expectTokens: [],
        transactions: [
          {
            to: contractAddress,
            data: interf.encodeFunctionData("mint(string,uint16,bytes,bytes)", [
              "QmcrYwRqKhvVGChTf1V8F4Ji3LjXmR5zABcnreGJ3gidQB/metadata.json",
              0,
              "0x",
              "0x",
            ]),
            value: "0x0",
          },
        ],
      });

      const signature = await signMessage(transaction.rootHash);
      const sendResult = await universalAccount.sendTransaction(
        transaction,
        signature,
      );

      console.log("TXID", sendResult.transactionId);
      setTransactionUrl(sendResult.transactionId);
    } catch (error: unknown) {
      console.error("Transaction failed:", error);

      // Extract meaningful error message
      let errorMessage = "Transaction failed. Please try again.";

      if (error && typeof error === "object" && "message" in error) {
        errorMessage = (error as Error).message;
      } else if (error && typeof error === "object" && "reason" in error) {
        errorMessage = (error as { reason: string }).reason;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // === Send USDT Transfer Transaction ===
  /* const handleTransferTransaction = async () => {
    // Safety check - ensure wallet is connected and UA is initialized
    if (!universalAccount || !isConnected) {
      console.error("Transaction prerequisites not met");
      return;
    }

    try {
      const transaction = await universalAccount.createTransferTransaction({
        token: {
          chainId: 42161, // Arbitrum mainnet
          address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        }, // USDT on Arbitrum
        amount: "0.1",
        receiver: "0x5C1885c0C6A738bAdAfE4dD811A26B546431aD89",
      });

      console.log("Transfer transaction created:", transaction);
      setTransactionUrl("Transfer transaction created - signing implementation needed");
    } catch (error) {
      console.error("Transfer transaction failed:", error);
    }
  }; */

  return (
    <main className={styles.container}>
      <div>
        {!isConnected ? (
          <ConnectWallet />
        ) : (
          <>
            {/* Connection Status */}
            <div className={styles.connectionStatus}>
              <div className={styles.addressContainer}>
                <h2>Owner Address (EOA)</h2>
                <p className={styles.address}>{address}</p>
              </div>
              <button onClick={deactivate} className={styles.disconnectButton}>
                Disconnect
              </button>
            </div>

            {/* Main Content Grid - Side by Side */}
            <div className={styles.mainGrid}>
              {/* Wallet Info Box */}
              <div className={styles.walletInfoCard}>
                <h2 className={styles.walletInfoTitle}>Wallet Information</h2>

                {/* Universal Account Addresses */}
                <div className={styles.infoSection}>
                  <h3 className={styles.sectionTitle}>
                    Universal Account Addresses
                  </h3>
                  <div className={styles.addressSection}>
                    <p className={styles.accountLabel}>EVM</p>
                    <p className={styles.accountAddress}>
                      {smartAccountInfo?.smartAccountAddress || "Loading..."}
                    </p>
                  </div>
                  <div className={styles.addressSection}>
                    <p className={styles.accountLabel}>Solana</p>
                    <p className={styles.accountAddress}>
                      {smartAccountInfo?.solanaSmartAccountAddress ||
                        "Loading..."}
                    </p>
                  </div>
                </div>

                {/* Universal Balance */}
                <div className={styles.infoSection}>
                  <h3 className={styles.sectionTitle}>Universal Balance</h3>
                  <p className={styles.balanceSubtitle}>
                    Aggregated primary assets from every chain
                  </p>
                  <p className={styles.balanceAmount}>
                    ${primaryAssets?.totalAmountInUSD?.toFixed(4) || "0.00"}
                  </p>
                </div>
              </div>

              {/* Contract Interaction Box */}
              <div className={styles.contractInteractionCard}>
                <h2 className={styles.contractTitle}>Contract Interactions</h2>

                {/* <div className={styles.actionCard}>
                  <h3 className={styles.actionTitle}>Custom Contract Call</h3>
                  <p className={styles.actionDescription}>
                    Send a cross-chain contract call to Base.
                  </p>
                  <button
                    onClick={handleTransaction}
                    disabled={!universalAccount}
                    className={styles.actionButton}
                  >
                    Send Custom Transaction
                  </button>
                </div>*/}

                <div className={styles.actionCard}>
                  <h3 className={styles.actionTitle}>Custom Contract Call</h3>
                  <p className={styles.actionDescription}>
                    Mint a free asset on custom deployed contract on Base
                    Mainnet
                  </p>
                  <button
                    onClick={handleMintTransaction}
                    disabled={!universalAccount || isLoading}
                    className={styles.actionButton}
                  >
                    {isLoading ? "Minting..." : "Mint Free Asset"}
                  </button>
                </div>

                {/* <div className={styles.actionCard}>
                  <h3 className={styles.actionTitle}>Transfer Transaction</h3>
                  <p className={styles.actionDescription}>
                    Send $0.1 USDT on Arbitrum using any token.
                  </p>
                  <button
                    onClick={handleTransferTransaction}
                    disabled={!universalAccount}
                    className={styles.actionButton}
                  >
                    Send Transfer Transaction
                  </button>
                </div> */}
              </div>
            </div>

            {/* Error Display - Shown Only If Error Exists */}
            {error && (
              <div className={styles.errorCard}>
                <p className={styles.errorLabel}>Error</p>
                <div className={styles.errorMessage}>{error}</div>
              </div>
            )}

            {/* Latest Transaction - Shown Only If Exists */}
            {transactionUrl && (
              <div className={styles.transactionCard}>
                <p className={styles.transactionLabel}>Latest Transaction</p>
                <div className={styles.transactionLink}>{transactionUrl}</div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default MintComponent;
