import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn } = useAuth()
    const navigate = useNavigate()
    const isFetchError = error && (error === 'FETCH_FAILED' || error.includes('fetch') || error.includes('Network'))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { error } = await signIn(email, password)

        if (error) {
            setError(error.message || String(error))
            setLoading(false)
        } else {
            navigate('/dashboard')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-full max-w-md p-8 bg-surface rounded-lg shadow-xl">
                <h1 className="text-3xl font-bold text-center mb-2 text-accent">FlowMark</h1>
                <p className="text-center text-secondaryText mb-8">Sign in to your account</p>

                {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm space-y-2">
                        {isFetchError ? (
                            <>
                                <p className="font-semibold">Cannot reach Supabase (failed to fetch)</p>
                                <ul className="list-disc list-inside text-xs space-y-1 text-secondaryText">
                                    <li>Set <code className="bg-black/20 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-black/20 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in <code className="bg-black/20 px-1 rounded">.env</code> (see <code className="bg-black/20 px-1 rounded">.env.example</code>)</li>
                                    <li>Restart dev server</li>
                                    <li><a href="https://supabase.com/dashboard/project/ezikhcxhnjlehfqclthn" target="_blank" rel="noopener noreferrer" className="text-accent underline">Dashboard</a> → resume project if paused</li>
                                </ul>
                            </>
                        ) : (
                            error
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 bg-background border border-gray-700 rounded focus:outline-none focus:border-accent text-primaryText"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-2">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.ctrlKey && e.key.toLowerCase() === 'a') {
                                    e.preventDefault()
                                    e.target.select()
                                }
                            }}
                            required
                            autoComplete="current-password"
                            className="w-full px-4 py-2 bg-background border border-gray-700 rounded focus:outline-none focus:border-accent text-primaryText"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-accent hover:bg-accent/90 text-white font-semibold rounded transition disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="mt-6 text-center text-secondaryText text-sm">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-accent hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    )
}
