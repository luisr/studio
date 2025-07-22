// src/lib/auth.ts
import type { User } from './types'

export class AuthManager {
  private static readonly STORAGE_KEY = 'currentUser'

  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null
    
    try {
      const userJson = sessionStorage.getItem(this.STORAGE_KEY)
      return userJson ? JSON.parse(userJson) : null
    } catch {
      return null
    }
  }

  static setCurrentUser(user: User): void {
    if (typeof window === 'undefined') return
    
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(user))
    } catch (error) {
      console.error('Failed to save user to session storage:', error)
    }
  }

  static clearCurrentUser(): void {
    if (typeof window === 'undefined') return
    
    try {
      sessionStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear user from session storage:', error)
    }
  }

  static redirectToLogin(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }
}