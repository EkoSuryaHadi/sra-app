import React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { fireEvent, screen } from '@testing-library/react'
import App from './App'
import { renderWithProviders } from './test/renderWithProviders'

describe('App accessibility audit', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '#input')
    window.localStorage.clear()
  })

  it('has no critical axe violations on the default workflow screen', async () => {
    const { container } = renderWithProviders(<App />)

    const results = await axe(container)

    expect(results.violations).toEqual([])
  }, 15000)

  it('has no critical axe violations after results are available', async () => {
    const { container } = renderWithProviders(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Run SRA/i }))
    await screen.findByText(/Ringkasan hasil|Results summary/i)

    const results = await axe(container)

    expect(results.violations).toEqual([])
  }, 15000)
})
