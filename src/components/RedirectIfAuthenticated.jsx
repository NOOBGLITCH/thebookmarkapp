import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RedirectIfAuthenticated({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-secondaryText text-sm font-medium">Loading...</div>
                </div>
            </div>
        )
    }

    if (user) {
        return <Navigate to="/dashboard" replace />
    }

    return children
}
