/**
 * Authentication Error Page Component
 * 
 * This page displays authentication errors to users with appropriate
 * error messages and recovery options. It handles various NextAuth.js
 * error types and provides user-friendly error descriptions.
 * 
 * Key Features:
 * - Dynamic error message display based on error type
 * - User-friendly error descriptions
 * - Recovery options (retry, go home)
 * - Responsive design with dark mode support
 * - Help text for troubleshooting
 * 
 * @fileoverview Authentication error page with error handling and recovery
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

'use client'

import React from 'react'

// Force dynamic rendering to ensure fresh error state
export const dynamic = 'force-dynamic'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * Authentication Error Page Component
 * 
 * This component displays authentication errors with appropriate messaging
 * and recovery options based on the error type from URL parameters.
 * 
 * @returns JSX element containing the error display interface
 */
export default function AuthError() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error')

  /**
   * Get user-friendly error message based on error type
   * 
   * Maps NextAuth.js error codes to human-readable error messages
   * for better user experience and troubleshooting guidance.
   * 
   * @param error - Error code from URL parameters
   * @returns Human-readable error message
   */
  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'Access was denied. You may have cancelled the sign-in process.'
      case 'Verification':
        return 'The verification token has expired or has already been used.'
      case 'Default':
        return 'An error occurred during authentication.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-8 text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Error
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {getErrorMessage(error)}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/auth/signin')}
              className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Try Again
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold rounded-lg transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              If you continue to experience issues, please check your internet connection 
              and try again. For persistent problems, contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
