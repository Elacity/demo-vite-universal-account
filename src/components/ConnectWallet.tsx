import { ConnectButton } from "@particle-network/connectkit";
import styles from "./styles/connect.module.css";

const ConnectWallet = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Universal Accounts Demo</h1>
        <p className={styles.subtitle}>Particle ConnectKit + Universal Accounts</p>
      </div>

      <div className={styles.connectCard}>
        <p className={styles.connectDescription}>
          Connect your wallet to get started with Universal Accounts
        </p>
        <div className={styles.buttonWrapper}>
          <ConnectButton />
        </div>
      </div>
    </div>
  );
};

export default ConnectWallet;
