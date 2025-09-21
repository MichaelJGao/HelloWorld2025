/**
 * Authentication Configuration
 * 
 * This module configures NextAuth.js for user authentication in the PDF Keyword
 * Analyzer application. It supports multiple authentication providers including
 * Google OAuth and development credentials.
 * 
 * Features:
 * - Google OAuth integration for production authentication
 * - Development credentials provider for testing
 * - Prisma database adapter for user management
 * - JWT session strategy for stateless authentication
 * - Custom session and JWT callbacks
 * - Custom authentication pages
 * 
 * @fileoverview NextAuth.js configuration for user authentication
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'

// Initialize Prisma client for database operations
const prisma = new PrismaClient()

/**
 * NextAuth.js configuration options
 * 
 * This configuration sets up authentication providers, database adapter,
 * session management, and custom callbacks for the application.
 */
export const authOptions: NextAuthOptions = {
  // Use Prisma adapter for database integration
  adapter: PrismaAdapter(prisma),
  
  // Configure authentication providers
  providers: [
    // Google OAuth provider (conditional based on environment variables)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    
    // Development credentials provider for testing
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Development-only authentication - allows any email/password combination
        if (credentials?.email && credentials?.password) {
          return {
            id: 'dev-user',
            email: credentials.email,
            name: 'Development User',
            image: null
          }
        }
        return null
      }
    })
  ],
  
  // Custom callbacks for session and JWT management
  callbacks: {
    /**
     * Session callback - adds user ID to session object
     */
    async session({ session, user }) {
      if (session.user && user) {
        (session.user as any).id = user.id
      }
      return session
    },
    
    /**
     * JWT callback - adds user ID to JWT token
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  
  // Custom authentication pages
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  // Session configuration
  session: {
    strategy: 'jwt', // Use JWT strategy for stateless authentication
  },
  
  // Secret for JWT signing
  secret: process.env.NEXTAUTH_SECRET,
}
