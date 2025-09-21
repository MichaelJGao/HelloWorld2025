/**
 * Sign In Page Component
 * 
 * This page provides authentication functionality for the PDF Keyword Analyzer
 * application. It supports both Google OAuth and development credentials
 * authentication with a modern, responsive UI design.
 * 
 * Key Features:
 * - Google OAuth integration for production authentication
 * - Development credentials provider for testing
 * - Session checking and automatic redirects
 * - Responsive design with dark mode support
 * - Loading states and error handling
 * - Feature showcase and privacy information
 * 
 * @fileoverview Authentication page with Google OAuth and development mode
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

'use client'

import React from 'react'

// Force dynamic rendering to ensure fresh authentication state
export const dynamic = 'force-dynamic'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FileText, ArrowLeft, Loader2 } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

/**
 * Sign In Page Component
 * 
 * This component renders the authentication interface with support for
 * multiple authentication providers and development mode testing.
 * 
 * State Management:
 * - loading: Controls button loading states during authentication
 * - isCheckingSession: Manages initial session verification state
 * 
 * @returns JSX element containing the complete sign-in interface
 */
export default function SignIn() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  /**
   * Check for existing session on component mount
   * 
   * Automatically redirects authenticated users to the home page
   * and shows the sign-in form for unauthenticated users.
   */
  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push('/')
      } else {
        setIsCheckingSession(false)
      }
    })
  }, [router])

  /**
   * Handle Google OAuth sign-in
   * 
   * Initiates Google OAuth flow with loading state management
   * and error handling.
   */
  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signIn('google', { callbackUrl: '/' })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle development credentials sign-in
   * 
   * Processes form submission for development mode authentication
   * with any email/password combination for testing purposes.
   * 
   * @param e - Form submission event
   */
  const handleCredentialsSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      await signIn('credentials', {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        callbackUrl: '/'
      })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </button>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center px-6 py-20">
        <div className="max-w-md w-full">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to PDF Analyzer
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Sign in to access collaboration features and save your documents
              </p>
            </div>

            {/* Google Sign In Button */}
            {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
            )}

            {/* Development Sign In Form */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 text-center">
                Development Mode
              </h3>
              <form onSubmit={handleCredentialsSignIn} className="space-y-3">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter any email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Enter any password"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Signing in...' : 'Sign In (Dev Mode)'}
                </button>
              </form>
            </div>

            {/* Features */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                What you'll get:
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                  Save and organize your PDF analyses
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>
                  Collaborate with team members
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></div>
                  Access your documents from anywhere
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-3"></div>
                  Share insights with colleagues
                </li>
              </ul>
            </div>

            {/* Privacy Note */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Privacy:</strong> We only access your basic profile information (name and email) 
                to provide you with a personalized experience. Your documents and analyses remain private.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
