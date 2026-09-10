/**
 * LandingPage.jsx — CUE's public marketing page.
 *
 * Shown at / when the user is NOT signed in. If they ARE signed in,
 * redirects straight to /dashboard. This is the "storefront" — the
 * first thing a new visitor sees.
 *
 * Design reference: CHRONO-style dark minimalism.
 * Bold headline with red accent, clean feature cards, no clutter.
 * Fully responsive (mobile-first), keyboard-navigable, aria-labeled.
 */

import { useAuth } from '@clerk/clerk-react'
import { Link, Navigate } from 'react-router-dom'
import { Bell, Clock, MapPin, ArrowRight } from 'lucide-react'

const features = [
    {
        icon: Clock,
        title: 'Time-Based Reminders',
        desc: 'Set it and forget it. CUE fires a system notification the moment your reminder is due — even if the tab is closed.',
    },
    {
        icon: MapPin,
        title: 'Location-Based Reminders',
        desc: 'Walk into a place, get the reminder. GPS-powered geofencing delivers the right nudge at the right place.',
    },
    {
        icon: Bell,
        title: 'Push Notifications',
        desc: 'Native browser notifications that reach you across devices. No email, no Slack — just a clean, direct ping.',
    },
]

function LandingPage() {
    const { isLoaded, isSignedIn } = useAuth()

    // Still figuring out auth state — render nothing to avoid flash
    if (!isLoaded) return null

    // Already signed in → skip the landing page, go to the app
    if (isSignedIn) return <Navigate to="/dashboard" replace />

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* ─── Nav ─── */}
            <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                        <Bell size={16} className="text-white" aria-hidden="true" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white">CUE</span>
                </div>
                <Link
                    to="/login"
                    className="text-sm font-medium bg-white text-black px-5 py-2.5 rounded-lg hover:bg-gray-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Open CUE app"
                >
                    Open App
                </Link>
            </nav>

            {/* ─── Hero ─── */}
            <section className="max-w-4xl mx-auto px-6 pt-24 pb-32 text-center animate-fadeIn">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] text-white">
                    Reminders that
                    <br />
                    <span className="text-red-600">cut through</span> the noise.
                </h1>
                <p className="mt-6 text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
                    Time-based. Location-based. Delivered the moment you need them —
                    even when CUE is closed.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-7 py-3.5 rounded-lg font-medium hover:bg-red-700 transition-colors min-h-[44px] w-full sm:w-auto"
                        aria-label="Get started with CUE"
                    >
                        Get Started
                        <ArrowRight size={18} aria-hidden="true" />
                    </Link>
                    <a
                        href="#features"
                        className="inline-flex items-center justify-center gap-2 border border-gray-700 text-white px-7 py-3.5 rounded-lg font-medium hover:border-gray-500 transition-colors min-h-[44px] w-full sm:w-auto"
                        aria-label="See CUE features"
                    >
                        See Features
                    </a>
                </div>
            </section>

            {/* ─── Features ─── */}
            <section id="features" className="max-w-6xl mx-auto px-6 pb-24">
                <h2 className="sr-only">Core Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((f) => (
                        <div
                            key={f.title}
                            className="bg-[#111111] border border-gray-800/60 rounded-xl p-6 hover:border-gray-700 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-lg bg-red-600/10 flex items-center justify-center mb-4">
                                <f.icon size={20} className="text-red-500" aria-hidden="true" />
                            </div>
                            <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="border-t border-gray-800/60 py-8 text-center text-sm text-gray-500">
                <p>CUE — Smart Reminders</p>
            </footer>
        </div>
    )
}

export default LandingPage
