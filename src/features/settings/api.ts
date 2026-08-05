import { createClient } from '@/lib/supabase/client'
import type { Locale, Profile } from '@/types/database'

export async function fetchProfile(): Promise<Profile | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  if (error) throw error
  return data as Profile | null
}

export async function updateProfileSettings(input: {
  locale?: Locale
  theme?: string
}): Promise<Profile> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select('*')
    .single()
  if (error) throw error
  return data as Profile
}
