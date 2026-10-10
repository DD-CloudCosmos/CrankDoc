import { describe, expect, it } from 'vitest'
import { jobFixture, taskFixture, templateFixture } from '@/test/garageFixtures'
import { parseCost, parseJobDraft } from './validation'

describe('maintenance validation', () => {
  it('keeps blank cost distinct from zero and converts minor units exactly', () => {
    expect(parseCost('', 'EUR')).toEqual({costMinor:null,currency:null})
    expect(parseCost('0', 'EUR')).toEqual({costMinor:0,currency:'EUR'})
    expect(parseCost('42.50', 'GBP')).toEqual({costMinor:4250,currency:'GBP'})
    expect(parseCost('1.2', 'USD')).toEqual({costMinor:120,currency:'USD'})
  })
  it.each(['-1','1e2','1.001','NaN','Infinity','900719925474099.99',' 2','1.'])('rejects malformed cost %s', value => expect(() => parseCost(value,'EUR')).toThrow())
  it('rejects unsupported currency for known cost', () => expect(() => parseCost('1','CAD')).toThrow())
  it('accepts complete draft, zero mileage, leap day and plain content', () => {
    const input = jobFixture({date:'2024-02-29',mileageKm:0,notes:'<script>plain</script>'})
    expect(parseJobDraft(input)).toMatchObject({date:input.date,mileageKm:0,notes:input.notes})
  })
  it.each(['2026-02-29','2026-04-31','2026-13-01','2026-1-01','2026-10-10T00:00:00Z'])('rejects impossible/non-calendar date %s', date => expect(() => parseJobDraft(jobFixture({date}))).toThrow())
  it.each([NaN,Infinity,-1,1000000000,0.0001,0.00000001])('rejects unstorable mileage %s', mileageKm => expect(() => parseJobDraft(jobFixture({mileageKm}))).toThrow())
  it('validates required strings, lengths, costs, and identifier types', () => {
    for (const patch of [{id:'bad'},{bikeId:'bad'},{title:' '},{title:'a'.repeat(161)},{notes:'a'.repeat(4001)},{performer:'a'.repeat(121)},{parts:null},{costMinor:1.5,currency:'EUR'},{costMinor:0,currency:null},{costMinor:null,currency:'EUR'},{costMinor:Number.MAX_SAFE_INTEGER+1,currency:'EUR'}]) {
      expect(() => parseJobDraft({...jobFixture(),...patch})).toThrow()
    }
  })
  it('rejects empty/oversized lists and duplicate identifiers', () => {
    for (const tasks of [[],Array(101).fill(taskFixture()),[taskFixture(),taskFixture()]]) expect(() => parseJobDraft(jobFixture({tasks}))).toThrow()
  })
  it('validates every task field and state/timestamp/reason consistency', () => {
    for (const patch of [{id:'bad'},{action:'repair'},{state:'finished'},{label:' '},{notes:'a'.repeat(4001)},{reason:'a'.repeat(501)},{state:'skipped',reason:''},{state:'not_applicable',reason:' '},{state:'done',doneAt:null},{state:'todo',doneAt:'2026-10-10T00:00:00Z'},{doneAt:'nonsense'},{key:3},{origin:{jobId:'bad',taskId:'bad',previousNotes:''}},{safety:'blue'},{warning:4}]) expect(() => parseJobDraft({...jobFixture(),tasks:[{...taskFixture(),...patch}]})).toThrow()
    expect(parseJobDraft(jobFixture({tasks:[taskFixture({state:'done',doneAt:'2026-10-10T10:00:00Z'})]})).tasks[0].state).toBe('done')
  })
  it('validates template snapshot definitions', () => {
    expect(parseJobDraft(jobFixture({template:templateFixture()})).template?.version).toBe(1)
    for (const patch of [{version:0},{tasks:[]},{kind:'fake'},{frequency:'fake'},{years:[NaN]}]) expect(() => parseJobDraft({...jobFixture(),template:{...templateFixture(),...patch}})).toThrow()
  })
})
