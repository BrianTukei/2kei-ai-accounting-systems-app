
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { CurrencyProvider } from './contexts/CurrencyContext'
import AuthCheck from './components/auth/AuthCheck.tsx'

// Update the document title
document.title = '2KÉI Ledgery Accounting'

// Create a meta description
const metaDescription = document.createElement('meta')
metaDescription.name = 'description'
metaDescription.content = '2KÉI Ledgery Accounting - Smart financial management for your business'
document.head.appendChild(metaDescription)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CurrencyProvider>
      <AuthCheck>
        <App />
      </AuthCheck>
    </CurrencyProvider>
  </React.StrictMode>,
)
