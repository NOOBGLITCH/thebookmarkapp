import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const { signUp, signInWithGoogle, user } = useAuth()
    const navigate = useNavigate()
    const isFetchError = error === 'FETCH_FAILED' || (error && (error.includes('fetch') || error.includes('Network')))

    useEffect(() => {
        if (user) {
            navigate('/dashboard')
        }
    }, [user, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            return setError('Passwords do not match')
        }

        if (password.length < 6) {
            return setError('Password must be at least 6 characters')
        }

        setLoading(true)

        const { error } = await signUp(email, password)

        if (error) {
            setError(error.message || String(error))
            setLoading(false)
        } else {
            setSuccess(true)
            setLoading(false)
            setTimeout(() => navigate('/login'), 2000)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-full max-w-md p-8 bg-surface rounded-lg shadow-xl">
                <h1 className="text-3xl font-bold text-center mb-2 text-accent">FlowMark</h1>
                <p className="text-center text-secondaryText mb-8">Create your account</p>

                {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm space-y-2">
                        {isFetchError ? (
                            <>
                                <p className="font-semibold">Cannot reach Supabase (failed to fetch)</p>
                                <p className="text-secondaryText text-xs">Try in order:</p>
                                <ul className="list-disc list-inside text-xs space-y-1 text-secondaryText">
                                    <li>Create <code className="bg-black/20 px-1 rounded">.env</code> or <code className="bg-black/20 px-1 rounded">.env.local</code> in the project root (copy from <code className="bg-black/20 px-1 rounded">.env.example</code>)</li>
                                    <li>Set <code className="bg-black/20 px-1 rounded">VITE_SUPABASE_URL</code> to <code className="bg-black/20 px-1 rounded">https://ezikhcxhnjlehfqclthn.supabase.co</code></li>
                                    <li>Set <code className="bg-black/20 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> from Dashboard → Settings → API → anon public</li>
                                    <li>Restart dev server (<code className="bg-black/20 px-1 rounded">npm run dev</code>)</li>
                                    <li>If project is paused: <a href="https://supabase.com/dashboard/project/ezikhcxhnjlehfqclthn" target="_blank" rel="noopener noreferrer" className="text-accent underline">Open Dashboard</a> and resume project</li>
                                </ul>
                            </>
                        ) : (
                            error
                        )}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500 rounded text-green-500 text-sm">
                        Account created! Redirecting to login...
                    </div>
                )}

                <button
                    onClick={() => signInWithGoogle()}
                    className="w-full py-3 mb-4 bg-white text-gray-900 font-semibold rounded flex items-center justify-center gap-2 hover:bg-gray-100 transition"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#EA4335"
                            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.065 0 12 0 7.37 0 3.376 2.67 1.675 6.505l3.591 3.26z"
                        />
                        <path
                            fill="#34A853"
                            d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-3.607 2.87C4.269 21.045 7.854 24 12 24c4.936 0 9.023-2.607 11.108-6.505l-3.416-2.906c-.848 1.417-2.158 2.637-3.652 3.424z"
                        />
                        <path
                            fill="#4A90E2"
                            d="M19.834 21.495A12.029 12.029 0 0 0 24 12c0-.66-.057-1.325-.17-1.996H12v3.992h6.805a5.957 5.957 0 0 1-2.288 3.398l3.317 4.101z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.675 6.505A11.986 11.986 0 0 0 0 12c0 1.92.445 3.73 1.237 5.388l4.04-3.12z"
                        />
                    </svg>
                    Sign in with Google
                </button>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-surface text-secondaryText">Or continue with</span>
                    </div>
                </div>

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
                            autoComplete="new-password"
                            className="w-full px-4 py-2 bg-background border border-gray-700 rounded focus:outline-none focus:border-accent text-primaryText"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.ctrlKey && e.key.toLowerCase() === 'a') {
                                    e.preventDefault()
                                    e.target.select()
                                }
                            }}
                            required
                            autoComplete="new-password"
                            className="w-full px-4 py-2 bg-background border border-gray-700 rounded focus:outline-none focus:border-accent text-primaryText"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || success}
                        className="w-full py-3 bg-accent hover:bg-accent/90 text-white font-semibold rounded transition disabled:opacity-50"
                    >
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="mt-6 text-center text-secondaryText text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-accent hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
