
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { CurrencyProvider } from './contexts/CurrencyContext'

// Update the document title
document.title = '2K AI Accounting Systems'

// Create a meta description
const metaDescription = document.createElement('meta')
metaDescription.name = 'description'
metaDescription.content = '2K AI Accounting Systems - Smart financial management for your business'
document.head.appendChild(metaDescription)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CurrencyProvider>
      <App />
    </CurrencyProvider>
  </React.StrictMode>,
)

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('SW registered: ', registration.scope)
      },
      (error) => {
        console.log('SW registration failed: ', error)
      }
    )
  })
}
