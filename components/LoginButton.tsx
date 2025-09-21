'use client'

import React from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { LogIn, LogOut, User, Loader2 } from 'lucide-react'

interface LoginButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export default function LoginButton({ 
  className = '', 
  variant = 'default',
  size = 'md' 
}: LoginButtonProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <button
        disabled
        className={`flex items-center justify-center px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 ${className}`}
      >
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </button>
    )
  }

  if (session) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {session.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
            {session.user?.name || session.user?.email}
          </span>
        </div>
        <button
          onClick={() => signOut()}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 ${
            variant === 'outline'
              ? 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              : variant === 'ghost'
              ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
          } ${className}`}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn('google')}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 ${
        variant === 'outline'
          ? 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
          : variant === 'ghost'
          ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
      } ${className}`}
    >
      <LogIn className="h-4 w-4 mr-2" />
      Sign in with Google
    </button>
  )
}
