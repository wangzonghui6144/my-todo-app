import { createClient } from '@/lib/supabase/client'
import type { ListMember, MemberRole } from '@/types/database'

export async function fetchListMembers(listId: string): Promise<ListMember[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('list_members')
    .select('*')
    .eq('list_id', listId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as ListMember[]
}

export async function fetchPendingInvites(): Promise<ListMember[]> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('list_members')
    .select('*')
    .eq('status', 'pending')
    .ilike('invited_email', user.email)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as ListMember[]
}

export async function inviteToList(input: {
  listId: string
  email: string
  role: Exclude<MemberRole, 'owner'>
}): Promise<ListMember> {
  const email = input.email.trim().toLowerCase()
  if (!email.includes('@')) throw new Error('Invalid email')

  const supabase = createClient()
  const { data, error } = await supabase
    .from('list_members')
    .insert({
      list_id: input.listId,
      invited_email: email,
      role: input.role,
      status: 'pending',
      user_id: null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as ListMember
}

export async function respondToInvite(
  memberId: string,
  status: 'accepted' | 'declined'
): Promise<ListMember> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('list_members')
    .update({
      user_id: user.id,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', memberId)
    .eq('status', 'pending')
    .select('*')
    .single()
  if (error) throw error
  return data as ListMember
}

export async function removeListMember(memberId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('list_members')
    .delete()
    .eq('id', memberId)
  if (error) throw error
}
