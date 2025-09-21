/**
 * Settings Page Component
 * 
 * This page provides access to application settings and user preferences.
 * It renders the Settings component which handles user configuration,
 * theme preferences, and account management.
 * 
 * Key Features:
 * - User settings and preferences management
 * - Theme configuration
 * - Account settings
 * - Application configuration options
 * 
 * @fileoverview Settings page wrapper component
 * @author PDF Keyword Analyzer Team
 * @version 1.0.0
 */

import Settings from '@/components/Settings'

/**
 * Settings Page Component
 * 
 * This component serves as a wrapper for the Settings component,
 * providing a dedicated page for user settings and preferences.
 * 
 * @returns JSX element containing the Settings component
 */
export default function SettingsPage() {
  return <Settings />
}
