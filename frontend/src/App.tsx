import React from 'react';
import { Web3ReactProvider } from '@web3-react/core';
import { metamask, hooks } from './connectors/hooks';
import LoanDashboard from './LoanDashboard';

function App() {
  return (
    <Web3ReactProvider connectors={[[metamask, hooks]]}>
      <div>
        <h1>Lending Platform</h1>
        <LoanDashboard />
      </div>
    </Web3ReactProvider>
  );
}

export default App;