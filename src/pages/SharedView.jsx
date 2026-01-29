import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function BookmarkCard({ bookmark }) {
    return (
        <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-surface rounded-lg overflow-hidden border border-gray-800 hover:border-accent transition group block"
        >
            <div className="aspect-video overflow-hidden bg-gray-800 relative group-hover:opacity-100 transition">
                <img
                    src={`https://s0.wp.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=600&h=400`}
                    alt={`Screenshot of ${bookmark.url}`}
                    className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition duration-500"
                    loading="lazy"
                    onError={(e) => {
                        e.target.style.objectFit = 'contain'
                        e.target.style.padding = '20px'
                        e.target.src = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=128`
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface/80 to-transparent opacity-0 group-hover:opacity-40 transition" />
            </div>
            <div className="p-4">
                <h2 className="text-lg font-semibold mb-1 group-hover:text-accent transition truncate">{bookmark.title || bookmark.url}</h2>
                <p className="text-secondaryText text-sm mb-3 line-clamp-2">{bookmark.description}</p>
                <span className="text-xs text-gray-500 font-mono truncate block">{new URL(bookmark.url).hostname}</span>
            </div>
        </a>
    )
}

export default function SharedView() {
    const { token } = useParams()
    const location = useLocation()
    const type = location.pathname.match(/^\/shared\/(bookmark|folder|tag)\//)?.[1] || 'tag'

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!token) {
            setError('Invalid link')
            setLoading(false)
            return
        }
        fetchShared()
    }, [token, type])

    const fetchShared = async () => {
        try {
            setLoading(true)
            setError(null)
            const rpcName = type === 'bookmark' ? 'get_shared_bookmark' : type === 'folder' ? 'get_shared_folder' : 'get_shared_tag'
            const params = type === 'bookmark' ? { token_input: token } : { token_input: token }

            if (type === 'bookmark') {
                const { data: rows, error: rpcError } = await supabase.rpc(rpcName, params)
                if (rpcError) throw rpcError
                if (!rows || rows.length === 0) throw new Error('Invalid or expired link')
                setData({ bookmarks: rows, title: rows[0]?.title || 'Bookmark', subtitle: 'Shared link' })
            } else {
                const { data: payload, error: rpcError } = await supabase.rpc(rpcName, params)
                if (rpcError) throw rpcError
                if (!payload) throw new Error('Invalid or expired link')
                const key = type === 'folder' ? 'folder' : 'tag'
                const node = payload[key]
                const bookmarks = payload.bookmarks || []
                setData({
                    bookmarks,
                    title: node?.name || (type === 'folder' ? 'Folder' : 'Tag'),
                    subtitle: type === 'folder' ? 'Shared folder' : 'Public shared collection'
                })
            }
        } catch (err) {
            console.error('Error fetching shared content:', err)
            setError(err.message || 'Invalid or expired link')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-primaryText flex items-center justify-center">
                <p>Loading shared content...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background text-primaryText flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
                <p className="text-secondaryText mb-6">{error}</p>
                <Link to="/" className="px-4 py-2 bg-accent text-white rounded-lg">Go Home</Link>
            </div>
        )
    }

    const bookmarks = data?.bookmarks || []
    const title = data?.title || ''
    const subtitle = data?.subtitle || ''

    return (
        <div className="min-h-screen bg-background text-primaryText">
            <div className="max-w-4xl mx-auto p-8">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <span className="text-accent">{type === 'tag' ? '#' : type === 'folder' ? '' : ''}</span>
                            {title}
                        </h1>
                        <p className="text-secondaryText mt-1">{subtitle}</p>
                    </div>
                    <Link to="/" className="text-sm text-accent hover:underline">Try FlowMark</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookmarks.map((bookmark) => (
                        <BookmarkCard key={bookmark.id} bookmark={bookmark} />
                    ))}
                    {bookmarks.length === 0 && (
                        <p className="text-secondaryText text-center py-12 col-span-3">No bookmarks in this collection.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
