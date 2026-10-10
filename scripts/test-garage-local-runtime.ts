import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, lstatSync, readlinkSync, readdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { setTimeout as pause } from 'node:timers/promises'
import { createServer } from 'node:net'
import { loadGarageTestEnv } from './garage-test-env'
async function main() {
 loadGarageTestEnv()
 const live='.env.local',excluded='.env.local.garage-runtime-excluded'
 const original=lstatSync(live),link=original.isSymbolicLink()?readlinkSync(live):null
 const launch=()=>spawn(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/start-garage-local.ts','start'],{env:{PATH:`${dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,TMPDIR:tmpdir()},stdio:'ignore'})
 const restored=()=>{assert.equal(existsSync(excluded),false);assert.equal(lstatSync(live).ino,original.ino);if(link!==null)assert.equal(readlinkSync(live),link)}
 const exited=(child:ReturnType<typeof launch>)=>new Promise<number|null>(resolve=>child.once('exit',resolve))
 // An occupied port produces a real child failure and must restore the same file.
 const blocker=createServer();await new Promise<void>(resolve=>blocker.listen(3110,'127.0.0.1',resolve))
 const failed=launch();assert.notEqual(await exited(failed),0);restored();await new Promise<void>(resolve=>blocker.close(()=>resolve()))
 console.log('PASS: isolated launcher restores original symlink after child failure')
 const child=launch();const completion=exited(child)
 try {
  let ready=false
  for(let i=0;i<100;i++) {if(child.exitCode!==null)throw new Error('Runtime exited');try{const response=await fetch('http://127.0.0.1:3110/garage');assert.equal(response.status,200);ready=true;break}catch{await pause(100)}}
  assert.ok(ready);assert.equal(existsSync(live),false);assert.equal(existsSync(excluded),true)
  const account=await fetch('http://127.0.0.1:3110/account');const html=await account.text();assert.ok(html.includes('Sign in'))
  const chunks=readdirSync('.next/static/chunks').filter(name=>name.endsWith('.js')).map(name=>`/_next/static/chunks/${name}`)
  let local=false
  for(const path of chunks){const js=await (await fetch(new URL(path,'http://127.0.0.1:3110'))).text();if(js.includes(loadGarageTestEnv().url))local=true}
  assert.ok(local,'Built browser bundle points to the loopback project')
  console.log('PASS: loopback port 3110 HTTP garage/account and browser bundle targets local project; live env absent for child lifetime')
 } finally {child.kill('SIGTERM');await completion;restored()}
 console.log('PASS: isolated launcher restores original symlink after interruption')
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Local runtime smoke failed');process.exitCode=1})
