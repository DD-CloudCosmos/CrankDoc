const stateKey='crankdocHistoryPosition'
const registry=Symbol.for('crankdoc.historyPositions')
type Position={chain:string;index:number}
type Tracker={retain:()=>()=>void;guard:(dirty:()=>boolean)=>()=>void}
function read(state:unknown):Position|null {
 if(!state || typeof state!=='object')return null
 const value=(state as Record<string,unknown>)[stateKey] as Position|undefined
 return value && typeof value.chain==='string' && Number.isSafeInteger(value.index)?value:null
}
function tracker(win:Window):Tracker {
 const host=win as unknown as Record<symbol,Tracker|undefined>
 if(host[registry])return host[registry]!
 const history=win.history,guards=new Set<()=>boolean>()
 const push=history.pushState,replace=history.replaceState
 let current=read(history.state),recovery:Position|null=null,references=0,listening=false,pushInstalled=false,replaceInstalled=false
 const fresh=():Position=>({chain:crypto.randomUUID(),index:0})
 const stamp=(state:unknown,position:Position)=>state===null || typeof state==='object' && !Array.isArray(state)?{...(state as object),[stateKey]:position}:state
 function pushed(data:unknown,unused:string,url?:string|URL|null) {
  const next=current?{...current,index:current.index+1}:fresh()
  push.call(history,stamp(data,next),unused,url);current=read(history.state)
 }
 function replaced(data:unknown,unused:string,url?:string|URL|null) {
  replace.call(history,stamp(data,current??fresh()),unused,url);current=read(history.state)
 }
 const same=(a:Position|null,b:Position|null)=>a && b && a.chain===b.chain && a.index===b.index
 function popped(event:PopStateEvent) {
  const target=read(event.state),previous=current
  current=target
  if(recovery && same(recovery,target)) {recovery=null;event.stopImmediatePropagation();return}
  recovery=null
  if(same(previous,target))return
  if(![...guards].some(dirty=>dirty()))return
  const known=previous && target && previous.chain===target.chain
  const message=known?'You have unsaved work. Leave this page?':'You have unsaved work. This earlier history entry cannot be restored automatically. Your input stays in this tab.'
  if(!known) {win.alert(message);return}
  if(win.confirm(message))return
  event.stopImmediatePropagation()
  recovery=previous
  history.go(previous.index-target.index)
 }
 function start() {
  if(listening)return
  // Preserve Next state and wrappers. No URL or private data is stored by the tracker.
  current=read(history.state)
  if(!pushInstalled) {history.pushState=pushed;pushInstalled=true}
  if(!replaceInstalled) {history.replaceState=replaced;replaceInstalled=true}
  history.replaceState(history.state,'')
  win.addEventListener('popstate',popped,true);listening=true
 }
 function stop() {
  if(references || guards.size)return
  win.removeEventListener('popstate',popped,true);listening=false
  if(history.pushState===pushed) {history.pushState=push;pushInstalled=false}
  if(history.replaceState===replaced) {history.replaceState=replace;replaceInstalled=false}
  // An outer framework wrapper may retain ours. Keep the registry to avoid stacking.
 }
 const value:Tracker={retain:()=>{references++;start();return()=>{references--;stop()}},guard:dirty=>{guards.add(dirty);start();return()=>{guards.delete(dirty);stop()}}}
 host[registry]=value
 return value
}
export function trackHistoryPositions(win:Window=window) {return tracker(win).retain()}
export function guardHistoryDeparture(dirty:()=>boolean,win:Window=window) {return tracker(win).guard(dirty)}
