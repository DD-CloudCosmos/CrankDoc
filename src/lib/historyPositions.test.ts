import { JSDOM } from 'jsdom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { guardHistoryDeparture, trackHistoryPositions } from './historyPositions'
let dom:JSDOM,win:Window,stop:()=>void,unguard:()=>void,dirty:boolean
async function traversed(delta:number) {
 win.history.go(delta)
 // Native jsdom traversal and the compensating traversal each run asynchronously.
 await new Promise(resolve=>setTimeout(resolve,40))
}
beforeEach(()=>{dom=new JSDOM('',{url:'https://example.com/A'});win=dom.window as unknown as Window;dirty=false;win.confirm=vi.fn().mockReturnValue(false);win.alert=vi.fn();stop=trackHistoryPositions(win);unguard=guardHistoryDeparture(()=>dirty,win)})
afterEach(()=>{unguard();stop();dom.window.close()})
it('preserves native state and restores cancelled Back without adding an entry',async()=>{
 win.history.replaceState({__NA:true,tree:{page:'A'}},'','/A');win.history.pushState({__NA:true,tree:{page:'B'}},'','/B');win.history.pushState({__NA:true,tree:{page:'C'}},'','/C')
 const length=win.history.length;dirty=true;await traversed(-1)
 expect(win.location.pathname).toBe('/C');expect(win.history.length).toBe(length);expect(win.history.state.tree).toEqual({page:'C'})
 dirty=false;await traversed(-1);expect(win.location.pathname).toBe('/B')
 await traversed(-1);expect(win.location.pathname).toBe('/A')
})
it('restores cancelled Forward and retains the original Back destination',async()=>{
 win.history.pushState({__NA:true},'','/B');win.history.pushState({__NA:true},'','/C');await traversed(-1)
 dirty=true;await traversed(1);expect(win.location.pathname).toBe('/B');expect(win.history.length).toBe(3)
 expect(win.confirm).toHaveBeenCalledTimes(1)
 dirty=false;await traversed(-1);expect(win.location.pathname).toBe('/A');await traversed(2);expect(win.location.pathname).toBe('/C')
})
it('compensates an indexed multi-entry traversal by its exact delta',async()=>{
 for(const page of ['B','C','D'])win.history.pushState({page},'',`/${page}`)
 dirty=true;await traversed(-3);expect(win.location.pathname).toBe('/D');expect(win.history.length).toBe(4)
 dirty=false;await traversed(-2);expect(win.location.pathname).toBe('/B')
})
it('warns for unknown preexisting entries without guessing or mutating the stack',async()=>{
 unguard();stop();dom.window.close()
 dom=new JSDOM('',{url:'https://example.com/earlier'});win=dom.window as unknown as Window;win.history.pushState({existing:'kept'},'','/current')
 win.confirm=vi.fn().mockReturnValue(false);win.alert=vi.fn();stop=trackHistoryPositions(win);dirty=true;unguard=guardHistoryDeparture(()=>dirty,win)
 const go=vi.spyOn(win.history,'go');await traversed(-1)
 expect(win.location.pathname).toBe('/earlier');expect(win.history.length).toBe(2);expect(go).toHaveBeenCalledTimes(1)
 expect(win.alert).toHaveBeenCalledWith(expect.stringContaining('cannot be restored automatically'))
 expect(win.confirm).not.toHaveBeenCalled()
})
it('does not stack wrappers during cleanup and remount',()=>{
 const wrapped=win.history.pushState;const another=trackHistoryPositions(win);another();expect(win.history.pushState).toBe(wrapped)
 unguard();stop();stop=trackHistoryPositions(win);unguard=guardHistoryDeparture(()=>dirty,win)
 expect(win.history.pushState).toBe(wrapped)
})
it('preserves outer framework wrappers through cleanup and remount',async()=>{
 const innerPush=win.history.pushState,innerReplace=win.history.replaceState
 const outerPush:History['pushState']=vi.fn(function(data,unused,url){innerPush.call(win.history,{...data,framework:'kept'},unused,url)})
 const outerReplace:History['replaceState']=vi.fn(function(data,unused,url){innerReplace.call(win.history,{...data,framework:'kept'},unused,url)})
 win.history.pushState=outerPush;win.history.replaceState=outerReplace
 unguard();stop();stop=trackHistoryPositions(win);unguard=guardHistoryDeparture(()=>dirty,win)
 expect(win.history.pushState).toBe(outerPush);expect(win.history.replaceState).toBe(outerReplace)
 win.history.pushState({tree:'B'},'','/B');win.history.pushState({tree:'C'},'','/C')
 dirty=true;await traversed(-1);expect(win.location.pathname).toBe('/C');expect(win.history.state).toMatchObject({framework:'kept',tree:'C'})
})
it('does not reload or compensate a same-position popstate event',()=>{
 dirty=true;const go=vi.spyOn(win.history,'go')
 win.dispatchEvent(new dom.window.PopStateEvent('popstate',{state:win.history.state}))
 expect(go).not.toHaveBeenCalled();expect(win.confirm).not.toHaveBeenCalled()
})
