import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
const [major,minor,patch]=process.versions.node.split('.').map(Number)
assert.ok(major>22 || (major===22 && (minor>22 || (minor===22 && patch>=1))), 'Node 22.22.1 or newer is required')
assert.equal(typeof globalThis.WebSocket,'function','Native WebSocket is required')
const client=createClient('http://127.0.0.1:54321','runtime-construction-only',{auth:{persistSession:false,autoRefreshToken:false}})
assert.ok(client.auth && client.realtime,'Supabase client construction must succeed without a network request')
console.log(`PASS: Node ${process.versions.node}, native WebSocket and Supabase client construction`)
