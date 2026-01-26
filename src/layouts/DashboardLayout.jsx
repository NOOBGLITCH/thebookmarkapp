import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <main
                className={`flex-1 overflow-auto transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}
            >
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="fixed top-4 left-4 z-50 p-2 bg-surface border border-gray-700 rounded-lg text-secondaryText hover:text-white shadow-lg"
                        title="Open Menu"
                    >
                        <span className="material-icons-round">menu</span>
                    </button>
                )}
                <Outlet />
            </main>
        </div>
    )
}
