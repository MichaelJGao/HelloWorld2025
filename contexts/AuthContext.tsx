/**
 * Authentication Context
 * 
 * This context provides authentication state management for the PDF Keyword
 * Analyzer application. It wraps NextAuth.js session data and provides
 * convenient access to user information and authentication status.
 * 
 * Features:
 * - User authentication state management
 * - Loading state handling
 * - Authentication status checking
 * - Session data integration with NextAuth.js
 * - Type-safe context consumption
 * 
 * @fileoverview React context for authentication state management
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Interface for authentication context data
 */
interface AuthContextType {
  user: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
  loading: boolean
  isAuthenticated: boolean
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Authentication Provider Component
 * 
 * This component provides authentication context to all child components.
 * It manages user session state and loading states using NextAuth.js.
 * 
 * @param children - React child components to wrap with auth context
 * @returns JSX element with authentication context provider
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)

  // Handle loading state based on NextAuth session status
  useEffect(() => {
    if (status !== 'loading') {
      setLoading(false)
    }
  }, [status])

  // Prepare context value with user data and authentication status
  const value = {
    user: session?.user || null,
    loading,
    isAuthenticated: !!session?.user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Custom hook to access authentication context
 * 
 * This hook provides easy access to authentication state throughout the
 * application. It includes error handling to ensure it's used within
 * the proper provider context.
 * 
 * @returns Authentication context data
 * @throws Error if used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
