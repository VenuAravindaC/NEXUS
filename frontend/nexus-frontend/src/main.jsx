import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider} from '@clerk/react'
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
    <App />
    </ClerkProvider>
  </StrictMode>,
)

// Register the service worker (for push + PWA). vite-plugin-pwa injects a
// tiny bootstrap that fetches/registers our compiled sw.js — but only when
// the browser supports service workers (double-checking; push.js already
// guards, but a redundant fallback can't hurt).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err)
    })
  })
}
