/**
 * PostCSS Configuration
 * 
 * This configuration file sets up PostCSS processing for the PDF Keyword
 * Analyzer application. It includes Tailwind CSS and Autoprefixer plugins
 * for optimal CSS processing and browser compatibility.
 * 
 * Features:
 * - Tailwind CSS processing and purging
 * - Autoprefixer for cross-browser compatibility
 * - Optimized CSS output for production
 * 
 * @fileoverview PostCSS configuration for CSS processing
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

module.exports = {
  plugins: {
    // Tailwind CSS plugin for utility-first CSS framework
    tailwindcss: {},
    
    // Autoprefixer for adding vendor prefixes automatically
    autoprefixer: {},
  },
}
