import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StepSkillNotice, TreeSkillFlag } from './SkillNotice'
import { GARAGE_STORAGE_KEY } from '@/lib/garage'

function setSkill(skill: string | null) {
  window.localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify({ bikeIds: [], skill, onboarded: true }))
}

describe('StepSkillNotice', () => {
  beforeEach(() => window.localStorage.clear())

  it('renders nothing when no skill is set', () => {
    const { container } = render(<StepSkillNotice safety="red" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('warns a beginner on a care-required step', () => {
    setSkill('beginner')
    render(<StepSkillNotice safety="yellow" />)
    expect(screen.getByRole('note')).toHaveTextContent(/above the experience level you set/i)
  })

  it('stays quiet for a home mechanic on a care-required step', () => {
    setSkill('home')
    const { container } = render(<StepSkillNotice safety="yellow" />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('TreeSkillFlag', () => {
  beforeEach(() => window.localStorage.clear())

  it('flags an advanced guide for a home mechanic', () => {
    setSkill('home')
    render(<TreeSkillFlag difficulty="advanced" />)
    expect(screen.getByText('Above your level')).toBeInTheDocument()
  })

  it('does not flag a guide within the user level', () => {
    setSkill('pro')
    const { container } = render(<TreeSkillFlag difficulty="advanced" />)
    expect(container).toBeEmptyDOMElement()
  })
})
