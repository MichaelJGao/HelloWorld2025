/**
 * MongoDB Database Connection Utility
 * 
 * This module provides MongoDB database connection management for the PDF Keyword
 * Analyzer application. It handles both development and production environments
 * with proper connection pooling and HMR (Hot Module Replacement) support.
 * 
 * Features:
 * - Environment-specific connection handling
 * - HMR support for development mode
 * - Connection pooling and reuse
 * - Database abstraction layer
 * - Error handling and connection management
 * 
 * @fileoverview MongoDB connection utility with environment-specific handling
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

import { MongoClient, Db } from 'mongodb'

// MongoDB connection URI with fallback for development
const uri = process.env.MONGODB_URI || 'mongodb+srv://a:123@cluster0.lipbze4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
const options = {}

// Client and promise variables for connection management
let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // Development mode: Use global variable to preserve connection across HMR
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // Production mode: Create new connection without global variable
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Export the MongoDB client promise for use across the application
export default clientPromise

/**
 * Gets the MongoDB database instance
 * 
 * This function returns the database instance for the PDF analyzer application.
 * It uses the shared client connection to ensure efficient connection pooling.
 * 
 * @returns Promise resolving to MongoDB database instance
 */
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise
  return client.db('pdf-analyzer')
}