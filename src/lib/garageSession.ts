const eventName='garage-explicit-sign-out'
const channelName='garage-session-events'
/** Only the explicit, successful logout flow sends this non-private signal. */
export function announceGarageSignOut() {
 window.dispatchEvent(new Event(eventName))
 if(typeof window.BroadcastChannel==='function') {
  const channel=new window.BroadcastChannel(channelName)
  channel.postMessage('explicit-sign-out');channel.close()
 }
}
export function onGarageSignOut(callback:()=>void) {
 window.addEventListener(eventName,callback)
 const channel=typeof window.BroadcastChannel==='function'?new window.BroadcastChannel(channelName):null
 if(channel)channel.onmessage=event=>{if(event.data==='explicit-sign-out')callback()}
 return()=>{window.removeEventListener(eventName,callback);channel?.close()}
}
