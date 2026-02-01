import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { Rocket, Zap, Tag, Shield, Smartphone, Share2, Search, ArrowRight, Github, PlayCircle, Bookmark } from 'lucide-react'

export default function Landing() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        if (user) {
            navigate('/dashboard')
        }
    }, [user, navigate])

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div className="min-h-screen bg-background text-primaryText font-sans selection:bg-accent selection:text-white overflow-x-hidden">

            {/* Navbar */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-surface/95 backdrop-blur-md shadow-lg border-b border-gray-800 py-3' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
                            <Bookmark className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">FlowMark</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <a href="#features" className="hidden md:block text-secondaryText hover:text-white transition font-medium">Features</a>
                        <a href="#how-it-works" className="hidden md:block text-secondaryText hover:text-white transition font-medium">How it Works</a>
                        <Link to="/login" className="px-5 py-2.5 rounded-lg font-semibold hover:bg-surface transition border border-transparent hover:border-gray-700">Sign In</Link>
                        <Link to="/signup" className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg shadow-lg shadow-accent/20 transition hover:-translate-y-0.5">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 md:pt-48 md:pb-32 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-accent/10 rounded-full blur-[120px] -z-10"></div>
                <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-gray-700 mb-8 animate-fade-in-up">
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                        <span className="text-sm font-medium text-secondaryText">New: Ultra-fast Metadata Extraction ⚡</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight leading-tight">
                        Your Second Brain for <br />
                        <span className="bg-gradient-to-r from-accent via-green-400 to-blue-500 bg-clip-text text-transparent animate-gradient-x">Digital Chaos</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-secondaryText mb-12 max-w-3xl mx-auto leading-relaxed">
                        Stop losing links in endless tabs. FlowMark uses
                        <span className="text-white font-semibold"> smart AI</span> to auto-tag, organize,
                        and retrieve your bookmarks instantly.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                        <Link to="/signup" className="w-full sm:w-auto px-8 py-4 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl shadow-xl shadow-accent/30 transition hover:scale-105 flex items-center justify-center gap-3">
                            <Rocket className="w-5 h-5" />
                            Start Organizing Free
                        </Link>
                        <a href="#demo" className="w-full sm:w-auto px-8 py-4 bg-surface border border-gray-700 hover:bg-gray-800 text-white font-bold rounded-xl transition hover:scale-105 flex items-center justify-center gap-3">
                            <PlayCircle className="w-5 h-5" />
                            Watch Demo
                        </a>
                    </div>

                    {/* Stats / Trust */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t border-gray-800 pt-12 opacity-80">
                        <div>
                            <div className="text-3xl font-bold text-white mb-1">10k+</div>
                            <div className="text-sm text-secondaryText uppercase tracking-wider">Links Saved</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white mb-1">0.1s</div>
                            <div className="text-sm text-secondaryText uppercase tracking-wider">Fetch Speed</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white mb-1">100%</div>
                            <div className="text-sm text-secondaryText uppercase tracking-wider">Privacy</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white mb-1">Offline</div>
                            <div className="text-sm text-secondaryText uppercase tracking-wider">Support</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-surface/30 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
                        <p className="text-secondaryText text-xl max-w-2xl mx-auto">
                            Powerful features wrapped in a beautiful, minimalist design.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-surface p-8 rounded-2xl border border-gray-800 hover:border-accent/50 hover:bg-gray-800/50 transition group">
                            <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Zap className="text-blue-500 w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Superfast Extraction</h3>
                            <p className="text-secondaryText leading-relaxed">
                                Paste a link and watch magic happen. We extract titles, descriptions, and high-res images in milliseconds.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-surface p-8 rounded-2xl border border-gray-800 hover:border-accent/50 hover:bg-gray-800/50 transition group">
                            <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Tag className="text-accent w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Smart Auto-Tagging</h3>
                            <p className="text-secondaryText leading-relaxed">
                                No more manual sorting. Our logic automatically categorizes links like 'Dev', 'News', or 'Design' for you.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-surface p-8 rounded-2xl border border-gray-800 hover:border-accent/50 hover:bg-gray-800/50 transition group">
                            <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Shield className="text-purple-500 w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Privacy First</h3>
                            <p className="text-secondaryText leading-relaxed">
                                Your data lives in your secure database. No tracking pixels, no ad targeting, just your personal library.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-surface p-8 rounded-2xl border border-gray-800 hover:border-accent/50 hover:bg-gray-800/50 transition group">
                            <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Smartphone className="text-yellow-500 w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">PWA & Offline Ready</h3>
                            <p className="text-secondaryText leading-relaxed">
                                Install as a native app on iOS, Android, or Desktop. Access your library even when offline.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-surface p-8 rounded-2xl border border-gray-800 hover:border-accent/50 hover:bg-gray-800/50 transition group">
                            <div className="w-14 h-14 bg-pink-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Share2 className="text-pink-500 w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Share & Collaborate</h3>
                            <p className="text-secondaryText leading-relaxed">
                                Create public links for folders or tags. Share your curated 'Reading List' or 'Dev Tools' with one click.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-surface p-8 rounded-2xl border border-gray-800 hover:border-accent/50 hover:bg-gray-800/50 transition group">
                            <div className="w-14 h-14 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Search className="text-cyan-500 w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Instant Search</h3>
                            <p className="text-secondaryText leading-relaxed">
                                Fuzzy search across titles, URLs, and tags. Find that one article you saved years ago in &lt; 0.1s.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works Section */}
            <section id="how-it-works" className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold mb-4">Effortless Workflow</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-gradient-to-r from-gray-800 via-accent to-gray-800 -z-10 opacity-30"></div>

                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="w-24 h-24 bg-surface border-4 border-background rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl relative z-10">
                                <span className="text-4xl font-bold text-accent">1</span>
                            </div>
                            <h3 className="text-xl font-bold mb-4">Paste Link</h3>
                            <p className="text-secondaryText">Just drop a URL instantly. We handle the rest.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="w-24 h-24 bg-surface border-4 border-background rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl relative z-10">
                                <span className="text-4xl font-bold text-blue-500">2</span>
                            </div>
                            <h3 className="text-xl font-bold mb-4">Auto-Process</h3>
                            <p className="text-secondaryText">Our engine fetches metadata and tags it intelligently.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="w-24 h-24 bg-surface border-4 border-background rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl relative z-10">
                                <span className="text-4xl font-bold text-green-500">3</span>
                            </div>
                            <h3 className="text-xl font-bold mb-4">Forever Yours</h3>
                            <p className="text-secondaryText">Stored securely. Searchable instantly. Available offline.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <section className="py-24 bg-gradient-to-t from-accent/10 to-transparent">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to tame the web?</h2>
                    <p className="text-xl text-secondaryText mb-10">
                        Join the future of bookmarking. Open source, fast, and privacy-focused.
                    </p>
                    <Link to="/signup" className="px-10 py-5 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition shadow-xl text-lg inline-flex items-center gap-2">
                        Get Started Now
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-800 py-12 bg-surface/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Bookmark className="text-accent w-6 h-6" />
                        <span className="font-bold text-xl">FlowMark</span>
                    </div>

                    <div className="flex gap-8 text-secondaryText text-sm">
                        <a href="#" className="hover:text-white transition">Privacy</a>
                        <a href="#" className="hover:text-white transition">Terms</a>
                        <a href="https://github.com/NOOBGLITCH/thebookmarkapp" target="_blank" rel="noreferrer" className="hover:text-white transition flex items-center gap-2">
                            <Github className="w-4 h-4" />
                            GitHub
                        </a>
                    </div>

                    <div className="text-secondaryText text-sm">
                        &copy; {new Date().getFullYear()} FlowMark
                    </div>
                </div>
            </footer>
        </div>
    )
}
