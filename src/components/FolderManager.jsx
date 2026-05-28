import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { 
    Plus, Check, X, FolderOpen, Folder, MoreHorizontal, 
    Link, Lock, Globe, ChevronRight, ChevronDown, Trash2, FolderInput, Edit 
} from 'lucide-react'

// Helper to build folder tree
function buildFolderTree(foldersList) {
    const map = {}
    const roots = []
    
    foldersList.forEach(folder => {
        map[folder.id] = { ...folder, children: [] }
    })
    
    foldersList.forEach(folder => {
        const mapped = map[folder.id]
        if (folder.parent_id && map[folder.parent_id]) {
            map[folder.parent_id].children.push(mapped)
        } else {
            roots.push(mapped)
        }
    })
    
    return roots
}

export default function FolderManager({ onSelectFolder, selectedFolder: activeFolderId }) {
    const { user } = useAuth()
    const [folders, setFolders] = useState([])
    const [showCreateFolder, setShowCreateFolder] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [newFolderParentId, setNewFolderParentId] = useState('')
    const [menuOpenId, setMenuOpenId] = useState(null)
    const [shareCopiedId, setShareCopiedId] = useState(null)
    const [toastMessage, setToastMessage] = useState(null)
    const menuRef = useRef(null)

    // For renaming folder
    const [renamingFolder, setRenamingFolder] = useState(null)
    const [renameValue, setRenameValue] = useState('')

    // For moving folder
    const [movingFolder, setMovingFolder] = useState(null)
    const [moveParentId, setMoveParentId] = useState('')

    // Collapsed/expanded folders state (persisted)
    const [expandedFolders, setExpandedFolders] = useState(() => {
        const saved = localStorage.getItem('expandedFolders')
        return saved ? JSON.parse(saved) : {}
    })

    const fetchFolders = useCallback(async () => {
        if (!user?.id) return
        try {
            const { data, error } = await supabase
                .from('folders')
                .select('id, name, parent_id, visibility, is_public')
                .eq('user_id', user.id)
                .order('name')

            if (error) throw error
            if (data) setFolders(data)
        } catch (error) {
            console.error('Error fetching folders:', error)
        }
    }, [user?.id])

    useEffect(() => {
        if (user?.id) {
            fetchFolders()
        }
    }, [user?.id, fetchFolders])

    // Listen for external folder refreshes
    useEffect(() => {
        const handleRefresh = () => {
            fetchFolders()
        }
        window.addEventListener('refreshFolders', handleRefresh)
        return () => window.removeEventListener('refreshFolders', handleRefresh)
    }, [fetchFolders])

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpenId(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleExpand = (folderId, e) => {
        e.stopPropagation()
        setExpandedFolders(prev => {
            const next = { ...prev, [folderId]: !prev[folderId] }
            localStorage.setItem('expandedFolders', JSON.stringify(next))
            return next
        })
    }

    const toggleFolderVisibility = async (folder, e) => {
        e.stopPropagation()
        try {
            const nextVisibility = (folder.visibility === 'public' || folder.is_public) ? 'private' : 'public'
            const isPublic = nextVisibility === 'public'
            const { error } = await supabase
                .from('folders')
                .update({ visibility: nextVisibility, is_public: isPublic })
                .eq('id', folder.id)
                .eq('user_id', user.id)

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
            const token = data?.[0]?.share_token || data?.[0]?.token
            if (!token) throw new Error('No token returned')
            const url = `${window.location.origin}/shared/folder/${token}`
            await navigator.clipboard.writeText(url)
            
            // Set toast and button text states
            setShareCopiedId(folder.id)
            setToastMessage(`Success: Public link for "${folder.name}" copied!`)
            
            setTimeout(() => setShareCopiedId(null), 2000)
            setTimeout(() => setToastMessage(null), 3000)
            setMenuOpenId(null)
        } catch (err) {
            console.error('Share failed:', err)
            alert('Failed to create share link: ' + (err.message || 'Unknown error'))
        }
    }

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return

        try {
            const parentIdVal = newFolderParentId || null

            const { data, error } = await supabase
                .from('folders')
                .insert({
                    name: newFolderName.trim(),
                    user_id: user.id,
                    parent_id: parentIdVal,
                    visibility: 'private',
                    is_public: false
                })
                .select()
                .single()

            if (error) throw error

            setFolders([...folders, data])
            
            // Auto expand the parent folder if created inside one
            if (parentIdVal) {
                setExpandedFolders(prev => ({ ...prev, [parentIdVal]: true }))
            }

            setNewFolderName('')
            setNewFolderParentId('')
            setShowCreateFolder(false)
            
            // Refresh other views
            window.dispatchEvent(new CustomEvent('refreshFolders'))
        } catch (error) {
            console.error('Error creating folder:', error)
            alert('Failed to create folder: ' + error.message)
        }
    }

    const handleSelectFolderInternal = (folderId) => {
        if (onSelectFolder) onSelectFolder(folderId)
    }

    const handleRenameFolder = async () => {
        if (!renamingFolder || !renameValue.trim()) return

        try {
            const { error } = await supabase
                .from('folders')
                .update({ name: renameValue.trim() })
                .eq('id', renamingFolder.id)
                .eq('user_id', user.id)

            if (error) throw error

            setFolders(prev => prev.map(f => f.id === renamingFolder.id ? { ...f, name: renameValue.trim() } : f))
            setRenamingFolder(null)
            
            // Sync with bookmarks and folders globally
            window.dispatchEvent(new CustomEvent('refreshFolders'))
            window.dispatchEvent(new CustomEvent('refreshBookmarks'))
        } catch (error) {
            console.error('Error renaming folder:', error)
            alert('Failed to rename folder: ' + error.message)
        }
    }

    // Helper to check if childId is a descendant of parentId
    const isDescendant = (foldersList, parentId, childId) => {
        let currentId = childId
        while (currentId) {
            const folder = foldersList.find(f => f.id === currentId)
            if (!folder) break
            if (folder.parent_id === parentId) return true
            currentId = folder.parent_id
        }
        return false
    }

    // Helper to get indented options for select boxes
    const getFlattenedOptions = (foldersList, excludeId = null) => {
        const tree = buildFolderTree(foldersList)
        const options = []
        
        const traverse = (node, depth = 0) => {
            if (excludeId && (node.id === excludeId || isDescendant(foldersList, excludeId, node.id))) {
                return
            }
            options.push({ id: node.id, name: node.name, depth })
            if (node.children) {
                node.children.forEach(child => traverse(child, depth + 1))
            }
        }
        
        tree.forEach(root => traverse(root, 0))
        return options
    }

    const openMoveModal = (folder, e) => {
        e.stopPropagation()
        setMovingFolder(folder)
        setMoveParentId(folder.parent_id || '')
        setMenuOpenId(null)
    }

    const handleMoveFolder = async () => {
        if (!movingFolder) return

        try {
            const nextParentId = moveParentId || null

            // Extra safety validation
            if (nextParentId === movingFolder.id) {
                alert('A folder cannot be its own parent.')
                return
            }
            if (nextParentId && isDescendant(folders, movingFolder.id, nextParentId)) {
                alert('A folder cannot be moved into one of its subfolders.')
                return
            }

            const { error } = await supabase
                .from('folders')
                .update({ parent_id: nextParentId })
                .eq('id', movingFolder.id)
                .eq('user_id', user.id)

            if (error) throw error

            setFolders(prev => prev.map(f => f.id === movingFolder.id ? { ...f, parent_id: nextParentId } : f))
            setMovingFolder(null)
            
            // Expand the destination parent folder if moved inside one
            if (nextParentId) {
                setExpandedFolders(prev => ({ ...prev, [nextParentId]: true }))
            }

            // Sync with bookmarks and folders globally
            window.dispatchEvent(new CustomEvent('refreshFolders'))
            window.dispatchEvent(new CustomEvent('refreshBookmarks'))
        } catch (error) {
            console.error('Error moving folder:', error)
            alert('Failed to move folder: ' + error.message)
        }
    }

    const handleDeleteFolder = async (folder, e) => {
        e.stopPropagation()
        const confirmMsg = `Are you sure you want to delete the folder "${folder.name}"?\n` +
            `• Any subfolders will also be deleted cascadingly.\n` +
            `• Bookmarks inside these folders will be moved to the root level ("All Bookmarks").`
        
        if (!confirm(confirmMsg)) return

        try {
            const { error } = await supabase
                .from('folders')
                .delete()
                .eq('id', folder.id)
                .eq('user_id', user.id)

            if (error) throw error

            setMenuOpenId(null)
            
            // If the deleted folder or any descendant was selected, deselect it
            if (activeFolderId === folder.id || isDescendant(folders, folder.id, activeFolderId)) {
                handleSelectFolderInternal(null)
            }

            // Trigger global sync events
            window.dispatchEvent(new CustomEvent('refreshFolders'))
            window.dispatchEvent(new CustomEvent('refreshBookmarks'))
        } catch (error) {
            console.error('Error deleting folder:', error)
            alert('Failed to delete folder: ' + error.message)
        }
    }

    // Recursive rendering function for folders tree
    const renderFolderNode = (node, depth = 0) => {
        const isSelected = activeFolderId === node.id
        const isExpanded = !!expandedFolders[node.id]
        const hasChildren = node.children && node.children.length > 0

        return (
            <div key={node.id} className="flex flex-col">
                <div 
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    className={`flex items-center justify-between py-1.5 pr-2 rounded transition text-sm relative group ${isSelected ? 'bg-accent/20 text-accent font-medium' : 'text-secondaryText hover:bg-gray-800 hover:text-primaryText'}`}
                >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {/* Chevron expand/collapse arrow */}
                        <button 
                            onClick={(e) => toggleExpand(node.id, e)}
                            className={`p-1 hover:bg-gray-700/50 rounded transition ${hasChildren ? 'opacity-100' : 'opacity-20 cursor-default'}`}
                            disabled={!hasChildren}
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                            )}
                        </button>

                        <button
                            onClick={() => handleSelectFolderInternal(node.id)}
                            className="flex-1 flex items-center gap-2 truncate text-left"
                        >
                            {isSelected ? (
                                <FolderOpen className="w-4 h-4 opacity-80 text-accent" />
                            ) : (
                                <Folder className="w-4 h-4 opacity-70" />
                            )}
                            <span className="truncate">{node.name}</span>
                            {(node.visibility === 'public' || node.is_public) && (
                                <Globe className="w-3 h-3 text-blue-400" />
                            )}
                        </button>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === node.id ? null : node.id) }}
                        className="p-0.5 hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Subfolder Menu */}
                    {menuOpenId === node.id && (
                        <div ref={menuRef} className="absolute right-2 top-full mt-1 w-48 bg-surface border border-gray-700 rounded shadow-xl z-50 py-1">
                            {(node.visibility === 'public' || node.is_public) && (
                                <button
                                    onClick={(e) => copyFolderPublicLink(node, e)}
                                    className="w-full text-left px-4 py-2 text-sm text-primaryText hover:bg-gray-800 flex items-center gap-2"
                                >
                                    <Link className="w-4 h-4" />
                                    {shareCopiedId === node.id ? 'Copied!' : 'Copy public link'}
                                </button>
                            )}
                            
                            <button
                                onClick={(e) => toggleFolderVisibility(node, e)}
                                className="w-full text-left px-4 py-2 text-sm text-primaryText hover:bg-gray-800 flex items-center gap-2"
                            >
                                {(node.visibility === 'public' || node.is_public) ? (
                                    <Lock className="w-4 h-4" />
                                ) : (
                                    <Globe className="w-4 h-4" />
                                )}
                                {(node.visibility === 'public' || node.is_public) ? 'Make Private' : 'Make Public'}
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); setRenamingFolder(node); setRenameValue(node.name); setMenuOpenId(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-primaryText hover:bg-gray-800 flex items-center gap-2 border-t border-gray-800"
                            >
                                <Edit className="w-4 h-4" />
                                Rename Folder
                            </button>

                            <button
                                onClick={(e) => openMoveModal(node, e)}
                                className="w-full text-left px-4 py-2 text-sm text-primaryText hover:bg-gray-800 flex items-center gap-2"
                            >
                                <FolderInput className="w-4 h-4" />
                                Move Folder
                            </button>

                            <button
                                onClick={(e) => handleDeleteFolder(node, e)}
                                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-800 flex items-center gap-2 border-t border-gray-800"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Folder
                            </button>
                        </div>
                    )}
                </div>

                {/* Recursively render child folder nodes */}
                {isExpanded && hasChildren && (
                    <div className="flex flex-col">
                        {node.children.map(child => renderFolderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        )
    }

    const folderTree = buildFolderTree(folders)

    return (
        <div className="mb-6 relative group">
            <div className="flex items-center justify-between mb-3 px-3">
                <h3 className="text-xs font-semibold text-secondaryText uppercase tracking-wide">Folders</h3>
                <button
                    onClick={() => {
                        setNewFolderParentId(activeFolderId || '')
                        setShowCreateFolder(true)
                    }}
                    className="text-secondaryText hover:text-accent transition"
                    title="Create Folder"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Create Folder Form */}
            {showCreateFolder && (
                <div className="mb-3 p-2 bg-background/50 border border-gray-800 rounded mx-2 space-y-2">
                    <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                        placeholder="Folder name"
                        className="w-full px-2 py-1 bg-background border border-gray-700 rounded text-sm text-primaryText focus:outline-none focus:border-accent"
                        autoFocus
                    />
                    
                    <div className="flex items-center gap-2 justify-between">
                        <label className="text-xs text-secondaryText">Parent:</label>
                        <select
                            value={newFolderParentId}
                            onChange={(e) => setNewFolderParentId(e.target.value)}
                            className="flex-1 min-w-0 max-w-[130px] px-1 py-0.5 bg-background border border-gray-700 rounded text-xs text-primaryText focus:outline-none focus:border-accent"
                        >
                            <option value="">[Root Level]</option>
                            {getFlattenedOptions(folders).map(f => (
                                <option key={f.id} value={f.id}>
                                    {'\u00A0'.repeat(f.depth * 2)}{f.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-1.5 pt-1">
                        <button
                            onClick={() => {
                                setShowCreateFolder(false)
                                setNewFolderName('')
                                setNewFolderParentId('')
                            }}
                            className="px-2 py-0.5 text-xs text-secondaryText hover:text-primaryText border border-gray-800 hover:border-gray-700 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateFolder}
                            className="px-2 py-0.5 text-xs bg-accent text-white font-medium rounded hover:bg-accent/90"
                        >
                            Create
                        </button>
                    </div>
                </div>
            )}

            {folders.length === 0 ? (
                <p className="px-3 text-secondaryText text-sm">No folders yet</p>
            ) : (
                <ul className="space-y-0.5">
                    {/* All Bookmarks Button */}
                    <li>
                        <button
                            onClick={() => handleSelectFolderInternal(null)}
                            className={`w-full text-left px-3 py-2 rounded transition text-sm flex items-center gap-2 ${!activeFolderId
                                ? 'bg-accent/20 text-accent font-medium'
                                : 'text-secondaryText hover:bg-gray-800 hover:text-primaryText'
                                }`}
                        >
                            <FolderOpen className="w-4 h-4 text-accent" />
                            All Bookmarks
                        </button>
                    </li>

                    {/* Recursively Render Tree roots */}
                    {folderTree.map(rootNode => renderFolderNode(rootNode, 0))}
                </ul>
            )}

            {/* Move Folder Modal */}
            {movingFolder && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-surface rounded-lg max-w-sm w-full p-6 border border-gray-800 shadow-2xl">
                        <h3 className="text-lg font-bold text-primaryText mb-2">Move Folder</h3>
                        <p className="text-sm text-secondaryText mb-4">
                            Choose a new parent folder for <strong className="text-primaryText">"{movingFolder.name}"</strong>:
                        </p>
                        
                        <div className="mb-6">
                            <select
                                value={moveParentId}
                                onChange={(e) => setMoveParentId(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-gray-700 rounded text-primaryText focus:outline-none focus:border-accent"
                            >
                                <option value="">[Root Level] (No parent)</option>
                                {getFlattenedOptions(folders, movingFolder.id).map(f => (
                                    <option key={f.id} value={f.id}>
                                        {'\u00A0'.repeat(f.depth * 3)}{f.depth > 0 ? '↳ ' : ''}{f.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setMovingFolder(null)}
                                className="px-4 py-2 bg-background hover:bg-gray-800 text-primaryText border border-gray-700 rounded transition text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMoveFolder}
                                className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded transition text-sm font-semibold"
                            >
                                Move Folder
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rename Folder Modal */}
            {renamingFolder && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-surface rounded-lg max-w-sm w-full p-6 border border-gray-800 shadow-2xl">
                        <h3 className="text-lg font-bold text-primaryText mb-2">Rename Folder</h3>
                        <p className="text-sm text-secondaryText mb-4">
                            Enter a new name for <strong className="text-primaryText">"{renamingFolder.name}"</strong>:
                        </p>
                        
                        <div className="mb-6">
                            <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleRenameFolder()}
                                className="w-full px-3 py-2 bg-background border border-gray-700 rounded text-primaryText focus:outline-none focus:border-accent"
                                autoFocus
                            />
                        </div>
                        
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRenamingFolder(null)}
                                className="px-4 py-2 bg-background hover:bg-gray-800 text-primaryText border border-gray-700 rounded transition text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRenameFolder}
                                className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded transition text-sm font-semibold"
                            >
                                Rename
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Beautiful Success Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-5 right-5 z-50 animate-slide-up flex items-center gap-3 px-4 py-3 bg-gray-900 border-l-4 border-green-500 text-primaryText rounded-lg shadow-2xl max-w-sm border border-gray-800">
                    <div className="w-5 h-5 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                        <Check className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 text-sm font-semibold pr-2">
                        {toastMessage}
                    </div>
                    <button 
                        onClick={() => setToastMessage(null)}
                        className="text-secondaryText hover:text-primaryText transition flex-shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
}
