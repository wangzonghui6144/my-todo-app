export interface User {
  id: string
  email: string
  name: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon?: string
  created_at: string
}

export interface Todo {
  id: string
  user_id: string
  category_id?: string
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  created_at: string
  updated_at: string
  category?: Category
}

export interface TodoFormData {
  title: string
  description?: string
  category_id?: string
  priority: 'low' | 'medium' | 'high'
  due_date?: string
}

export interface CategoryFormData {
  name: string
  color: string
  icon?: string
}