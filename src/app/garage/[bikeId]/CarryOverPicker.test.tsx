import { fireEvent, render, screen } from '@testing-library/react'
import { expect,it,vi } from 'vitest'
import { jobFixture,taskFixture } from '@/test/garageFixtures'
import { CarryOverPicker } from './CarryOverPicker'
it('starts collapsed and unchecked and renders notes as text',()=>{
 const onChange=vi.fn();const previous=jobFixture({tasks:[taskFixture({notes:'<b>Noise</b>'})]})
 render(<CarryOverPicker previous={previous} onChange={onChange} />)
 expect(screen.queryByRole('checkbox')).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Carry unfinished work'}))
 expect(screen.getAllByRole('checkbox').every(box=>!(box as HTMLInputElement).checked)).toBe(true)
 expect(screen.getByText('<b>Noise</b>')).toBeVisible()
 fireEvent.click(screen.getByLabelText('Inspect chain'))
 expect(onChange).toHaveBeenLastCalledWith({sourceJobId:previous.id,sourceRevision:1,taskIds:[previous.tasks[0].id],closePrevious:false})
})
it('hides an empty offer and closure for a closed source',()=>{
 const {rerender}=render(<CarryOverPicker previous={jobFixture({tasks:[taskFixture({state:'done'})]})} onChange={vi.fn()} />)
 expect(screen.queryByRole('button')).toBeNull()
 rerender(<CarryOverPicker previous={jobFixture({status:'partial',closeReason:'manual'})} onChange={vi.fn()} />)
 fireEvent.click(screen.getByRole('button'))
 expect(screen.queryByLabelText('Complete previous activity')).toBeNull()
})
