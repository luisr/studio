// src/hooks/use-auth.ts
import { useState, useEffect } from 'react'
import { AuthManager } from '@/lib/auth'
import type { User } from '@/lib/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = AuthManager.getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const login = (user: User) => {
    AuthManager.setCurrentUser(user)
    setUser(user)
  }

  const logout = () => {
    AuthManager.clearCurrentUser()
    setUser(null)
    AuthManager.redirectToLogin()
  }

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }
}