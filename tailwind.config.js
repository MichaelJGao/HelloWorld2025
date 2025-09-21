/**
 * Tailwind CSS Configuration
 * 
 * This configuration file customizes Tailwind CSS for the PDF Keyword
 * Analyzer application. It includes custom colors, animations, and
 * dark mode support optimized for the application's design system.
 * 
 * Features:
 * - Custom primary color palette
 * - Dark mode support with class-based switching
 * - Custom animations and keyframes
 * - Content path configuration for all file types
 * - Extended theme customization
 * 
 * @fileoverview Tailwind CSS configuration with custom design system
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Content paths for Tailwind CSS purging
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  // Dark mode configuration using class-based switching
  darkMode: 'class',
  
  // Extended theme configuration
  theme: {
    extend: {
      // Custom primary color palette
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      
      // Custom animations for enhanced user experience
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      
      // Custom keyframes for animations
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  
  // Tailwind CSS plugins (none currently used)
  plugins: [],
}
