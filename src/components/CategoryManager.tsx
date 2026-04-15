import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Category, CategoryFormData } from '@/types'
import { Button } from '@/components/ui/button'
import { PlusIcon, EditIcon, Trash2Icon } from 'lucide-react'

interface CategoryManagerProps {
  isModal?: boolean
}

const predefinedColors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#64748b', '#6b7280', '#374151'
]

export default function CategoryManager({ isModal = false }: CategoryManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const queryClient = useQueryClient()

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Category[]
    },
  })

  // Create category
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('categories')
        .insert({
          ...data,
          user_id: user.id,
          created_at: new Date().toISOString(),
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setShowForm(false)
    },
    onError: (error) => {
      console.error('Create category error:', error)
      alert('Failed to create category: ' + error.message)
    },
  })

  // Update category
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoryFormData }) => {
      const { error } = await supabase
        .from('categories')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setEditingCategory(null)
      setShowForm(false)
    },
    onError: (error) => {
      console.error('Update category error:', error)
      alert('Failed to update category: ' + error.message)
    },
  })

  // Delete category
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string

    if (!name || name.trim() === '') {
      alert('Category name is required!')
      return
    }

    const data: CategoryFormData = {
      name: name.trim(),
      color: formData.get('color') as string,
      icon: (formData.get('icon') as string)?.trim() || undefined,
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data })
    } else {
      createCategoryMutation.mutate(data)
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setShowForm(true)
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading categories...</div>
  }

  return (
    <div className="space-y-4">
      {/* Category List */}
      <div className="space-y-2">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="font-medium text-gray-900">{category.name}</span>
              {category.icon && (
                <span className="text-lg">{category.icon}</span>
              )}
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleEdit(category)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <EditIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <Trash2Icon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Category Button */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          variant="outline"
          className="w-full"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      )}

      {/* Category Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <input
              name="name"
              type="text"
              defaultValue={editingCategory?.name || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter category name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon (optional)
            </label>
            <input
              name="icon"
              type="text"
              defaultValue={editingCategory?.icon || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="🌟 (emoji or icon name)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="grid grid-cols-10 gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  name="color"
                  value={color}
                  onClick={() => {
                    const hiddenInput = document.querySelector('input[name="color"]') as HTMLInputElement
                    if (hiddenInput) {
                      hiddenInput.value = color
                    }
                  }}
                  className={`w-6 h-6 rounded-full border-2 ${
                    editingCategory?.color === color || (!editingCategory && color === predefinedColors[0])
                      ? 'border-gray-900'
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input
              name="color"
              type="hidden"
              defaultValue={editingCategory?.color || predefinedColors[0]}
            />
          </div>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false)
                setEditingCategory(null)
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              className="flex-1"
            >
              {createCategoryMutation.isPending ? 'Creating...' : updateCategoryMutation.isPending ? 'Updating...' : (editingCategory ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}