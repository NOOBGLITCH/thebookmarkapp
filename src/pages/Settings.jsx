import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-primaryText mb-8">Settings</h1>

                {success && (
                    <div className="mb-4 p-3 bg-accent/10 border border-accent rounded text-accent text-sm">
                        {success}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
                        {error}
                    </div>
                )}

                {/* Data Management Section */}
                <div className="bg-surface rounded-lg p-6 mb-6 border-l-4 border-green-500">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-primaryText">Data Management</h2>
                            <p className="text-xs text-secondaryText">Import or export your bookmarks</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Import */}
                        <div className="p-4 bg-background rounded-lg border border-gray-700">
                            <h3 className="text-sm font-semibold text-primaryText mb-2">Import Bookmarks</h3>
                            <p className="text-xs text-secondaryText mb-4">Import bookmarks from Chrome, Firefox, or Edge (HTML file).</p>

                            <label className="flex items-center justify-center w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-primaryText rounded cursor-pointer transition border border-gray-600 border-dashed">
                                <span className="text-sm">Choose File...</span>
                                <input
                                    type="file"
                                    accept=".html"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (!file) return

                                        try {
                                            setLoading(true)
                                            const text = await file.text()
                                            // Simple parser for Netscape Bookmark File Format
                                            const parser = new DOMParser()
                                            const doc = parser.parseFromString(text, 'text/html')
                                            const links = Array.from(doc.getElementsByTagName('a'))

                                            let count = 0
                                            for (const link of links) {
                                                const url = link.href
                                                const title = link.textContent

                                                if (url && title) {
                                                    await supabase.from('bookmarks').insert({
                                                        user_id: user.id,
                                                        url,
                                                        title,
                                                        description: 'Imported'
                                                    })
                                                    count++
                                                }
                                            }

                                            setSuccess(`Successfully imported ${count} bookmarks!`)
                                            setTimeout(() => setSuccess(''), 3000)
                                        } catch (error) {
                                            console.error('Import failed:', error)
                                            setError('Import failed: ' + error.message)
                                        } finally {
                                            setLoading(false)
                                            e.target.value = null
                                        }
                                    }}
                                />
                            </label>
                        </div>

                        {/* Export */}
                        <div className="p-4 bg-background rounded-lg border border-gray-700">
                            <h3 className="text-sm font-semibold text-primaryText mb-2">Export Data</h3>
                            <p className="text-xs text-secondaryText mb-4">Download all your bookmarks as a JSON file.</p>

                            <button
                                onClick={async () => {
                                    try {
                                        setLoading(true)
                                        const { data, error } = await supabase
                                            .from('bookmarks')
                                            .select('*, tags(name), folders(name)')
                                            .eq('user_id', user.id)

                                        if (error) throw error

                                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                                        const url = URL.createObjectURL(blob)
                                        const a = document.createElement('a')
                                        a.href = url
                                        a.download = `flowmark-export-${new Date().toISOString().split('T')[0]}.json`
                                        document.body.appendChild(a)
                                        a.click()
                                        document.body.removeChild(a)
                                        URL.revokeObjectURL(url)

                                        setSuccess('Export started!')
                                        setTimeout(() => setSuccess(''), 3000)
                                    } catch (error) {
                                        console.error('Export failed:', error)
                                        setError('Export failed: ' + error.message)
                                    } finally {
                                        setLoading(false)
                                    }
                                }}
                                className="w-full px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded transition flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export JSON
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account Section */}
                <div className="bg-surface rounded-lg p-6 border-l-4 border-accent">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center">
                            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-primaryText">Account</h2>
                            <p className="text-xs text-secondaryText">Manage your account settings</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-secondaryText mb-2">Email</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                readOnly
                                className="w-full px-4 py-2 bg-background border border-gray-700 rounded text-primaryText"
                            />
                        </div>

                        <button
                            onClick={async () => {
                                try {
                                    await supabase.auth.signOut()
                                    window.location.href = '/login'
                                } catch (error) {
                                    setError('Failed to sign out')
                                }
                            }}
                            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
