import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AppIndexPage() {
  const supabase = await createClient()
  const { data: list, error } = await supabase
    .from('lists')
    .select('id')
    .eq('is_default', true)
    .single()
  if (error || !list) redirect('/login')
  redirect(`/list/${list.id}`)
}
