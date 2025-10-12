import React, { useState, useContext } from "react";
import { ParticleNetworkContext } from "../contexts/ParticleNetworkContext";
import LitActionContext from "../contexts/LitActionContext";

const useLitAction = () => React.useContext(LitActionContext);

// Inline styles
const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
  },
  formGroup: {
    marginBottom: "15px",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    boxSizing: "border-box" as const,
  },
  textarea: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    boxSizing: "border-box" as const,
    height: "200px",
    resize: "vertical" as const,
  },
  code: {
    backgroundColor: "#808080",
    color: "#f4f4f4",
    fontFamily: "monospace",
  },
  button: {
    backgroundColor: "#007bff",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    marginRight: "10px",
  },
  buttonSecondary: {
    backgroundColor: "#8c16b0",
  },
  form: {
    marginBottom: "20px",
  },
  output: {
    textAlign: "left" as const,
    backgroundColor: "#f8f9fa",
    border: "1px solid #dee2e6",
    borderRadius: "4px",
    padding: "15px",
    marginTop: "20px",
    whiteSpace: "pre-wrap" as const,
    maxHeight: "400px",
    overflowY: "auto" as const,
  },
  status: {
    padding: "10px",
    margin: "10px 0",
    borderRadius: "4px",
  },
  statusSuccess: {
    backgroundColor: "#d4edda",
    border: "1px solid #c3e6cb",
    color: "#155724",
  },
  statusError: {
    backgroundColor: "#f8d7da",
    border: "1px solid #f5c6cb",
    color: "#721c24",
  },
  statusInfo: {
    backgroundColor: "#d1ecf1",
    border: "1px solid #bee5eb",
    color: "#0c5460",
  },
  radioGroup: {
    display: "flex",
    alignItems: "left",
    flexDirection: "column",
    textAlign: "left",
    margin: "10px auto",
    width: "320px",
  },
};

interface DecryptionPayload {
  kid: string;
  ciphertext: string;
  hash: string;
}

