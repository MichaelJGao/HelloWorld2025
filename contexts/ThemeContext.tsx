/**
 * Theme Context
 * 
 * This context provides theme management for the PDF Keyword Analyzer application.
 * It handles light/dark mode switching with persistence and system preference detection.
 * 
 * Features:
 * - Light and dark theme support
 * - Local storage persistence
 * - System preference detection
 * - Dynamic theme switching
 * - CSS class management
 * - Type-safe context consumption
 * 
 * @fileoverview React context for theme management and dark mode support
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

/**
 * Theme type definition
 */
type Theme = 'light' | 'dark'

/**
 * Interface for theme context data
 */
interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

// Create the theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * Theme Provider Component
 * 
 * This component provides theme context to all child components.
 * It manages theme state, persistence, and system preference detection.
 * 
 * @param children - React child components to wrap with theme context
 * @returns JSX element with theme context provider
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Check system preference for dark mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
  }, [])

  // Apply theme to document and persist to localStorage
  useEffect(() => {
    // Update the document class and save to localStorage
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  /**
   * Toggles between light and dark themes
   */
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Custom hook to access theme context
 * 
 * This hook provides easy access to theme state and toggle function
 * throughout the application. It includes error handling to ensure
 * it's used within the proper provider context.
 * 
 * @returns Theme context data with current theme and toggle function
 * @throws Error if used outside of ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
