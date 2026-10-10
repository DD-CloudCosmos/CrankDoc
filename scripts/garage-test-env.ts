import { readFileSync } from 'node:fs'
import { parse } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database.types'

export function loadGarageTestEnv(): { url: string; anonKey: string; serviceKey: string } {
  const values = parse(readFileSync('.env.garage.local'))
  const url = values.API_URL
  if (!url) throw new Error('Missing local API_URL')
  const parsed = new URL(url)
  if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || !['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) throw new Error('Garage tests require a loopback API URL')
  if (!values.ANON_KEY || !values.SERVICE_ROLE_KEY) throw new Error('Missing local test keys')
  return { url, anonKey: values.ANON_KEY, serviceKey: values.SERVICE_ROLE_KEY }
}

export async function createLocalTestClients() {
  const { url, anonKey, serviceKey } = loadGarageTestEnv()
  const options = { auth: { persistSession: false, autoRefreshToken: false } }
  const admin = createClient<Database>(url, serviceKey, options)
  const a = createClient<Database>(url, anonKey, options)
  const b = createClient<Database>(url, anonKey, options)
  const userIds: string[] = []
  const modelId = crypto.randomUUID()
  const cleanup = async () => {
    await Promise.all([a.auth.signOut(), b.auth.signOut()])
    for (const id of userIds) {
      const { error } = await admin.auth.admin.deleteUser(id)
      if (error) throw error
    }
    const { error } = await admin.from('motorcycles').delete().eq('id', modelId)
    if (error) throw error
  }
  try {
    for (const client of [a, b]) {
      const email = `garage-${crypto.randomUUID()}@example.test`
      const password = `Local-${crypto.randomUUID()}!`
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
      if (error || !data.user) throw error ?? new Error('User setup failed')
      userIds.push(data.user.id)
      const signedIn = await client.auth.signInWithPassword({ email, password })
      if (signedIn.error) throw signedIn.error
    }
    const { error } = await admin.from('motorcycles').insert({ id: modelId, make: 'Honda', model: 'CB650RA', year_start: 2023, year_end: 2023, image_url: '/images/bikes/honda-cb650ra-2023.png' })
    if (error) throw error
    return { a, b, admin, userA: userIds[0], userB: userIds[1], modelId, cleanup }
  } catch (error) {
    await cleanup()
    throw error
  }
}
