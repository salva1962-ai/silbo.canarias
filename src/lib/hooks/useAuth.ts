import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { User, Session } from '@supabase/supabase-js'

interface AuthUser {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'manager' | 'commercial'
  zone: 'las_palmas' | 'tenerife' | 'todas'
  permissions: string[]
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Escuchar cambios de autenticación
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await loadUserProfile(session.user.id)
      } else {
        setAuthUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error loading user profile:', error)
        return
      }

      if (data) {
        setAuthUser({
          id: userId,
          email: user?.email || '',
          fullName: data.full_name || '',
          role: data.role || 'commercial',
          zone: data.zone || 'todas',
          permissions: data.permissions || []
        })
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error)
    }
  }

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error }
  }

  const signInWithOTP = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setAuthUser(null)
      setSession(null)
    }
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    })
    return { error }
  }

  // Funciones de permisos
  const hasRole = (role: AuthUser['role']) => {
    return authUser?.role === role
  }

  const hasPermission = (permission: string) => {
    return authUser?.permissions?.includes(permission) || false
  }

  const canAccess = (resource: string, action: 'read' | 'write' | 'delete') => {
    if (!authUser) return false
    
    // Admin puede todo
    if (authUser.role === 'admin') return true
    
    // Manager puede leer todo, escribir en su zona
    if (authUser.role === 'manager') {
      if (action === 'read') return true
      return authUser.zone === 'todas' // Solo si es manager general
    }
    
    // Comercial solo puede acceder a su zona
    if (authUser.role === 'commercial') {
      return action === 'read' || action === 'write' // No delete para comerciales
    }
    
    return false
  }

  return {
    user,
    authUser,
    session,
    loading,
    signInWithPassword,
    signInWithOTP,
    signOut,
    resetPassword,
    hasRole,
    hasPermission,
    canAccess,
    isAuthenticated: !!user,
    isAdmin: authUser?.role === 'admin',
    isManager: authUser?.role === 'manager',
    isCommercial: authUser?.role === 'commercial'
  }
}