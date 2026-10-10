import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { PrivateGarage } from '../PrivateGarage'
import { Checklist } from './Checklist'
import { clearChecklistDrafts } from '@/hooks/checklistDrafts'
import { jobFixture } from '@/test/garageFixtures'
import { loadChecklistAction, saveTaskPatchAction } from './jobs/[jobId]/actions'
const auth=vi.hoisted(()=>({getUser:vi.fn(),callbacks:new Set<(event:string,session:{user:{id:string}}|null)=>void>()}))
vi.mock('@/lib/supabase/auth-browser',()=>({createAuthBrowserClient:()=>({auth:{getUser:auth.getUser,onAuthStateChange:(callback:(event:string,session:{user:{id:string}}|null)=>void)=>{auth.callbacks.add(callback);return {data:{subscription:{unsubscribe:()=>auth.callbacks.delete(callback)}}}}}})}))
vi.mock('./jobs/[jobId]/actions',()=>({loadChecklistAction:vi.fn(),saveTaskPatchAction:vi.fn(),closeJobAction:vi.fn(),correctChecklistAction:vi.fn()}))
const owner='expiry-owner';const user=(id:string|null)=>({data:{user:id?{id}:null},error:null})
beforeEach(()=>{vi.clearAllMocks();clearChecklistDrafts(owner);auth.callbacks.clear();auth.getUser.mockResolvedValue(user(owner));vi.mocked(loadChecklistAction).mockResolvedValue(jobFixture());vi.mocked(saveTaskPatchAction).mockResolvedValue({ok:false,error:'save_failed',message:'Could not save'})})
afterEach(()=>clearChecklistDrafts(owner))
it('retains and suspends actual typed checklist notes after refresh-expiry SIGNED_OUT, restoring only for the same verified owner',async()=>{
 render(<PrivateGarage ownerId={owner}><Checklist initialJob={jobFixture()} /></PrivateGarage>)
 await waitFor(()=>expect(screen.getByRole('checkbox')).toBeVisible())
 fireEvent.click(screen.getByText('Notes and reference'));fireEvent.change(screen.getByLabelText('Notes: Inspect chain'),{target:{value:'Private observations'}})
 auth.getUser.mockResolvedValue(user(null));act(()=>auth.callbacks.forEach(callback=>callback('SIGNED_OUT',null)))
 expect(screen.getByLabelText('Notes: Inspect chain')).not.toBeVisible()
 expect(screen.getByLabelText('Notes: Inspect chain')).toHaveValue('Private observations')
 expect(screen.getByRole('link',{name:'Sign in to open My Garage'})).toHaveAttribute('target','_blank')
 await new Promise(resolve=>setTimeout(resolve,550));expect(saveTaskPatchAction).not.toHaveBeenCalled()
 auth.getUser.mockResolvedValue(user(owner));fireEvent.focus(window)
 await waitFor(()=>expect(screen.getByLabelText('Notes: Inspect chain')).toBeVisible())
 expect(screen.getByLabelText('Notes: Inspect chain')).toHaveValue('Private observations')
 act(()=>auth.callbacks.forEach(callback=>callback('SIGNED_IN',{user:{id:'another-owner'}})))
 expect(screen.queryByLabelText('Notes: Inspect chain')).not.toBeInTheDocument()
})
