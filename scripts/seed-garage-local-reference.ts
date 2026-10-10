import { createClient } from '@supabase/supabase-js'
import { loadGarageTestEnv } from './garage-test-env'
import cb1000r from '../data/motorcycles/honda-cb1000r-2008.json'
import cb650ra from '../data/motorcycles/honda-cb650ra-2023.json'
import type { Database } from '../src/types/database.types'
async function main() {
 const local=loadGarageTestEnv() // Refuses non-loopback targets before any write.
 const client=createClient<Database>(local.url,local.serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
 const rows=[cb1000r,cb650ra].map(({id,make,model,year_start,year_end,image_url})=>({id,make,model,year_start,year_end,image_url}))
 const {error}=await client.from('motorcycles').upsert(rows,{onConflict:'id'})
 if(error)throw new Error('Local reference setup failed')
 console.log('PASS: two public reference model identities available locally; no accounts or private bikes created')
}
main().catch(()=>{console.error('Local reference setup failed');process.exitCode=1})
