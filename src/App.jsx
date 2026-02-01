import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { BookmarkProvider } from './context/BookmarkContext'
import ProtectedRoute from './components/ProtectedRoute'
import RedirectIfAuthenticated from './components/RedirectIfAuthenticated'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import BookmarksView from './pages/BookmarksView'
import FavoritesView from './pages/FavoritesView'
import Settings from './pages/Settings'
import AddBookmarkModal from './components/AddBookmarkModal'
import InstallPWA from './components/InstallPWA'
import Landing from './pages/Landing'
import SharedView from './pages/SharedView'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BookmarkProvider>
          <Routes>
            <Route path="/" element={<RedirectIfAuthenticated><Landing /></RedirectIfAuthenticated>} />
            <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
            <Route path="/signup" element={<RedirectIfAuthenticated><Signup /></RedirectIfAuthenticated>} />
            <Route path="/shared/bookmark/:token" element={<SharedView />} />
            <Route path="/shared/folder/:token" element={<SharedView />} />
            <Route path="/shared/tag/:token" element={<SharedView />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<BookmarksView />} />
              <Route path="favorites" element={<FavoritesView />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
          <AddBookmarkModal />
          <InstallPWA />
        </BookmarkProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
