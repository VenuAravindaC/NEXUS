import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { registerSW } from 'virtual:pwa-register'
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

// Register the service worker (for push + PWA) through the plugin's virtual
// module. This is the important part: in DEV the plugin serves the compiled
// worker at /dev-sw.js (NOT /sw.js — that path would fall through to the SPA
// and fail with a MIME type error). In PROD it's /sw.js. registerSW() picks
// the right path for whichever environment we're in, automatically.
registerSW({ immediate: true })
