import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'

export default function Landing() {
    const { user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (user) {
            navigate('/dashboard')
        }
    }, [user, navigate])

    return (
        <div className="min-h-screen bg-background text-primaryText">
            {/* Header */}
            <header className="border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-accent">FlowMark</h1>
                    </div>
                    <Link
                        to="/login"
                        className="px-4 py-2 text-primaryText hover:text-accent transition"
                    >
                        Sign In
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-accent to-green-400 bg-clip-text text-transparent">
                    Organize Your Bookmarks
                    <br />
                    Like Never Before
                </h2>
                <p className="text-xl text-secondaryText mb-8 max-w-2xl mx-auto">
                    FlowMark helps you save, organize, and rediscover your favorite links with smart metadata extraction and intelligent tagging.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link
                        to="/signup"
                        className="px-8 py-4 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg transition text-lg"
                    >
                        Get Started Free
                    </Link>
                    <a
                        href="#features"
                        className="px-8 py-4 bg-surface hover:bg-gray-800 text-primaryText font-semibold rounded-lg transition text-lg"
                    >
                        Learn More
                    </a>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <h3 className="text-3xl font-bold text-center mb-12">Why FlowMark?</h3>
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="bg-surface p-8 rounded-lg hover:ring-2 hover:ring-accent transition">
                        <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <h4 className="text-xl font-semibold mb-2">Smart Auto-Tagging</h4>
                        <p className="text-secondaryText">
                            Automatically generate tags and descriptions using metadata extraction from web pages.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-surface p-8 rounded-lg hover:ring-2 hover:ring-accent transition">
                        <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                        </div>
                        <h4 className="text-xl font-semibold mb-2">Smart Organization</h4>
                        <p className="text-secondaryText">
                            Organize bookmarks with folders and tags. Find anything instantly with powerful search.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-surface p-8 rounded-lg hover:ring-2 hover:ring-accent transition">
                        <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h4 className="text-xl font-semibold mb-2">Works Offline</h4>
                        <p className="text-secondaryText">
                            Progressive Web App with offline support. Install on any device and access anywhere.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                <div className="bg-surface rounded-2xl p-12">
                    <h3 className="text-3xl font-bold mb-4">Ready to get organized?</h3>
                    <p className="text-secondaryText mb-8 text-lg">
                        Join thousands of users managing their bookmarks smarter.
                    </p>
                    <Link
                        to="/signup"
                        className="inline-block px-8 py-4 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg transition text-lg"
                    >
                        Start Free Today
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-800 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-secondaryText">
                    <p>&copy; 2026 FlowMark. Built with ❤️ for bookmark lovers.</p>
                </div>
            </footer>
        </div>
    )
}
