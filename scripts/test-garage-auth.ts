import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { loadGarageTestEnv } from './garage-test-env'

async function main() {
  const { url, anonKey, serviceKey } = loadGarageTestEnv()
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
  // In-memory storage represents one browser retaining its PKCE verifier.
  const values = new Map<string, string>()
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) }, removeItem: (key: string) => { values.delete(key) } }
  const client = createClient(url, anonKey, { auth: { flowType: 'pkce', storage, persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } })
  const mailbox = new URL(url)
  mailbox.port = '54324'
  const email = `garage-confirm-${crypto.randomUUID()}@example.test`
  const password = `Local-${crypto.randomUUID()}!`
  let userId: string | undefined
  async function emailLink(type: 'signup' | 'recovery') {
    for (let attempt = 0; attempt < 20; attempt++) {
      const listing = await fetch(new URL('/api/v1/messages', mailbox)).then(r => r.json()) as { messages: { ID: string; To: { Address: string }[] }[] }
      for (const message of listing.messages.filter(message => message.To.some(to => to.Address === email))) {
        const detail = await fetch(new URL(`/api/v1/message/${message.ID}`, mailbox)).then(r => r.json()) as { Text: string; HTML: string }
        const links = `${detail.Text} ${detail.HTML}`.match(/https?:\/\/[^\s"<>]+/g) ?? []
        const link = links.map(link => link.replaceAll('&amp;', '&')).find(link => link.includes('/auth/v1/verify') && link.includes(`type=${type}`))
        if (link) {
          const parsed = new URL(link)
          assert.equal(parsed.origin, new URL(url).origin)
          return parsed.toString()
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error(`Local ${type} email did not arrive`)
  }
  async function callbackCode(link: string) {
    const response = await fetch(link, { redirect: 'manual' })
    assert.equal(response.status, 303)
    const location = response.headers.get('location')
    assert.ok(location)
    const callback = new URL(location)
    assert.equal(callback.origin, 'http://localhost:3110')
    assert.equal(callback.pathname, '/auth/callback')
    assert.ok(callback.searchParams.get('code'))
    return callback.searchParams.get('code')!
  }
  try {
    assert.ok((await client.auth.signUp({ email: `weak-${email}`, password: 'short' })).error)
    const signup = await client.auth.signUp({ email, password, options: { emailRedirectTo: 'http://localhost:3110/auth/callback' } })
    assert.equal(signup.error, null)
    assert.equal(signup.data.session, null)
    userId = signup.data.user?.id
    assert.ok(userId)
    assert.ok((await client.auth.signInWithPassword({ email, password })).error)
    const signupCode = await callbackCode(await emailLink('signup'))
    const otherBrowser = createClient(url, anonKey, { auth: { flowType: 'pkce', persistSession: false } })
    assert.ok((await otherBrowser.auth.exchangeCodeForSession(signupCode)).error)
    const confirmed = await client.auth.exchangeCodeForSession(signupCode)
    assert.equal(confirmed.error, null)
    assert.ok(confirmed.data.session)
    await client.auth.signOut()
    const recovery = await client.auth.resetPasswordForEmail(email, { redirectTo: 'http://localhost:3110/auth/callback?next=/account/reset-password' })
    assert.equal(recovery.error, null)
    const recovered = await client.auth.exchangeCodeForSession(await callbackCode(await emailLink('recovery')))
    assert.equal(recovered.error, null)
    assert.ok(recovered.data.session)
    const replacement = `Changed-${crypto.randomUUID()}!`
    assert.equal((await client.auth.updateUser({ password: replacement })).error, null)
    await client.auth.signOut()
    assert.ok((await client.auth.signInWithPassword({ email, password })).error)
    assert.equal((await client.auth.signInWithPassword({ email, password: replacement })).error, null)
    console.log('PASS: local minimum password, mandatory email confirmation, mailbox links, same-browser PKCE requirement, recovery, password replacement')
  } finally {
    await client.auth.signOut()
    if (userId) assert.equal((await admin.auth.admin.deleteUser(userId)).error, null)
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Local auth test failed'); process.exitCode = 1 })
