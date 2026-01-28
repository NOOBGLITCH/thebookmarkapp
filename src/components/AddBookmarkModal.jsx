import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useBookmarks } from '../context/BookmarkContext'
import { extractMetadata } from '../services/metadataService'
import TagInput from './TagInput'

export default function AddBookmarkModal() {
    const { user } = useAuth()
    const { showAddModal, closeAddModal, editingBookmark, triggerRefresh } = useBookmarks()
    const [url, setUrl] = useState('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [tags, setTags] = useState([])
    const [selectedFolderId, setSelectedFolderId] = useState(null)
    const [folders, setFolders] = useState([])
    const [loading, setLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (user) {
            fetchFolders()
        }
    }, [user])

    const fetchFolders = async () => {
        const { data } = await supabase.from('folders').select('id, name').eq('user_id', user.id).order('name')
        if (data) setFolders(data)
    }

    useEffect(() => {
        if (editingBookmark) {
            setUrl(editingBookmark.url || '')
            setTitle(editingBookmark.title || '')
            setDescription(editingBookmark.description || '')
            setSelectedFolderId(editingBookmark.folder_id || null)
            // Load existing tags if any
            fetchBookmarkTags(editingBookmark.id)
        } else {
            setUrl('')
            setTitle('')
            setDescription('')
            setTags([])
            setSelectedFolderId(null)
        }
    }, [editingBookmark])

    const fetchBookmarkTags = async (bookmarkId) => {
        try {
            const { data, error } = await supabase
                .from('bookmark_tags')
                .select('tags(name)')
                .eq('bookmark_id', bookmarkId)

            if (error) throw error
            const tagNames = data.map(item => item.tags.name)
            setTags(tagNames)
        } catch (error) {
            console.error('Error fetching tags:', error)
        }
    }

    const handleAutoFillMetadata = async () => {
        if (!url) {
            setError('Please enter a URL first')
            return
        }

        setAiLoading(true)
        setError('')

        try {
            // Extract metadata from URL
            const metadata = await extractMetadata(url)

            // Show warning if there was an error but we have fallback data
            if (metadata.error) {
                setError(`Note: ${metadata.error}`)
            }

            // Populate fields if empty
            if (!title && metadata.title) {
                setTitle(metadata.title)
            }

            if (!description && metadata.description) {
                setDescription(metadata.description)
            }

            // Add suggested tags
            if (metadata.suggestedTags && metadata.suggestedTags.length > 0) {
                setTags([...new Set([...tags, ...metadata.suggestedTags])])
            }

            // Clear error if we successfully got some data
            if (metadata.title || metadata.description || metadata.suggestedTags?.length > 0) {
                if (!metadata.error) {
                    setError('')
                }
            }
        } catch (error) {
            console.error('Metadata Extraction Error:', error)
            const errorMessage = error.message || 'Failed to extract metadata. Please fill in the details manually.'
            setError(errorMessage)
        } finally {
            setAiLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Check for duplicate URL (only for new bookmarks)
            if (!editingBookmark) {
                const { data: existingBookmark } = await supabase
                    .from('bookmarks')
                    .select('id, title')
                    .eq('user_id', user.id)
                    .eq('url', url)
                    .single()

                if (existingBookmark) {
                    setError(`This URL is already bookmarked as "${existingBookmark.title}"`)
                    setLoading(false)
                    return
                }
            }

            let bookmarkId = editingBookmark?.id

            if (editingBookmark) {
                // Update existing bookmark
                const { error } = await supabase
                    .from('bookmarks')
                    .update({
                        url,
                        title,
                        description,
                        folder_id: selectedFolderId,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingBookmark.id)

                if (error) throw error
            } else {
                // Create new bookmark
                const { data, error } = await supabase
                    .from('bookmarks')
                    .insert({
                        user_id: user.id,
                        url,
                        title,
                        description,
                        folder_id: selectedFolderId
                    })
                    .select()
                    .single()

                if (error) throw error
                bookmarkId = data.id
            }

            // Handle tags with optimized batch operations
            if (tags.length > 0) {
                // Delete existing tags for this bookmark
                await supabase
                    .from('bookmark_tags')
                    .delete()
                    .eq('bookmark_id', bookmarkId)

                // Get or create all tags in parallel
                const tagPromises = tags.map(async (tagName) => {
                    // Try to get existing tag
                    let { data: existingTag } = await supabase
                        .from('tags')
                        .select('id')
                        .eq('name', tagName)
                        .eq('user_id', user.id)
                        .maybeSingle()

                    if (existingTag) {
                        return existingTag.id
                    } else {
                        // Create new tag
                        const { data: newTag, error: tagError } = await supabase
                            .from('tags')
                            .insert({ name: tagName, user_id: user.id })
                            .select('id')
                            .single()

                        if (tagError) throw tagError
                        return newTag.id
                    }
                })

                const tagIds = await Promise.all(tagPromises)

                // Batch insert bookmark_tag relationships
                const bookmarkTagInserts = tagIds.map(tagId => ({
                    bookmark_id: bookmarkId,
                    tag_id: tagId,
                }))

                await supabase
                    .from('bookmark_tags')
                    .insert(bookmarkTagInserts)
            }

            // Trigger refresh instead of page reload
            triggerRefresh()
            // Trigger tag refresh immediately
            window.dispatchEvent(new CustomEvent('refreshTags'))
            closeAddModal()
        } catch (error) {
            console.error('Error saving bookmark:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!showAddModal) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-primaryText">
                        {editingBookmark ? 'Edit Bookmark' : 'Add Bookmark'}
                    </h2>
                    <button
                        onClick={closeAddModal}
                        className="text-secondaryText hover:text-primaryText transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="url" className="block text-sm font-medium mb-2">
                            URL *
                        </label>
                        <input
                            id="url"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                            className="w-full px-4 py-2 bg-background border border-gray-700 rounded focus:outline-none focus:border-accent text-primaryText"
                            placeholder="https://example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="title" className="block text-sm font-medium mb-2">
                            Title
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-background border border-gray-700 rounded focus:outline-none focus:border-accent text-primaryText"
                            placeholder="Bookmark title"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 bg-background border border-gray-700 rounded focus:outline-none focus:border-accent text-primaryText resize-none"
                            placeholder="Add a description..."
                        />
                    </div>

                    <TagInput tags={tags} setTags={setTags} />

                    <div>
                        <label htmlFor="folder" className="block text-sm font-medium mb-2">
                            Folder (Optional)
                        </label>
                        <select
                            id="folder"
                            value={selectedFolderId || ''}
                            onChange={(e) => setSelectedFolderId(e.target.value || null)}
                            className="w-full px-4 py-2 bg-background border border-gray-700 rounded focus:outline-none focus:border-accent text-primaryText"
                        >
                            <option value="">No Folder</option>
                            {folders.map(folder => (
                                <option key={folder.id} value={folder.id}>
                                    {folder.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={handleAutoFillMetadata}
                        disabled={aiLoading || !url}
                        className="w-full py-2 px-4 bg-background hover:bg-gray-800 text-accent border border-accent rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {aiLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Extracting...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                Auto-Fill Metadata
                            </>
                        )}
                    </button>

                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            type="button"
                            onClick={closeAddModal}
                            className="px-6 py-2 bg-background hover:bg-gray-800 text-primaryText rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : editingBookmark ? 'Update' : 'Add Bookmark'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
