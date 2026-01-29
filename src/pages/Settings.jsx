import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [folders, setFolders] = useState([])
    const [tags, setTags] = useState([])
    const [exportFormat, setExportFormat] = useState('json')
    const [exportScope, setExportScope] = useState('full')
    const [exportScopeId, setExportScopeId] = useState('')

    useEffect(() => {
        if (!user?.id) return
        Promise.all([
            supabase.from('folders').select('id, name').eq('user_id', user.id).order('name'),
            supabase.from('tags').select('id, name').eq('user_id', user.id).order('name')
        ]).then(([foldersRes, tagsRes]) => {
            if (foldersRes.data) setFolders(foldersRes.data)
            if (tagsRes.data) setTags(tagsRes.data)
        })
    }, [user?.id])

    const buildImportPayloadFromHtml = (text) => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(text, 'text/html')
        const links = Array.from(doc.getElementsByTagName('a'))
        const bookmarks = links
            .filter((link) => link.href && link.href.startsWith('http'))
            .map((link) => ({
                url: link.href,
                title: (link.textContent || '').trim() || link.href,
                description: 'Imported'
            }))
        return { bookmarks, options: { dedupe_by_url: true } }
    }

    const buildImportPayloadFromJson = (text) => {
        const parsed = JSON.parse(text)
        const list = Array.isArray(parsed) ? parsed : parsed.bookmarks || []
        const bookmarks = list.map((b) => ({
            url: b.url || b.href,
            title: b.title || b.url || '',
            description: b.description || '',
            folder_name: b.folder_name || b.folder || null,
            tag_names: b.tag_names || b.tags || []
        })).filter((b) => b.url)
        return { bookmarks, options: { dedupe_by_url: true } }
    }

    const handleImport = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            setLoading(true)
            setError('')
            setSuccess('')
            const text = await file.text()
            let payload
            const ext = (file.name || '').toLowerCase()
            if (ext.endsWith('.json')) {
                payload = buildImportPayloadFromJson(text)
            } else {
                payload = buildImportPayloadFromHtml(text)
            }
            const { data, error: rpcError } = await supabase.rpc('import_bookmarks', { payload })
            if (rpcError) throw rpcError
            const inserted = data?.inserted ?? 0
            const skipped = data?.skipped ?? 0
            setSuccess(`Imported ${inserted} bookmarks${skipped ? `, ${skipped} skipped (duplicates)` : ''}.`)
            setTimeout(() => setSuccess(''), 4000)
        } catch (err) {
            console.error('Import failed:', err)
            setError('Import failed: ' + (err.message || 'Unknown error'))
        } finally {
            setLoading(false)
            e.target.value = null
        }
    }

    const handleExport = async () => {
        try {
            setLoading(true)
            setError('')
            setSuccess('')
            const scopeId = exportScope === 'full' ? null : exportScopeId || null
            if ((exportScope === 'folder' || exportScope === 'tag') && !scopeId) {
                setError('Please select a folder or tag to export.')
                return
            }
            const { data, error: rpcError } = await supabase.rpc('export_bookmarks', {
                format: exportFormat,
                scope: exportScope,
                scope_id: scopeId
            })
            if (rpcError) throw rpcError
            const content = data?.content ?? ''
            const mime = data?.mime_type || 'application/octet-stream'
            const ext = exportFormat === 'html' ? 'html' : exportFormat === 'csv' ? 'csv' : 'json'
            const blob = new Blob([content], { type: mime })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `flowmark-export-${new Date().toISOString().split('T')[0]}.${ext}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            setSuccess('Export started!')
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            console.error('Export failed:', err)
            setError('Export failed: ' + (err.message || 'Unknown error'))
        } finally {
            setLoading(false)
        }
    }

    const handleBackup = async () => {
        try {
            setLoading(true)
            setError('')
            setSuccess('')
            const { data, error: rpcError } = await supabase.rpc('snapshot_bookmarks')
            if (rpcError) throw rpcError
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `flowmark-backup-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            setSuccess('Backup downloaded!')
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            console.error('Backup failed:', err)
            setError('Backup failed: ' + (err.message || 'Unknown error'))
        } finally {
            setLoading(false)
        }
    }

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
                            <p className="text-xs text-secondaryText">Import, export, or backup your bookmarks</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Import */}
                        <div className="p-4 bg-background rounded-lg border border-gray-700">
                            <h3 className="text-sm font-semibold text-primaryText mb-2">Import Bookmarks</h3>
                            <p className="text-xs text-secondaryText mb-4">HTML (Chrome/Firefox/Edge) or JSON. Deduplicates by URL.</p>
                            <label className="flex items-center justify-center w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-primaryText rounded cursor-pointer transition border border-gray-600 border-dashed">
                                <span className="text-sm">Choose File (.html or .json)</span>
                                <input
                                    type="file"
                                    accept=".html,.json"
                                    className="hidden"
                                    onChange={handleImport}
                                    disabled={loading}
                                />
                            </label>
                        </div>

                        {/* Export */}
                        <div className="p-4 bg-background rounded-lg border border-gray-700">
                            <h3 className="text-sm font-semibold text-primaryText mb-2">Export</h3>
                            <p className="text-xs text-secondaryText mb-3">Format and scope</p>
                            <div className="space-y-2 mb-3">
                                <select
                                    value={exportFormat}
                                    onChange={(e) => setExportFormat(e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-gray-700 rounded text-primaryText text-sm"
                                >
                                    <option value="json">JSON</option>
                                    <option value="html">HTML</option>
                                    <option value="csv">CSV</option>
                                </select>
                                <select
                                    value={exportScope}
                                    onChange={(e) => { setExportScope(e.target.value); setExportScopeId('') }}
                                    className="w-full px-3 py-2 bg-background border border-gray-700 rounded text-primaryText text-sm"
                                >
                                    <option value="full">Full account</option>
                                    <option value="folder">Folder</option>
                                    <option value="tag">Tag</option>
                                </select>
                                {exportScope === 'folder' && (
                                    <select
                                        value={exportScopeId}
                                        onChange={(e) => setExportScopeId(e.target.value)}
                                        className="w-full px-3 py-2 bg-background border border-gray-700 rounded text-primaryText text-sm"
                                    >
                                        <option value="">Select folder</option>
                                        {folders.map((f) => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                )}
                                {exportScope === 'tag' && (
                                    <select
                                        value={exportScopeId}
                                        onChange={(e) => setExportScopeId(e.target.value)}
                                        className="w-full px-3 py-2 bg-background border border-gray-700 rounded text-primaryText text-sm"
                                    >
                                        <option value="">Select tag</option>
                                        {tags.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <button
                                onClick={handleExport}
                                disabled={loading}
                                className="w-full px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Backup */}
                    <div className="mt-4 p-4 bg-background rounded-lg border border-gray-700">
                        <h3 className="text-sm font-semibold text-primaryText mb-2">Backup snapshot</h3>
                        <p className="text-xs text-secondaryText mb-3">Download full data (bookmarks, folders, tags, shares) as JSON. Store locally or in cloud.</p>
                        <button
                            onClick={handleBackup}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-primaryText rounded transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            Download backup
                        </button>
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
                                } catch (err) {
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
