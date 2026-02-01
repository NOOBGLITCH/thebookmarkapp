import { createContext, useContext, useState } from 'react'

const BookmarkContext = createContext({})

// eslint-disable-next-line react-refresh/only-export-components
export const useBookmarks = () => {
    const context = useContext(BookmarkContext)
    if (!context) {
        throw new Error('useBookmarks must be used within BookmarkProvider')
    }
    return context
}

export const BookmarkProvider = ({ children }) => {
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingBookmark, setEditingBookmark] = useState(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const openAddModal = () => setShowAddModal(true)
    const closeAddModal = () => {
        setShowAddModal(false)
        setEditingBookmark(null)
    }

    const openEditModal = (bookmark) => {
        setEditingBookmark(bookmark)
        setShowAddModal(true)
    }

    const triggerRefresh = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    const value = {
        showAddModal,
        editingBookmark,
        refreshTrigger,
        openAddModal,
        closeAddModal,
        openEditModal,
        triggerRefresh,
    }

    return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>
}
