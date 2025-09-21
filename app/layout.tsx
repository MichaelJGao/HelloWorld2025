/**
 * Root Layout Component
 * 
 * This is the main layout component that wraps all pages in the application.
 * It provides the basic HTML structure, font configuration, and global providers.
 * 
 * Features:
 * - Sets up the Inter font from Google Fonts
 * - Configures global metadata for SEO
 * - Provides theme context and authentication providers
 * - Applies global styling with dark mode support
 * 
 * @fileoverview Root layout component for the PDF Keyword Analyzer application
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import React from 'react'
import { Providers } from '@/components/Providers'

// Configure Inter font with Latin subset for optimal performance
const inter = Inter({ subsets: ['latin'] })

// Global metadata for SEO and social sharing
export const metadata: Metadata = {
  title: 'PDF Keyword Analyzer',
  description: 'Upload PDFs and get intelligent keyword summaries with hover tooltips',
}

/**
 * RootLayout Component
 * 
 * The main layout wrapper that provides:
 * - HTML structure with proper language attribute
 * - Font configuration
 * - Global providers (theme, auth, etc.)
 * - Responsive background with dark mode support
 * 
 * @param children - React nodes to be rendered inside the layout
 * @returns JSX element containing the complete page structure
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Global providers for theme, authentication, and other contexts */}
        <Providers>
          {/* Main content wrapper with responsive background and dark mode support */}
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
