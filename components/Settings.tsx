'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Download, 
  Trash2, 
  Save, 
  Eye, 
  EyeOff,
  Mail,
  Lock,
  Palette,
  Globe,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface UserSettings {
  name: string
  email: string
  notifications: {
    email: boolean
    push: boolean
    documentUpdates: boolean
    projectInvites: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private'
    showEmail: boolean
    allowCollaboration: boolean
  }
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    timezone: string
  }
  security: {
    twoFactorEnabled: boolean
    sessionTimeout: number
  }
}

export default function Settings() {
  const { data: session, update } = useSession()
  const [activeTab, setActiveTab] = useState('profile')
  const [settings, setSettings] = useState<UserSettings>({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    notifications: {
      email: true,
      push: true,
      documentUpdates: true,
      projectInvites: true
    },
    privacy: {
      profileVisibility: 'private',
      showEmail: false,
      allowCollaboration: true
    },
    preferences: {
      theme: 'system',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setSettings(prev => ({
        ...prev,
        name: session.user?.name || '',
        email: session.user?.email || ''
      }))
    }
  }, [session])

  const handleSave = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
        // Update session if name changed
        if (settings.name !== session?.user?.name) {
          await update({ name: settings.name })
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving settings' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      })

      if (response.ok) {
        await signOut({ callbackUrl: '/' })
      } else {
        setMessage({ type: 'error', text: 'Failed to delete account' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting account' })
    } finally {
      setIsLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleExportData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/export-data')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `user-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setMessage({ type: 'success', text: 'Data exported successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to export data' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error exporting data' })
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'data', label: 'Data & Privacy', icon: Database },
  ]

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        {session?.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || 'User'}
            className="w-20 h-20 rounded-full border-4 border-gray-200 dark:border-gray-600"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {session?.user?.name || 'User'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={settings.name}
            onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={settings.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Email cannot be changed
          </p>
        </div>
      </div>
    </div>
  )

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Notifications</h3>
        {Object.entries(settings.notifications).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {key === 'email' ? 'Email Notifications' :
                 key === 'push' ? 'Push Notifications' :
                 key === 'documentUpdates' ? 'Document Updates' :
                 'Project Invites'}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {key === 'email' ? 'Receive notifications via email' :
                 key === 'push' ? 'Receive browser push notifications' :
                 key === 'documentUpdates' ? 'Get notified when documents are updated' :
                 'Get notified about project invitations'}
              </p>
            </div>
            <button
              onClick={() => setSettings(prev => ({
                ...prev,
                notifications: { ...prev.notifications, [key]: !value }
              }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  const renderPrivacyTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Profile Visibility
            </label>
            <select
              value={settings.privacy.profileVisibility}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                privacy: { ...prev.privacy, profileVisibility: e.target.value as 'public' | 'private' }
              }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show Email Address
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Allow other users to see your email address
              </p>
            </div>
            <button
              onClick={() => setSettings(prev => ({
                ...prev,
                privacy: { ...prev.privacy, showEmail: !prev.privacy.showEmail }
              }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.privacy.showEmail ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.privacy.showEmail ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Allow Collaboration
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Allow other users to invite you to projects
              </p>
            </div>
            <button
              onClick={() => setSettings(prev => ({
                ...prev,
                privacy: { ...prev.privacy, allowCollaboration: !prev.privacy.allowCollaboration }
              }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.privacy.allowCollaboration ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.privacy.allowCollaboration ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance & Language</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme
            </label>
            <select
              value={settings.preferences.theme}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                preferences: { ...prev.preferences, theme: e.target.value as 'light' | 'dark' | 'system' }
              }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language
            </label>
            <select
              value={settings.preferences.language}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                preferences: { ...prev.preferences, language: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Timezone
          </label>
          <input
            type="text"
            value={settings.preferences.timezone}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
          />
        </div>
      </div>
    </div>
  )

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add an extra layer of security to your account
              </p>
            </div>
            <button
              onClick={() => setSettings(prev => ({
                ...prev,
                security: { ...prev.security, twoFactorEnabled: !prev.security.twoFactorEnabled }
              }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.security.twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Session Timeout (minutes)
            </label>
            <select
              value={settings.security.sessionTimeout}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
              }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={480}>8 hours</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDataTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Management</h3>
        
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Export Data</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Download all your data including documents, projects, and settings
                </p>
              </div>
              <button
                onClick={handleExportData}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-900 dark:text-red-300">Delete Account</h4>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileTab()
      case 'notifications': return renderNotificationsTab()
      case 'privacy': return renderPrivacyTab()
      case 'preferences': return renderPreferencesTab()
      case 'security': return renderSecurityTab()
      case 'data': return renderDataTab()
      default: return renderProfileTab()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your account preferences and settings</p>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Sidebar */}
            <div className="lg:w-64 border-r border-gray-200 dark:border-gray-700">
              <nav className="p-4 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              {renderTabContent()}

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {message && (
                      <div className={`flex items-center space-x-2 ${
                        message.type === 'success' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {message.type === 'success' ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                        <span className="text-sm">{message.text}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Account
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data, documents, and projects.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