const LitComponent: React.FC = () => {
  const { account, smartAccountInfo } = useContext(ParticleNetworkContext);
  const [sessionType, setSelectedOption] = useState<string>("pkp");

  const handleSessionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
  };

  const {
    session: currentSession,
    isLitReady,
    isCreatingSession,
    isDecrypting,
    output,
    createSession,
    executeAction,
    decryptCEK,
  } = useLitAction();

  // Form state
  const [publicKey, setPublicKey] = useState("");
  const [payload, setPayload] = useState<Partial<DecryptionPayload>>({
    kid: "0xa7176a694dd8496b98a17ee1ad2b44f6",
    //ciphertext: 'odd1VexEnNYKTHuf0MTfTCKxLjkmBuusUYc+aF1CZDNkpoMqtkMt2JioZmqbcB6q7l2j8oH/1+IwSGKk4RnqULq6rpUT55lrAyIst00ni/og6/ET5FYRTFwkwOLjQgbO3i1KQ/UVJumdMQh3RK/ek6U',
    //hash: '863d3167a1903bf8f2d4e6ca52584a896c79dfddf36397b20ad8bcba5480feab',
    ciphertext:
      "rzL42PVVjn9zM5v6s4S2mRKduXpZ/y7ynzl6L0Od0itd00koduyR2ZZDu0Jz4zh0lPLW2oEul8irBAcwGJ9HSW8PGQl3Gh9hZCVTuXuJ1zAgRwt+gemQcTuH4kjuReINkVm3235LQ3Sl+eoTQUpWUioC",
    hash: "e2a3023912c008588fef13acce1276e50eaf68b5e0aec2025d2cee7cf8db1672",
  });

  // Handle Lit Action execution
  const handleDecrypt = React.useCallback(async () => {
    if (!isLitReady) {
      alert("Lit Protocol is not ready yet. Please wait.");
      return;
    }
    const { kid, ciphertext, hash } = payload as DecryptionPayload;
    await decryptCEK?.(kid, ciphertext, hash);
  }, [decryptCEK, isLitReady, payload]);

  if (!account || !smartAccountInfo?.smartAccountAddress) {
    return null;
  }

  return (
    <div style={styles.container}>
      <h2>Lit Protocol Decryption</h2>

      {/* Session Management */}
      <div style={styles.formGroup}>
        <h3>Session Management</h3>
        <div
          style={{
            ...styles.status,
            ...(currentSession ? styles.statusSuccess : styles.statusInfo),
          }}
        >
          {currentSession
            ? `Session active until: ${new Date(currentSession.expiration).toLocaleString()}`
            : "No session"}
        </div>
        {!currentSession && (
          <>
            <div
              style={
                {
                  ...styles.formGroup,
                  ...styles.radioGroup,
                } as React.CSSProperties
              }
            >
              <div>
                <input
                  type="radio"
                  id="straight"
                  name="myRadioGroup" // Same name for all radio buttons in the group
                  value="straight"
                  checked={sessionType === "straight"} // Controlled by state
                  onChange={handleSessionChange}
                />
                <label htmlFor="straight">Straight (via web3 connector)</label>
              </div>

              <div>
                <input
                  type="radio"
                  id="pkp"
                  name="myRadioGroup"
                  value="pkp"
                  checked={sessionType === "pkp"}
                  onChange={handleSessionChange}
                />
                <label htmlFor="pkp">Using PKP</label>
              </div>

              <div>
                <input
                  type="radio"
                  id="lit-action"
                  name="myRadioGroup"
                  value="lit-action"
                  checked={sessionType === "lit-action"}
                  onChange={handleSessionChange}
                />
                <label htmlFor="lit-action">Using Lit Action (via PKP)</label>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                createSession?.(sessionType);
              }}
              disabled={!account || !!currentSession || isCreatingSession}
              style={styles.button}
            >
              {isCreatingSession
                ? "Creating Session..."
                : currentSession
                  ? "Session Active"
                  : "Create Session"}
            </button>
          </>
        )}
      </div>

      {Boolean(currentSession) && (
        <>
          {/* Decryption Form */}
          <form onSubmit={handleDecrypt} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Payload:</label>
              <textarea
                value={JSON.stringify(payload, null, 2)}
                onChange={(e) => {
                  try {
                    setPayload(JSON.parse(e.target.value));
                  } catch (e) {
                    console.warn("Failed to parse json payload", e);
                  }
                }}
                placeholder="Enter the entire payload {kid, hash, ciphertext,...}"
                required
                style={{ ...styles.textarea, ...styles.code }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Remote Public Key:</label>
              <input
                type="text"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="Enter the remote public key"
                style={styles.input}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                executeAction?.(
                  `(async () => {
                        console.log("Lit.Auth", Lit.Auth);
                                              
                        // 1. Decrypt the CEK using Lit's access control
                        const cek = await Lit.Actions.decryptAndCombine({
                          accessControlConditions: [
                            {
                              conditionType: "evmBasic",
                              contractAddress: "ipfs://QmWCdA2DeqdBSoUJbTLJiuaobKD9PYqExKkVRFJetzxW5E",
                              standardContractType: "LitAction",
                              chain: chain,
                              method: "hasAccessByContentId",
                              parameters: [":userAddress", kid, authority, rpc],
                              returnValueTest: { comparator: "=", value: "true" }
                            },
                          ],
                          ciphertext: ciphertext,
                          dataToEncryptHash: dataToEncryptHash,
                          chain: chain,
                        });

                        Lit.Actions.setResponse({
                          response: JSON.stringify({ cek, publicKey, saAddress, address: userAddress, ...Lit.Auth.authMethodContexts }),
                        });
                      })()`,
                  payload,
                );
              }}
              disabled={!currentSession || isDecrypting}
              style={{ ...styles.button, ...styles.buttonSecondary }}
            >
              Decrypt with Lit Action
            </button>
          </form>
        </>
      )}

      {/* Output Display */}
      {output && (
        <div
          style={{
            ...styles.output,
            ...(output.match(/Lit Action decryption failed/i) &&
              styles.statusError),
          }}
        >
          {output}
        </div>
      )}
    </div>
  );
};

LitComponent.displayName = "LitComponent";

export default LitComponent;
