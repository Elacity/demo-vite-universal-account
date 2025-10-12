import "./App.css";
import ConnectorProvider from "./contexts/Provider";
import { LitActionProvider } from "./contexts/LitActionContext";
import MintComponent from "./components/TransactionComponent";
import LitComponent from "./components/LitComponent";

function App() {
  return (
    <>
      <div>
        <ConnectorProvider>
          <MintComponent />
          <LitActionProvider network={import.meta.env.VITE_LIT_NETWORK || "datil"}>
            <LitComponent />
          </LitActionProvider>
        </ConnectorProvider>
      </div>
    </>
  );
}

export default App;
