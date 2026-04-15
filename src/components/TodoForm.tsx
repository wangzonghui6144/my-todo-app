import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { TodoFormData, Category, Todo } from '@/types'
import { Button } from '@/components/ui/button'
import { X, CalendarIcon } from 'lucide-react'

const todoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.string().nullable().optional(),
})

interface TodoFormProps {
  onClose: () => void
  todo?: Todo
}

export default function TodoForm({ onClose, todo }: TodoFormProps) {
  const queryClient = useQueryClient()
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Fetch categories
  const { data: categories = [] } = useQuery({
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<TodoFormData>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      title: todo?.title || '',
      description: todo?.description || '',
      category_id: todo?.category_id || '',
      priority: todo?.priority || 'medium',
      due_date: todo?.due_date || '',
    },
  })

  // Create or update todo
  const todoMutation = useMutation({
    mutationFn: async (data: TodoFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const todoData = {
        user_id: user.id,
        ...data,
        updated_at: new Date().toISOString(),
      }

      if (todo) {
        // Update existing todo
        const { error } = await supabase
          .from('todos')
          .update(todoData)
          .eq('id', todo.id)

        if (error) throw error
      } else {
        // Create new todo
        const { error } = await supabase
          .from('todos')
          .insert({
            ...todoData,
            completed: false,
            created_at: new Date().toISOString(),
          })

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      onClose()
    },
    onError: (error) => {
      console.error('Todo mutation error:', error)
      alert('Failed to save todo: ' + error.message)
    },
  })

  const onSubmit = (data: TodoFormData) => {
    if (!data.title || data.title.trim() === '') {
      alert('Title is required!')
      return
    }

    // 清理空字符串，转换为 undefined (避免发送 null)
    const cleanData = {
      ...data,
      description: data.description?.trim() || undefined,
      category_id: data.category_id?.trim() || undefined,
      due_date: data.due_date?.trim() || undefined,
    }

    todoMutation.mutate(cleanData)
  }

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('due_date', e.target.value)
    setShowDatePicker(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {todo ? 'Edit Todo' : 'Add New Todo'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                {...register('title')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter todo title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter description (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                {...register('category_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <div className="relative">
                <input
                  {...register('due_date')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                  placeholder="Select due date (optional)"
                  value={watch('due_date') ? new Date(watch('due_date') || '').toLocaleDateString() : ''}
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  readOnly
                />
                <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />

                {showDatePicker && (
                  <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <input
                      type="date"
                      className="p-2 border-0 focus:ring-0"
                      onChange={handleDateSelect}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={todoMutation.isPending}
                className="flex-1"
              >
                {todoMutation.isPending ? 'Saving...' : (todo ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}