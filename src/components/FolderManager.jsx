import { useState } from 'react'

export default function FolderManager({ onSelectFolder }) {
    const [folders, setFolders] = useState([])
    const [showCreateFolder, setShowCreateFolder] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [selectedFolder, setSelectedFolder] = useState(null)

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return

        try {
            const { supabase } = await import('../lib/supabase')
            const { data: { user } } = await supabase.auth.getUser()

            const { data, error } = await supabase
                .from('folders')
                .insert({
                    name: newFolderName,
                    user_id: user.id,
                    parent_id: null
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
                        <li key={folder.id}>
                            <button
                                onClick={() => handleSelectFolderInternal(folder.id)}
                                className={`w-full text-left px-3 py-2 rounded transition text-sm flex items-center gap-2 ${selectedFolder === folder.id
                                    ? 'bg-accent/20 text-accent font-medium'
                                    : 'text-secondaryText hover:bg-gray-800 hover:text-primaryText'
                                    }`}
                            >
                                <span className="material-icons-round text-base opacity-70">
                                    {selectedFolder === folder.id ? 'folder_open' : 'folder'}
                                </span>
                                <span className="truncate">{folder.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
