import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Import F7 Bundle
import Framework7 from 'framework7/bundle';
import 'framework7/css/bundle';

// Import F7-React Plugin
import Framework7React from 'framework7-react';

// Init F7-React Plugin
Framework7.use(Framework7React);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
