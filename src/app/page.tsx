'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import TodoList from '@/components/TodoList'
import TodoForm from '@/components/TodoForm'
import CategoryManager from '@/components/CategoryManager'
import { PlusIcon, UserIcon, SettingsIcon } from 'lucide-react'

export default function Home() {
  const { user, isLoading, signOut } = useAuthStore()
  const router = useRouter()
  const [showTodoForm, setShowTodoForm] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth')
    }
  }, [user, isLoading, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">My Todos</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">{user.name || user.email}</span>
              </div>

              <button
                onClick={() => setShowCategoryManager(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <SettingsIcon className="h-5 w-5" />
              </button>

              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Todo List */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Tasks</h2>
                  <button
                    onClick={() => setShowTodoForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Task
                  </button>
                </div>
              </div>

              <TodoList />
            </div>
          </div>

          {/* Sidebar for filters/categories */}
          <div className="w-full lg:w-80">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Categories</h3>
              <CategoryManager />
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showTodoForm && (
        <TodoForm onClose={() => setShowTodoForm(false)} />
      )}

      {showCategoryManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Manage Categories</h2>
                <button
                  onClick={() => setShowCategoryManager(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <CategoryManager isModal />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}