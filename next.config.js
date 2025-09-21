/**
 * Next.js Configuration
 * 
 * This configuration file customizes Next.js behavior for the PDF Keyword
 * Analyzer application. It includes webpack modifications to handle PDF.js
 * dependencies and other build optimizations.
 * 
 * Features:
 * - Webpack alias configuration for PDF.js compatibility
 * - Canvas and encoding module exclusions
 * - Build optimization settings
 * 
 * @fileoverview Next.js configuration with PDF.js compatibility
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpack configuration for PDF.js compatibility
  webpack: (config) => {
    // Disable canvas and encoding modules that cause issues with PDF.js
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
}

module.exports = nextConfig
