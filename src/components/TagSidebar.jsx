import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function TagSidebar({ onSelectTag, selectedTag }) {
    const { user } = useAuth()
    const [tags, setTags] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateTag, setShowCreateTag] = useState(false)
    const [newTagName, setNewTagName] = useState('')
    const [menuOpenId, setMenuOpenId] = useState(null)
    const menuRef = useRef(null)

    useEffect(() => {
        if (user) {
            fetchTags()
        }

        // Listen for tag refresh events
        const handleRefreshTags = () => {
            fetchTags()
        }
        window.addEventListener('refreshTags', handleRefreshTags)

        // Close menu/input when clicking outside
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpenId(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            window.removeEventListener('refreshTags', handleRefreshTags)
        }
    }, [user])

    const fetchTags = async () => {
        try {
            const { data, error } = await supabase
                .from('tags')
                .select(`
          id,
          name,
          is_public,
          bookmark_tags(count)
        `)
                .eq('user_id', user.id)
                .order('name')

            if (error) throw error

            const tagsWithCounts = data.map(tag => ({
                ...tag,
                count: tag.bookmark_tags?.length || 0
            }))

            // Filter out tags with 0 bookmarks (orphaned tags)
            const activeTags = tagsWithCounts.filter(tag => tag.count > 0)

            console.log('🏷️ Tags fetched:', tagsWithCounts.length, 'Active:', activeTags.length)
            setTags(activeTags)
        } catch (error) {
            console.error('Error fetching tags:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return

        try {
            const { data, error } = await supabase
                .from('tags')
                .insert({
                    name: newTagName.trim(),
                    user_id: user.id,
                    is_public: false
                })
                .select()
                .single()

            if (error) throw error

            setTags([...tags, { ...data, count: 0 }])
            setNewTagName('')
            setShowCreateTag(false)
        } catch (error) {
            console.error('Error creating tag:', error)
            alert('Failed to create tag (might be duplicate)')
        }
    }

    const toggleTagVisibility = async (tag) => {
        try {
            const { error } = await supabase
                .from('tags')
                .update({ is_public: !tag.is_public })
                .eq('id', tag.id)

            if (error) throw error

            setTags(tags.map(t =>
                t.id === tag.id ? { ...t, is_public: !t.is_public } : t
            ))
            setMenuOpenId(null)
        } catch (error) {
            console.error('Error updating tag:', error)
        }
    }

    const deleteTag = async (tagId) => {
        if (!confirm('Delete this tag? Bookmarks will not be deleted.')) return

        try {
            const { error } = await supabase
                .from('tags')
                .delete()
                .eq('id', tagId)

            if (error) throw error

            setTags(tags.filter(t => t.id !== tagId))
            setMenuOpenId(null)
            if (selectedTag === tags.find(t => t.id === tagId)?.name) {
                onSelectTag(null)
            }
        } catch (error) {
            console.error('Error deleting tag:', error)
        }
    }

    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className="mb-6 border-t border-gray-800 pt-4">
            <div className="px-3 mb-2">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between group"
                >
                    <div className="flex items-center gap-2">
                        <span className={`material-icons-round text-secondaryText transition-transform ${isExpanded ? 'rotate-90' : ''}`}>chevron_right</span>
                        <h3 className="text-xs font-semibold text-secondaryText uppercase tracking-wide">
                            Tags ({tags.length})
                        </h3>
                    </div>

                    <div
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowCreateTag(true)
                            setIsExpanded(true)
                        }}
                        className="text-secondaryText hover:text-accent opacity-0 group-hover:opacity-100 transition p-1"
                        title="Create Tag"
                    >
                        <span className="material-icons-round text-lg">add</span>
                    </div>
                </button>
            </div>

            {showCreateTag && (
                <div className="mb-3 flex items-center gap-2 px-4 ml-4">
                    <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
                        placeholder="New tag..."
                        className="flex-1 min-w-0 px-2 py-1 bg-background border border-gray-700 rounded text-sm text-primaryText focus:outline-none focus:border-accent"
                        autoFocus
                    />
                    <button onClick={handleCreateTag} className="text-green-500"><span className="material-icons-round">check</span></button>
                    <button onClick={() => setShowCreateTag(false)} className="text-red-500"><span className="material-icons-round">close</span></button>
                </div>
            )}

            {isExpanded && (
                <div className="pl-2">
                    {loading ? (
                        <p className="px-3 text-secondaryText text-sm">Loading...</p>
                    ) : tags.length === 0 ? (
                        <p className="px-3 text-secondaryText text-sm ml-6">No tags yet</p>
                    ) : (
                        <ul className="space-y-0.5">
                            {/* All Tags Option inside Semantic List */}
                            <li>
                                <button
                                    onClick={() => onSelectTag(null)}
                                    className={`w-full text-left px-3 py-2 rounded transition text-sm flex items-center justify-between ${!selectedTag
                                        ? 'bg-accent/20 text-accent font-medium'
                                        : 'text-secondaryText hover:bg-gray-800 hover:text-primaryText'
                                        }`}
                                >
                                    <span className="ml-6">Show All</span>
                                </button>
                            </li>

                            {tags.map(tag => (
                                <li key={tag.id} className="relative group">
                                    <div
                                        className={`flex items-center justify-between px-3 py-1.5 rounded transition text-sm ${selectedTag === tag.name
                                            ? 'bg-accent/20 text-accent font-medium'
                                            : 'text-secondaryText hover:bg-gray-800 hover:text-primaryText'
                                            }`}
                                    >
                                        <button
                                            onClick={() => onSelectTag(tag.name)}
                                            className="flex-1 flex items-center gap-2 truncate text-left pl-6"
                                        >
                                            <span className="material-icons-round text-sm opacity-70 scale-75">label</span>
                                            <span className="truncate">{tag.name}</span>
                                            {tag.is_public && (
                                                <span className="material-icons-round text-xs text-blue-400">public</span>
                                            )}
                                        </button>

                                        <div className="flex items-center gap-1">
                                            <span className="text-xs bg-background/50 px-1.5 py-0.5 rounded opacity-60">{tag.count}</span>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setMenuOpenId(menuOpenId === tag.id ? null : tag.id)
                                                }}
                                                className="p-0.5 hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center"
                                            >
                                                <span className="material-icons-round text-base">more_horiz</span>
                                            </button>
                                        </div>
                                    </div>
                                    {/* Menu (Same as before) */}
                                    {menuOpenId === tag.id && (
                                        <div ref={menuRef} className="absolute right-0 top-full mt-1 w-48 bg-surface border border-gray-700 rounded shadow-xl z-50 py-1">
                                            <button
                                                onClick={() => toggleTagVisibility(tag)}
                                                className="w-full text-left px-4 py-2 text-sm text-primaryText hover:bg-gray-800 flex items-center gap-2"
                                            >
                                                <span className="material-icons-round text-base">
                                                    {tag.is_public ? 'lock' : 'public'}
                                                </span>
                                                {tag.is_public ? 'Make Private' : 'Make Public'}
                                            </button>
                                            <button
                                                onClick={() => deleteTag(tag.id)}
                                                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-800 flex items-center gap-2"
                                            >
                                                <span className="material-icons-round text-base">delete</span>
                                                Delete Tag
                                            </button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}
