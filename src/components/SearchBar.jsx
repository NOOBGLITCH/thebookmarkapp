import { useBookmarks } from '../context/BookmarkContext'

export default function SearchBar({ searchQuery, setSearchQuery }) {
    const { openAddModal } = useBookmarks()

    const handleSearch = (e) => {
        e.preventDefault()
    }

    return (
        <div className="p-8 pb-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex gap-4 items-center">
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="relative">
                            <svg
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondaryText"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search bookmarks by title, URL, description, or tags..."
                                className="w-full pl-12 pr-4 py-3 bg-surface border border-gray-700 rounded-lg focus:outline-none focus:border-accent text-primaryText"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-secondaryText hover:text-primaryText"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </form>
                    <button
                        onClick={openAddModal}
                        className="px-6 py-3 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg transition flex items-center gap-2 whitespace-nowrap"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Bookmark
                    </button>
                </div>
            </div>
        </div>
    )
}
