import { Navigate } from 'react-router-dom'
import { useUser, SignIn } from '@clerk/react'

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
            <SignIn />
        </div>
    )
}

export default LoginPage
