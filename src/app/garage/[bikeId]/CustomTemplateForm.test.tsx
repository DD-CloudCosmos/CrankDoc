import { render,screen,fireEvent,waitFor } from '@testing-library/react'
import { expect,it,vi } from 'vitest'
import { CustomTemplateForm } from './CustomTemplateForm'
it('creates only personal definitions with stable keys and no invented safety',async()=>{const save=vi.fn().mockImplementation(async t=>t),cancel=vi.fn();render(<CustomTemplateForm onSave={save} onCancel={cancel}/>);fireEvent.change(screen.getByLabelText('Template title'),{target:{value:'Winter work'}});fireEvent.change(screen.getByLabelText('Task 1'),{target:{value:'Inspect luggage'}});fireEvent.click(screen.getByRole('button',{name:'Save template'}));await waitFor(()=>expect(save).toHaveBeenCalledOnce());expect(save.mock.calls[0][0]).toMatchObject({kind:'custom',frequency:'on_demand',version:1,source:null});expect(save.mock.calls[0][0].tasks[0]).toMatchObject({safety:null,action:'other'});expect(save.mock.calls[0][0].tasks[0]).not.toHaveProperty('notes');expect(cancel).toHaveBeenCalledOnce()})
it('keeps draft inputs visible on save failure',async()=>{render(<CustomTemplateForm onSave={vi.fn().mockRejectedValue(new Error('Sign in again'))} onCancel={vi.fn()}/>);fireEvent.change(screen.getByLabelText('Template title'),{target:{value:'Winter work'}});fireEvent.change(screen.getByLabelText('Task 1'),{target:{value:'Inspect luggage'}});fireEvent.click(screen.getByRole('button',{name:'Save template'}));await screen.findByRole('alert');expect(screen.getByLabelText('Template title')).toHaveValue('Winter work');expect(screen.getByLabelText('Task 1')).toHaveValue('Inspect luggage')})

import { templateFixture } from '@/test/garageFixtures'
import { combineTemplates } from '@/lib/maintenance/templateValidation'
it('gives changed source-derived work a personal key so selected inspection and replacement both survive',async()=>{
 const source=templateFixture({tasks:[{...templateFixture().tasks[0],key:'model:fluid:inspect',label:'Inspect fluid',action:'inspect'}]})
 const initial={...source,kind:'custom' as const,source:null}
 const save=vi.fn().mockImplementation(async t=>t)
 render(<CustomTemplateForm initial={initial} onSave={save} onCancel={vi.fn()}/>);
 fireEvent.change(screen.getByLabelText('Task 1'),{target:{value:'Replace fluid'}});fireEvent.change(screen.getByLabelText('Action 1'),{target:{value:'replace'}});fireEvent.click(screen.getByRole('button',{name:'Save template'}));await waitFor(()=>expect(save).toHaveBeenCalledOnce());
 const changed=save.mock.calls[0][0];expect(changed.tasks[0].key).not.toBe(source.tasks[0].key);expect(combineTemplates([source,changed]).tasks.map(t=>t.action)).toEqual(['inspect','replace'])
})
it('keeps an unchanged copied definition key',async()=>{const initial=templateFixture({kind:'custom',source:null});const save=vi.fn().mockImplementation(async t=>t);render(<CustomTemplateForm initial={initial} onSave={save} onCancel={vi.fn()}/>);fireEvent.click(screen.getByRole('button',{name:'Save template'}));await waitFor(()=>expect(save).toHaveBeenCalledOnce());expect(save.mock.calls[0][0].tasks[0].key).toBe(initial.tasks[0].key)})
