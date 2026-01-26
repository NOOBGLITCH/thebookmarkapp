import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import FolderManager from './FolderManager'
import TagSidebar from './TagSidebar'

export default function Sidebar({ isOpen, setIsOpen }) {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()
    const [selectedTag, setSelectedTag] = useState(null)
    const [selectedFolder, setSelectedFolder] = useState(null)

    const handleLogout = async () => {
        await signOut()
        navigate('/login')
    }

    const handleSelectTag = (tagName) => {
        setSelectedTag(tagName)
        window.dispatchEvent(new CustomEvent('filterByTag', { detail: tagName }))
    }

    const handleSelectFolder = (folderId) => {
        setSelectedFolder(folderId)
        window.dispatchEvent(new CustomEvent('filterByFolder', { detail: folderId }))
    }

    // Listen to reset events
    useState(() => {
        const handleReset = () => {
            setSelectedTag(null)
            setSelectedFolder(null)
        }
        window.addEventListener('resetFilters', handleReset)
        return () => window.removeEventListener('resetFilters', handleReset)
    }, [])

    return (
        <aside
            className={`
                w-64 bg-surface h-screen border-r border-gray-800 flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
        >
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                        <span className="material-icons-round text-white">bookmarks</span>
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        FlowMark
                    </h1>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-secondaryText hover:text-white lg:hidden md:block"
                >
                    <span className="material-icons-round">close</span>
                </button>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-secondaryText hover:text-white hidden lg:block"
                    title="Close Sidebar"
                >
                    <span className="material-icons-round">menu_open</span>
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="mb-8">
                    <h3 className="text-xs font-semibold text-secondaryText uppercase tracking-wide mb-3 px-3">
                        Menu
                    </h3>
                    <ul className="space-y-1">
                        <li>
                            <NavLink
                                to="/dashboard"
                                end
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive
                                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                        : 'text-secondaryText hover:text-primaryText hover:bg-gray-800'
                                    }`
                                }
                            >
                                <span className="material-icons-round">dashboard</span>
                                <span className="font-medium">Dashboard</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/dashboard/settings"
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive
                                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                        : 'text-secondaryText hover:text-primaryText hover:bg-gray-800'
                                    }`
                                }
                            >
                                <span className="material-icons-round">settings</span>
                                <span className="font-medium">Settings</span>
                            </NavLink>
                        </li>
                    </ul>
                </div>

                <FolderManager
                    onSelectFolder={handleSelectFolder}
                    selectedFolder={selectedFolder}
                />

                <TagSidebar
                    onSelectTag={handleSelectTag}
                    selectedTag={selectedTag}
                />
            </nav>

            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-secondaryText hover:text-red-500 hover:bg-red-500/10 transition-all w-full"
                >
                    <span className="material-icons-round">logout</span>
                    <span className="font-medium">Log Out</span>
                </button>
                <div className="mt-4 px-3 flex items-center gap-3 text-sm text-secondaryText">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="material-icons-round text-sm">person</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-primaryText">{user?.email}</p>
                        <p className="text-xs">Free Plan</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}
