import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'


const AuthContext = createContext({})

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signUp = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: undefined },
            })
            if (error) return { data: null, error }
            return { data, error }
        } catch (err) {
            const msg = err?.message || String(err)
            if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed to fetch')) {
                return {
                    data: null,
                    error: {
                        message: 'FETCH_FAILED',
                    },
                }
            }
            return { data: null, error: { message: msg } }
        }
    }

    const signIn = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            return { data, error }
        } catch (err) {
            const msg = err?.message || String(err)
            if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed to fetch')) {
                return {
                    data: null,
                    error: {
                        message: 'FETCH_FAILED',
                    },
                }
            }
            return { data: null, error: { message: msg } }
        }
    }

    const getSupabaseUrl = () => typeof import.meta.env?.VITE_SUPABASE_URL === 'string' ? import.meta.env.VITE_SUPABASE_URL : ''

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        return { error }
    }

    const signInWithGoogle = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            })
            return { data, error }
        } catch (err) {
            return { data: null, error: { message: err?.message || String(err) } }
        }
    }

    const value = {
        user,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        getSupabaseUrl,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
