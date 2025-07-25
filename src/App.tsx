import './App.css'
import ConnectorProvider from './contexts/Provider'
import MintComponent from './components/TransactionComponent'

function App() {
  return (
    <>
      <div>
        <ConnectorProvider>
          <MintComponent />
        </ConnectorProvider>
      </div>
    </>
  )
}

export default App
