import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
    const { user, signOut } = useAuth()

    const handleSignOut = async () => {
        await signOut()
    }

    return (
        <div className="min-h-screen bg-background text-primaryText p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-accent">FlowMark Dashboard</h1>
                    <button
                        onClick={handleSignOut}
                        className="px-4 py-2 bg-surface hover:bg-surface/80 rounded transition"
                    >
                        Sign Out
                    </button>
                </div>

                <div className="bg-surface p-6 rounded-lg">
                    <h2 className="text-2xl font-semibold mb-4">Welcome!</h2>
                    <p className="text-secondaryText">Logged in as: {user?.email}</p>
                    <p className="text-secondaryText mt-4">
                        Dashboard features coming soon...
                    </p>
                </div>
            </div>
        </div>
    )
}
