import { spawn } from 'node:child_process'
import { existsSync, lstatSync, readlinkSync, renameSync } from 'node:fs'
import { dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { loadGarageTestEnv } from './garage-test-env'

// Keep every Next.js autoload file out of the child lifetime, including live keys.
const mode=process.argv[2]??'dev'
if(!['dev','build','start'].includes(mode))throw new Error('Use dev, build or start')
for(const name of ['.env','.env.development','.env.development.local','.env.production','.env.production.local','.env.test','.env.test.local']) {
 if(existsSync(name))throw new Error(`Unexpected autoload environment file: ${name}`)
}
const local=loadGarageTestEnv()
const live='.env.local',excluded='.env.local.garage-runtime-excluded'
if(existsSync(excluded))throw new Error('An excluded environment file already exists; restore it before starting')
const original=existsSync(live)?lstatSync(live):null
const link=original?.isSymbolicLink()?readlinkSync(live):null
if(original)renameSync(live,excluded)
let restored=false
function restore() {
 if(restored)return
 restored=true
 if(original) {
  renameSync(excluded,live)
  if(lstatSync(live).ino!==original.ino || (link!==null&&readlinkSync(live)!==link))throw new Error('Environment restoration identity check failed')
 }
}
try {
 const child=spawn(process.execPath,['node_modules/next/dist/bin/next',mode,...(mode==='build'?[]:['--hostname','127.0.0.1','--port','3110'])],{
  env:{PATH:`${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,TMPDIR:tmpdir(),NODE_ENV:mode==='dev'?'development':'production',NEXT_TELEMETRY_DISABLED:'1',CI:'1',NEXT_PUBLIC_SUPABASE_URL:local.url,NEXT_PUBLIC_SUPABASE_ANON_KEY:local.anonKey,SUPABASE_SERVICE_ROLE_KEY:local.serviceKey,NEXT_PUBLIC_SITE_URL:'http://localhost:3110'},stdio:'inherit',
 })
 for(const signal of ['SIGINT','SIGTERM','SIGHUP'] as const)process.on(signal,()=>child.kill(signal))
 child.once('error',()=>{restore();process.exitCode=1})
 child.once('exit',(code,signal)=>{restore();process.exitCode=code??(signal?1:0)})
}catch(error){restore();throw error}
