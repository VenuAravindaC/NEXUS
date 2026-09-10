import { Navigate } from 'react-router-dom'
import { useUser, SignIn } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'

// Clerk's hosted SignIn renders white/gray by default — that clash was the
// "plain gray" you saw.
//
// HOW THE THEME LAYERS:
// 1. baseTheme (dark) — flips every component to dark mode (inputs, focus rings,
//    dividers, OAuth button backgrounds, etc.) using classic v6 token names.
// 2. variables — override brand-level colors (red accent, CUE's black bg).
// 3. elements — target SPECIFIC component slots that don't fully respect the
//    variables. This is the escape hatch: header title, OAuth button text,
//    divider color, footer links — each gets a direct CSS style.
const CLERK_THEME = {
    baseTheme: dark,
    variables: {
        colorPrimary: '#dc2626',        // CUE accent red (Continue button, links)
        colorBackground: '#0a0a0a',     // deep black (matches LandingPage)
        colorInputBackground: '#1a1a1a', // input field background
        colorText: '#ffffff',           // fallback white text everywhere
        colorNeutral: '#374151',        // borders & dividers (gray-700)
    },
    // elements: map component slot names → CSS property objects.
    // Not every slot works in every version — harmless if ignored.
    elements: {
        // Card
        card: { borderRadius: '0.75rem' },

        // Header
        headerTitle: { color: '#ffffff', fontWeight: '700' },
        headerSubtitle: { color: '#9ca3af' },

        // OAuth provider buttons
        socialButtonsBlockButton: {
            backgroundColor: '#111111',
            border: '1px solid #262626',
            color: '#ffffff',
            minHeight: '44px',
        },
        socialButtonsBlockButtonText: { color: '#ffffff', fontWeight: '500' },

        // "or" divider
        dividerLine: { backgroundColor: '#262626' },
        dividerText: { color: '#6b7280' },

        // Form fields
        formFieldLabel: { color: '#e5e7eb' },
        formFieldInput: {
            backgroundColor: '#1a1a1a',
            border: '1px solid #374151',
            color: '#ffffff',
            minHeight: '44px',
        },

        // Continue button
        formButtonPrimary: {
            backgroundColor: '#dc2626',
            minHeight: '44px',
            fontSize: '0.9375rem',
            fontWeight: '600',
        },

        // Footer ("Don't have an account?")
        footerAction: { marginTop: '0.5rem' },
        footerActionText: { color: '#9ca3af' },
        footerActionLink: { color: '#dc2626', fontWeight: '500' },

        // "Development mode" / "Secured by Clerk" badges
        badge: { color: '#6b7280' },
    },
}

function LoginPage() {
    // Clerk is still working out the auth state while loading.
    // We must NOT render <SignIn/> yet — showing it too early (or to a
    // signed-in user) is exactly what caused the redirect loop.
    const { isLoaded, isSignedIn } = useUser()

    // Already signed in? There's nothing to sign in for. Go straight to the app.
    // This must happen BEFORE <SignIn/> ever renders, or Clerk force-redirects
    // us in a loop.
    if (isLoaded && isSignedIn) {
        return <Navigate to="/dashboard" replace />
    }

    // Still loading → show nothing (a spinner) rather than flashing the form.
    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
            </div>
        )
    }

    // Signed out → this is the only time <SignIn/> is valid.
    return (
        <div className="flex items-center justify-center min-h-screen">
            <SignIn appearance={CLERK_THEME} />
        </div>
    )
}

export default LoginPage
