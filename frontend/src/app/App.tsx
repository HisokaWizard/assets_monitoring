import React from 'react';
import { Providers } from './providers';

export const App: React.FC = () => {
  return (
    <Providers>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Assets Monitoring</h1>
        <p>Frontend application initialized successfully!</p>
        <p>Edit <code>src/app/App.tsx</code> to get started.</p>
      </div>
    </Providers>
  );
};
