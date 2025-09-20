'use client'

import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="group flex items-center justify-center w-12 h-12 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-gray-200/50 dark:border-gray-700/50"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
      ) : (
        <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300 group-hover:text-yellow-500 dark:group-hover:text-yellow-400 transition-colors duration-300" />
      )}
    </button>
  )
}
