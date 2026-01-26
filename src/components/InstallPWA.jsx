import { useState, useEffect } from 'react'

export default function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [showInstallPrompt, setShowInstallPrompt] = useState(false)

    useEffect(() => {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('Service Worker registered:', reg))
                .catch(err => console.error('Service Worker registration failed:', err))
        }

        const handler = (e) => {
            console.log('beforeinstallprompt event fired')
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault()
            // Stash the event so it can be triggered later
            setDeferredPrompt(e)
            // Show the install prompt
            setShowInstallPrompt(true)
        }

        window.addEventListener('beforeinstallprompt', handler)

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('App is already installed')
            setShowInstallPrompt(false)
        }

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            console.log('No deferred prompt available')
            return
        }

        // Show the install prompt
        deferredPrompt.prompt()

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice

        console.log(`User response to the install prompt: ${outcome}`)

        // Clear the deferredPrompt
        setDeferredPrompt(null)
        setShowInstallPrompt(false)
    }

    const handleDismiss = () => {
        setShowInstallPrompt(false)
        // Store dismissal in localStorage to not show again for a while
        localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }

    // Don't show if recently dismissed
    useEffect(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed')
        if (dismissed) {
            const dismissedTime = parseInt(dismissed)
            const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
            if (daysSinceDismissed < 7) {
                setShowInstallPrompt(false)
            }
        }
    }, [])

    if (!showInstallPrompt) return null

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-surface border border-accent rounded-lg shadow-2xl p-4 z-50 animate-slide-up">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-primaryText mb-1">Install FlowMark</h3>
                    <p className="text-sm text-secondaryText mb-4">
                        Install FlowMark on your device for quick access and offline support.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleInstallClick}
                            className="px-4 py-2 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg transition text-sm"
                        >
                            Install
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="px-4 py-2 bg-background hover:bg-gray-800 text-secondaryText hover:text-primaryText rounded-lg transition text-sm"
                        >
                            Not now
                        </button>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 text-secondaryText hover:text-primaryText transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
