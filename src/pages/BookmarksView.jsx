import { useAuth } from '../context/AuthContext'
import { useBookmarks } from '../context/BookmarkContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import SearchBar from '../components/SearchBar'

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

function getFlattenedFolderOptions(foldersList) {
    const tree = buildFolderTree(foldersList)
    const options = []
    
    const traverse = (node, depth = 0) => {
        options.push({
            id: node.id,
            name: node.name,
            depth: depth
        })
        if (node.children) {
            node.children.forEach(child => traverse(child, depth + 1))
        }
    }
    
    tree.forEach(rootNode => traverse(rootNode, 0))
    return options
}

export default function BookmarksView() {
    const { user } = useAuth()
    const { openEditModal, openAddModal, refreshTrigger } = useBookmarks()
    const [bookmarks, setBookmarks] = useState([])
    const [folders, setFolders] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTag, setSelectedTag] = useState(null)
    const [selectedFolderId, setSelectedFolderId] = useState(null)
    const [selectedBookmarks, setSelectedBookmarks] = useState([])
    const [shareCopiedId, setShareCopiedId] = useState(null)
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('bookmarkFavorites')
        return saved ? JSON.parse(saved) : []
    })

    const [contextMenu, setContextMenu] = useState(null) // { x, y, bookmark }
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
    const [bookmarksToMove, setBookmarksToMove] = useState([])
    const [moveTargetFolderId, setMoveTargetFolderId] = useState('')

    // Close context menu on left click anywhere
    useEffect(() => {
        const handleCloseMenu = () => setContextMenu(null)
        window.addEventListener('click', handleCloseMenu)
        return () => window.removeEventListener('click', handleCloseMenu)
    }, [])

    const handleContextMenu = (e, bookmark) => {
        e.preventDefault()
        e.stopPropagation()
        
        const menuWidth = 192 // w-48 is 12rem = 192px
        const menuHeight = 180
        
        let x = e.clientX
        let y = e.clientY
        
        if (x + menuWidth > window.innerWidth) {
            x = window.innerWidth - menuWidth - 10
        }
        if (y + menuHeight > window.innerHeight) {
            y = window.innerHeight - menuHeight - 10
        }
        
        setContextMenu({ x, y, bookmark })
    }

    const handleBulkMove = async () => {
        if (bookmarksToMove.length === 0) return

        try {
            const folderIdVal = moveTargetFolderId || null
            const { error } = await supabase
                .from('bookmarks')
                .update({ folder_id: folderIdVal })
                .in('id', bookmarksToMove)
                .eq('user_id', user.id)

            if (error) throw error

            setIsMoveModalOpen(false)
            setBookmarksToMove([])
            setMoveTargetFolderId('')
            setSelectedBookmarks([]) // Clear selections if bulk moved
            
            // Refresh
            fetchBookmarks()
            window.dispatchEvent(new CustomEvent('refreshFolders'))
        } catch (err) {
            console.error('Bulk move failed:', err)
            alert('Failed to move bookmarks: ' + err.message)
        }
    }

    const fetchFolders = useCallback(async () => {
        if (!user) return
        try {
            const { data } = await supabase
                .from('folders')
                .select('id, name, parent_id')
                .eq('user_id', user.id)
            if (data) setFolders(data)
        } catch (error) {
            console.error('Error fetching folders in BookmarksView:', error)
        }
    }, [user])

    const fetchBookmarks = useCallback(async () => {
        try {
            if (!user) return

            const { data, error } = await supabase
                .from('bookmarks')
                .select(`
          id,
          url,
          title,
          description,
          created_at,
          folder_id,
          bookmark_tags(
            tags(name)
          )
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Transform data to include tags array
            const bookmarksWithTags = data.map(bookmark => ({
                ...bookmark,
                tags: bookmark.bookmark_tags?.map(bt => bt.tags.name) || []
            }))

            setBookmarks(bookmarksWithTags)
        } catch (error) {
            console.error('Error fetching bookmarks:', error)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        if (user) {
            fetchBookmarks()
            fetchFolders()
        }
    }, [user, refreshTrigger, fetchBookmarks, fetchFolders])

    // Listen for tag and folder filter events from sidebar
    useEffect(() => {
        const handleTagFilter = (event) => {
            setSelectedTag(event.detail)
        }
        const handleFolderFilter = (event) => {
            setSelectedFolderId(event.detail)
        }
        const handleResetFilters = () => {
            setSelectedTag(null)
            setSelectedFolderId(null)
        }

        window.addEventListener('filterByTag', handleTagFilter)
        window.addEventListener('filterByFolder', handleFolderFilter)
        window.addEventListener('resetFilters', handleResetFilters)

        return () => {
            window.removeEventListener('filterByTag', handleTagFilter)
            window.removeEventListener('filterByFolder', handleFolderFilter)
            window.removeEventListener('resetFilters', handleResetFilters)
        }
    }, [])

    // Listen for refresh bookmarks and folders events
    useEffect(() => {
        const handleRefresh = () => {
            fetchBookmarks()
            fetchFolders()
        }
        window.addEventListener('refreshBookmarks', handleRefresh)
        window.addEventListener('refreshFolders', fetchFolders)
        return () => {
            window.removeEventListener('refreshBookmarks', handleRefresh)
            window.removeEventListener('refreshFolders', fetchFolders)
        }
    }, [fetchBookmarks, fetchFolders])

    // Save favorites to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('bookmarkFavorites', JSON.stringify(favorites))
    }, [favorites])

    const copyBookmarkPublicLink = async (bookmark, e) => {
        e.stopPropagation()
        try {
            const { data, error } = await supabase.rpc('create_bookmark_share', {
                resource_id: bookmark.id,
                expires_at: null,
                permission_level: 'view'
            })
            if (error) throw error
            const token = data?.[0]?.share_token || data?.[0]?.token
            if (!token) throw new Error('No token returned')
            const url = `${window.location.origin}/shared/bookmark/${token}`
            await navigator.clipboard.writeText(url)
            setShareCopiedId(bookmark.id)
            setTimeout(() => setShareCopiedId(null), 2000)
        } catch (err) {
            console.error('Share failed:', err)
            alert('Failed to create share link: ' + (err.message || 'Unknown error'))
        }
    }

    const toggleFavorite = (bookmarkId) => {
        // Optimistic update
        setFavorites(prev => {
            const newFavorites = prev.includes(bookmarkId)
                ? prev.filter(id => id !== bookmarkId)
                : [...prev, bookmarkId]

            // Sync with localStorage immediately
            localStorage.setItem('bookmarkFavorites', JSON.stringify(newFavorites))

            // Dispatch event for sidebar immediately
            window.dispatchEvent(new CustomEvent('favoritesChanged', { detail: newFavorites }))

            return newFavorites
        })
    }

    const deleteBookmark = async (id) => {
        // Optimistic UI update immediately
        console.log('🗑️ Starting delete for bookmark ID:', id)
        console.log('👤 Current user:', user?.id)

        try {
            // OPTIMISTIC UPDATE: Remove from UI immediately
            setBookmarks(prev => prev.filter(b => b.id !== id))

            // Remove from favorites if it was favorited
            const saved = localStorage.getItem('bookmarkFavorites')
            if (saved) {
                const favorites = JSON.parse(saved)
                if (favorites.includes(id)) {
                    const newFavorites = favorites.filter(fid => fid !== id)
                    localStorage.setItem('bookmarkFavorites', JSON.stringify(newFavorites))
                    window.dispatchEvent(new CustomEvent('favoritesChanged', { detail: newFavorites }))
                }
            }

            // Now delete the bookmark using RPC that cleans up tags
            const { error } = await supabase.rpc('delete_bookmark_with_cleanup', {
                p_bookmark_id: id
            })

            if (error) throw error

            // Trigger global event for optimistic updates in sidebar
            const bookmarkToDelete = bookmarks.find(b => b.id === id)
            if (bookmarkToDelete) {
                window.dispatchEvent(new CustomEvent('bookmarkDeleted', {
                    detail: {
                        id,
                        tags: bookmarkToDelete.tags
                    }
                }))
            }

            // Also trigger standard refresh as fallback
            window.dispatchEvent(new CustomEvent('refreshTags'))

        } catch (error) {
            console.error('❌ Error deleting bookmark:', error)
            alert(`Failed to delete bookmark: ${error.message}`)
            // Revert on error (optional, but good practice)
            fetchBookmarks()
        }
    }

    const handleBulkDelete = async () => {
        if (selectedBookmarks.length === 0) return

        try {
            for (const id of selectedBookmarks) {
                // Delete bookmark using RPC (cleans up tags automatically)
                await supabase.rpc('delete_bookmark_with_cleanup', { p_bookmark_id: id })
            }

            setBookmarks(prev => prev.filter(b => !selectedBookmarks.includes(b.id)))
            setSelectedBookmarks([])

            // Trigger tag refresh to remove orphaned tags
            window.dispatchEvent(new CustomEvent('refreshTags'))
        } catch (error) {
            console.error('Bulk delete error:', error)
            alert('Failed to delete some bookmarks')
        }
    }

    const toggleBookmarkSelection = (id) => {
        setSelectedBookmarks(prev =>
            prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
        )
    }

    const selectAll = () => {
        setSelectedBookmarks(filteredBookmarks.map(b => b.id))
    }

    const selectByTag = () => {
        if (!selectedTag) return
        const taggedBookmarks = filteredBookmarks.filter(b => b.tags?.includes(selectedTag))
        setSelectedBookmarks(taggedBookmarks.map(b => b.id))
    }

    const deselectAll = () => {
        setSelectedBookmarks([])
    }

    const highlightText = (text, query) => {
        if (!query || !text) return text

        const parts = text.split(new RegExp(`(${query})`, 'gi'))
        return parts.map((part, index) =>
            part.toLowerCase() === query.toLowerCase() ?
                <mark key={index} className="bg-yellow-400 text-black">{part}</mark> :
                part
        )
    }

    // Helper to get descendant folder IDs
    const getDescendantFolderIds = useCallback((folderId) => {
        if (!folderId) return []
        const ids = [folderId]
        const recurse = (id) => {
            folders.forEach(f => {
                if (f.parent_id === id) {
                    ids.push(f.id)
                    recurse(f.id)
                }
            })
        }
        recurse(folderId)
        return ids
    }, [folders])

    const filteredBookmarks = bookmarks.filter(bookmark => {
        // Filter by selected folder first (including all its descendants)
        if (selectedFolderId) {
            const allowedFolderIds = getDescendantFolderIds(selectedFolderId)
            if (!allowedFolderIds.includes(bookmark.folder_id)) {
                return false
            }
        }

        // Filter by selected tag second
        if (selectedTag && !bookmark.tags?.includes(selectedTag)) {
            return false
        }

        // Then filter by search query
        if (!searchQuery) return true

        const query = searchQuery.toLowerCase()
        return (
            bookmark.title?.toLowerCase().includes(query) ||
            bookmark.url?.toLowerCase().includes(query) ||
            bookmark.description?.toLowerCase().includes(query) ||
            bookmark.tags?.some(tag => tag.toLowerCase().includes(query))
        )
    })

    // Remove duplicates by URL (keep most recent)
    const uniqueBookmarks = filteredBookmarks.reduce((acc, current) => {
        const existing = acc.find(b => b.url === current.url)
        if (!existing) {
            return [...acc, current]
        } else {
            // Keep the one with more recent created_at
            if (new Date(current.created_at) > new Date(existing.created_at)) {
                return acc.map(b => b.url === current.url ? current : b)
            }
            return acc
        }
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-accent text-xl">Loading bookmarks...</div>
            </div>
        )
    }

    const selectedFolderObj = folders.find(f => f.id === selectedFolderId)

    return (
        <div>
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <div className="px-8 pb-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-primaryText">
                                {selectedTag && selectedFolderObj ? (
                                    `Bookmarks in "${selectedFolderObj.name}" tagged with "${selectedTag}"`
                                ) : selectedTag ? (
                                    `Bookmarks tagged with "${selectedTag}"`
                                ) : selectedFolderObj ? (
                                    `Folder: "${selectedFolderObj.name}"`
                                ) : (
                                    'All Bookmarks'
                                )}
                            </h1>
                            <p className="text-secondaryText mt-1">
                                {uniqueBookmarks.length} bookmark{uniqueBookmarks.length !== 1 ? 's' : ''}
                                {(searchQuery || selectedTag || selectedFolderId) && ` (filtered from ${bookmarks.length})`}
                                {selectedBookmarks.length > 0 && ` • ${selectedBookmarks.length} selected`}
                            </p>
                        </div>
                        {filteredBookmarks.length > 0 && (
                            <div className="flex gap-2">
                                {selectedBookmarks.length > 0 ? (
                                    <>
                                        <button
                                            onClick={deselectAll}
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm font-medium"
                                        >
                                            Deselect All
                                        </button>
                                        <button
                                            onClick={() => {
                                                setBookmarksToMove(selectedBookmarks)
                                                setMoveTargetFolderId('')
                                                setIsMoveModalOpen(true)
                                            }}
                                            className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg transition text-sm flex items-center gap-2 font-medium"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                            </svg>
                                            Move ({selectedBookmarks.length})
                                        </button>
                                        <button
                                            onClick={handleBulkDelete}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm flex items-center gap-2 font-medium"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete ({selectedBookmarks.length})
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={selectAll}
                                            className="px-4 py-2 bg-surface border border-gray-700 hover:border-accent text-primaryText rounded-lg transition text-sm"
                                        >
                                            Select All
                                        </button>
                                        {selectedTag && (
                                            <button
                                                onClick={selectByTag}
                                                className="px-4 py-2 bg-surface border border-gray-700 hover:border-accent text-primaryText rounded-lg transition text-sm"
                                            >
                                                Select Tagged
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {uniqueBookmarks.length === 0 ? (
                        <div className="text-center py-16">
                            <svg className="w-24 h-24 mx-auto text-secondaryText mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-primaryText mb-2">
                                {searchQuery ? 'No bookmarks found' : 'No bookmarks yet'}
                            </h3>
                            <p className="text-secondaryText mb-6">
                                {searchQuery ? 'Try a different search term' : 'Start building your collection by adding your first bookmark'}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={openAddModal}
                                    className="px-6 py-3 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg transition"
                                >
                                    Add Your First Bookmark
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {uniqueBookmarks.map(bookmark => (
                                <div
                                    key={bookmark.id}
                                    onClick={() => toggleBookmarkSelection(bookmark.id)}
                                    onContextMenu={(e) => handleContextMenu(e, bookmark)}
                                    className={`bg-surface rounded-lg overflow-hidden border transition group relative cursor-pointer select-none ${selectedBookmarks.includes(bookmark.id)
                                        ? 'border-accent ring-2 ring-accent/50 bg-accent/5'
                                        : selectedTag && bookmark.tags?.includes(selectedTag)
                                            ? 'border-accent ring-2 ring-accent/20'
                                            : 'border-gray-800 hover:border-accent'
                                        }`}
                                >
                                    {/* Selection Checkbox */}
                                    <div className="absolute top-3 left-3 z-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedBookmarks.includes(bookmark.id)}
                                            onChange={(e) => e.stopPropagation()}
                                            className="w-5 h-5 rounded border-gray-600 bg-surface text-accent focus:ring-accent focus:ring-offset-0 cursor-pointer pointer-events-none"
                                        />
                                    </div>
                                    {/* Favorite Heart Icon */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            toggleFavorite(bookmark.id)
                                        }}
                                        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-surface/80 hover:bg-surface transition-all"
                                        title={favorites.includes(bookmark.id) ? 'Remove from favorites' : 'Add to favorites'}
                                    >
                                        {favorites.includes(bookmark.id) ? (
                                            <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        )}
                                    </button>
                                    {/* Screenshot Preview */}
                                    <div className="aspect-video overflow-hidden bg-gray-800 relative group-hover:opacity-100 transition">
                                        <img
                                            src={`https://s0.wp.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=600&h=400`}
                                            alt={`Screenshot of ${bookmark.url}`}
                                            className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition duration-500"
                                            loading="lazy"
                                            onError={(e) => {
                                                // Fallback to Google Favicon service which is very reliable for icons
                                                e.target.style.objectFit = 'contain';
                                                e.target.style.padding = '20px';
                                                e.target.src = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=128`
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent opacity-0 group-hover:opacity-40 transition"></div>
                                    </div>

                                    <div className="p-4 relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-primaryText text-lg line-clamp-1 group-hover:text-accent transition">
                                                <a
                                                    href={bookmark.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {highlightText(bookmark.title || bookmark.url, searchQuery)}
                                                </a>
                                            </h3>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => copyBookmarkPublicLink(bookmark, e)}
                                                    className="text-secondaryText hover:text-primaryText"
                                                    title={shareCopiedId === bookmark.id ? 'Copied!' : 'Copy public link'}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        openEditModal(bookmark)
                                                    }}
                                                    className="text-secondaryText hover:text-primaryText"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        deleteBookmark(bookmark.id)
                                                    }}
                                                    className="text-secondaryText hover:text-red-500"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-secondaryText line-clamp-2 mb-3 h-10">
                                            {highlightText(bookmark.description || 'No description', searchQuery)}
                                        </p>
                                        {bookmark.tags && bookmark.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {bookmark.tags.map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        onClick={() => setSearchQuery(tag)}
                                                        className={`px-2 py-1 text-xs rounded-full cursor-pointer transition ${selectedTag === tag
                                                            ? 'bg-accent text-white font-semibold ring-2 ring-accent/50'
                                                            : searchQuery.toLowerCase() === tag.toLowerCase()
                                                                ? 'bg-yellow-400 text-black'
                                                                : 'bg-accent/20 text-accent hover:bg-accent/30'
                                                            }`}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between mt-4 text-xs text-secondaryText">
                                            <span>{new Date(bookmark.created_at).toLocaleDateString()}</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEditModal(bookmark)}
                                                    className="hover:text-accent transition"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => deleteBookmark(bookmark.id)}
                                                    className="hover:text-red-500 transition"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right-click Context Menu */}
            {contextMenu && (
                <div 
                    className="fixed bg-surface border border-gray-700 rounded shadow-2xl z-50 py-1 w-48 text-left animate-fadeIn"
                    style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            window.open(contextMenu.bookmark.url, '_blank', 'noopener,noreferrer')
                            setContextMenu(null)
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-primaryText hover:bg-gray-800 flex items-center gap-2 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open in New Tab
                    </button>

                    <button
                        onClick={async () => {
                            try {
                                await navigator.clipboard.writeText(contextMenu.bookmark.url)
                            } catch (err) {
                                console.error('Failed to copy URL:', err)
                            }
                            setContextMenu(null)
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-primaryText hover:bg-gray-800 flex items-center gap-2 border-b border-gray-800 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Link
                    </button>

                    <button
                        onClick={() => {
                            openEditModal(contextMenu.bookmark)
                            setContextMenu(null)
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-primaryText hover:bg-gray-800 flex items-center gap-2 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit Bookmark
                    </button>

                    <button
                        onClick={() => {
                            setBookmarksToMove([contextMenu.bookmark.id])
                            setMoveTargetFolderId(contextMenu.bookmark.folder_id || '')
                            setIsMoveModalOpen(true)
                            setContextMenu(null)
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-primaryText hover:bg-gray-800 flex items-center gap-2 border-t border-gray-800 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Move to Folder
                    </button>

                    <button
                        onClick={() => {
                            copyBookmarkPublicLink(contextMenu.bookmark)
                            setContextMenu(null)
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-primaryText hover:bg-gray-800 flex items-center gap-2 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Copy Share Link
                    </button>

                    <button
                        onClick={() => {
                            deleteBookmark(contextMenu.bookmark.id)
                            setContextMenu(null)
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-800 flex items-center gap-2 border-t border-gray-800 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Bookmark
                    </button>
                </div>
            )}

            {/* Move Bookmark Modal */}
            {isMoveModalOpen && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-surface rounded-lg max-w-sm w-full p-6 border border-gray-800 shadow-2xl">
                        <h3 className="text-lg font-bold text-primaryText mb-2">Move Bookmarks</h3>
                        <p className="text-sm text-secondaryText mb-4">
                            Move {bookmarksToMove.length} item{bookmarksToMove.length !== 1 ? 's' : ''} to specified folder:
                        </p>
                        
                        <div className="mb-6">
                            <select
                                value={moveTargetFolderId}
                                onChange={(e) => setMoveTargetFolderId(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-gray-700 rounded text-primaryText focus:outline-none focus:border-accent"
                            >
                                <option value="">[Root Level] (No folder)</option>
                                {getFlattenedFolderOptions(folders).map(f => (
                                    <option key={f.id} value={f.id}>
                                        {'\u00A0'.repeat(f.depth * 3)}{f.depth > 0 ? '↳ ' : ''}{f.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setIsMoveModalOpen(false)
                                    setBookmarksToMove([])
                                }}
                                className="px-4 py-2 bg-background hover:bg-gray-800 text-primaryText border border-gray-700 rounded transition text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkMove}
                                className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded transition text-sm font-semibold"
                            >
                                Move Bookmarks
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
