import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Todo, Category } from '@/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Trash2Icon, EditIcon, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

export default function TodoList() {
  const queryClient = useQueryClient()

  // Fetch todos
  const { data: todos = [], isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('todos')
        .select(`*, category:categories(*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as (Todo & { category: Category })[]
    },
  })

  // Update todo completion status
  const updateTodoMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('todos')
        .update({ completed, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  // Delete todo
  const deleteTodoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  const handleToggleComplete = (todo: Todo) => {
    updateTodoMutation.mutate({
      id: todo.id,
      completed: !todo.completed,
    })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      deleteTodoMutation.mutate(id)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading todos...</p>
      </div>
    )
  }

  if (todos.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No todos yet. Create your first todo!</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {todos.map((todo) => (
        <div key={todo.id} className="p-6 hover:bg-gray-50">
          <div className="flex items-start space-x-3">
            <Checkbox
              checked={todo.completed}
              onCheckedChange={() => handleToggleComplete(todo)}
              className="mt-1"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {todo.title}
                </h3>

                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                    {todo.priority}
                  </span>

                  {todo.category && (
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: todo.category.color }}
                    >
                      {todo.category.name}
                    </span>
                  )}
                </div>
              </div>

              {todo.description && (
                <p className={`mt-1 text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                  {todo.description}
                </p>
              )}

              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {todo.due_date && (
                    <div className="flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      Due: {format(new Date(todo.due_date), 'MMM dd, yyyy')}
                    </div>
                  )}
                  <span>Created: {format(new Date(todo.created_at), 'MMM dd, yyyy')}</span>
                </div>

                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-600"
                    onClick={() => handleDelete(todo.id)}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}