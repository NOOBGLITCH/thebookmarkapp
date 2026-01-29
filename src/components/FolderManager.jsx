import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function FolderManager({ onSelectFolder }) {
    const { user } = useAuth()
    const [folders, setFolders] = useState([])
    const [showCreateFolder, setShowCreateFolder] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [selectedFolder, setSelectedFolder] = useState(null)
    const [menuOpenId, setMenuOpenId] = useState(null)
    const [shareCopiedId, setShareCopiedId] = useState(null)
    const menuRef = useRef(null)

    useEffect(() => {
        if (!user?.id) return
        supabase.from('folders').select('id, name, parent_id, visibility, is_public').eq('user_id', user.id).order('name').then(({ data }) => {
            if (data) setFolders(data)
        })
    }, [user?.id])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpenId(null)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleFolderVisibility = async (folder, e) => {
        e.stopPropagation()
        try {
            const nextVisibility = (folder.visibility === 'public' || folder.is_public) ? 'private' : 'public'
            const isPublic = nextVisibility === 'public'
            const { error } = await supabase.from('folders').update({ visibility: nextVisibility, is_public: isPublic }).eq('id', folder.id).eq('user_id', user.id)
            if (error) throw error
            setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, visibility: nextVisibility, is_public: isPublic } : f)))
            setMenuOpenId(null)
        } catch (err) {
            console.error('Toggle folder visibility failed:', err)
            alert('Failed to update folder: ' + (err.message || 'Unknown error'))
        }
    }

    const copyFolderPublicLink = async (folder, e) => {
        e.stopPropagation()
        try {
            const { data, error } = await supabase.rpc('create_folder_share', {
                resource_id: folder.id,
                expires_at: null,
                permission_level: 'view'
            })
            if (error) throw error
            const token = data?.[0]?.token
            if (!token) throw new Error('No token returned')
            const url = `${window.location.origin}/shared/folder/${token}`
            await navigator.clipboard.writeText(url)
            setShareCopiedId(folder.id)
            setTimeout(() => setShareCopiedId(null), 2000)
            setMenuOpenId(null)
        } catch (err) {
            console.error('Share failed:', err)
            alert('Failed to create share link: ' + (err.message || 'Unknown error'))
        }
    }

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return

        try {
            const { data, error } = await supabase
                .from('folders')
                .insert({
                    name: newFolderName,
                    user_id: user.id,
                    parent_id: null,
                    visibility: 'private',
                    is_public: false
                })
                .select()
                .single()

            if (error) throw error

            setFolders([...folders, data])
            setNewFolderName('')
            setShowCreateFolder(false)
        } catch (error) {
            console.error('Error creating folder:', error)
            alert('Failed to create folder: ' + error.message)
        }
    }

    const handleSelectFolderInternal = (folderId) => {
        setSelectedFolder(folderId)
        if (onSelectFolder) onSelectFolder(folderId)
    }

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-3">
                <h3 className="text-xs font-semibold text-secondaryText uppercase tracking-wide">Folders</h3>
                <button
                    onClick={() => setShowCreateFolder(true)}
                    className="text-secondaryText hover:text-accent transition"
                    title="Create Folder"
                >
                    <span className="material-icons-round text-lg">add</span>
                </button>
            </div>

            {showCreateFolder && (
                <div className="mb-3 flex items-center gap-2 px-2">
                    <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                        placeholder="Folder name"
                        className="flex-1 min-w-0 px-2 py-1 bg-background border border-gray-700 rounded text-sm text-primaryText focus:outline-none focus:border-accent"
                        autoFocus
                    />
                    <button
                        onClick={handleCreateFolder}
                        className="text-green-500 hover:bg-green-500/10 rounded transition p-0.5"
                        title="Create"
                    >
                        <span className="material-icons-round text-lg">check</span>
                    </button>
                    <button
                        onClick={() => {
                            setShowCreateFolder(false)
                            setNewFolderName('')
                        }}
                        className="text-red-500 hover:bg-red-500/10 rounded transition p-0.5"
                        title="Cancel"
                    >
                        <span className="material-icons-round text-lg">close</span>
                    </button>
                </div>
            )}

            {folders.length === 0 ? (
                <p className="px-3 text-secondaryText text-sm">No folders yet</p>
            ) : (
                <ul className="space-y-0.5">
                    <li>
                        <button
                            onClick={() => handleSelectFolderInternal(null)}
                            className={`w-full text-left px-3 py-2 rounded transition text-sm flex items-center gap-2 ${!selectedFolder
                                ? 'bg-accent/20 text-accent font-medium'
                                : 'text-secondaryText hover:bg-gray-800 hover:text-primaryText'
                                }`}
                        >
                            <span className="material-icons-round text-base">folder_open</span>
                            All Bookmarks
                        </button>
                    </li>
                    {folders.map(folder => (
                        <li key={folder.id} className="relative group">
                            <div className={`flex items-center justify-between px-3 py-2 rounded transition text-sm ${selectedFolder === folder.id ? 'bg-accent/20 text-accent font-medium' : 'text-secondaryText hover:bg-gray-800 hover:text-primaryText'}`}>
                                <button
                                    onClick={() => handleSelectFolderInternal(folder.id)}
                                    className="flex-1 flex items-center gap-2 truncate text-left"
                                >
                                    <span className="material-icons-round text-base opacity-70">
                                        {selectedFolder === folder.id ? 'folder_open' : 'folder'}
                                    </span>
                                    <span className="truncate">{folder.name}</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === folder.id ? null : folder.id) }}
                                    className="p-0.5 hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition"
                                >
                                    <span className="material-icons-round text-base">more_horiz</span>
                                </button>
                            </div>
                            {menuOpenId === folder.id && (
                                <div ref={menuRef} className="absolute right-0 top-full mt-1 w-48 bg-surface border border-gray-700 rounded shadow-xl z-50 py-1">
                                    <button
                                        onClick={(e) => copyFolderPublicLink(folder, e)}
                                        className="w-full text-left px-4 py-2 text-sm text-primaryText hover:bg-gray-800 flex items-center gap-2"
                                    >
                                        <span className="material-icons-round text-base">link</span>
                                        {shareCopiedId === folder.id ? 'Copied!' : 'Copy public link'}
                                    </button>
                                    <button
                                        onClick={(e) => toggleFolderVisibility(folder, e)}
                                        className="w-full text-left px-4 py-2 text-sm text-primaryText hover:bg-gray-800 flex items-center gap-2"
                                    >
                                        <span className="material-icons-round text-base">{(folder.visibility === 'public' || folder.is_public) ? 'lock' : 'public'}</span>
                                        {(folder.visibility === 'public' || folder.is_public) ? 'Make Private' : 'Make Public'}
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
