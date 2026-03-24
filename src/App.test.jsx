import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import App from './App'
import { renderWithProviders } from './test/renderWithProviders'
import * as simulation from './utils/simulation'
import { createProject, createScenario } from './utils/workspace'

describe('App workflow redesign', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '#input')
    window.localStorage.clear()
  })

  it('shows input as the active step and keeps results and insights disabled by default', () => {
    renderWithProviders(<App />)

    expect(screen.getByRole('button', { name: /Input/i })).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('button', { name: /Results/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Insights/i })).toBeDisabled()
  })

  it('runs the simulation, activates results, and updates the hash', async () => {
    renderWithProviders(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Run SRA/i }))

    await screen.findByText(/Ringkasan hasil|Results summary/i)

    await waitFor(() => {
      expect(window.location.hash).toBe('#results')
    })

    expect(screen.getByRole('button', { name: /Results/i })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /Ekspor CSV|Export CSV/i })).toBeInTheDocument()
  })

  it('keeps a single primary Run SRA action in the header', () => {
    renderWithProviders(<App />)

    expect(screen.getAllByRole('button', { name: /Run SRA/i })).toHaveLength(1)
  })

  it('shows inline warning when a named row has invalid O/M/P order', () => {
    renderWithProviders(<App />)

    fireEvent.change(screen.getByLabelText(/Optimistic untuk aktivitas baris 1|Optimistic for activity row 1/i), {
      target: { value: '20' },
    })

    expect(screen.getByText(/Beberapa aktivitas perlu review|Some activities need review/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Urutan estimasi harus O <= M <= P/i).length).toBeGreaterThan(1)
  })

  it('exposes explicit accessible names for the iteration select and delete row action', () => {
    renderWithProviders(<App />)

    expect(screen.getByRole('combobox', { name: /Iterasi simulasi|Simulation iterations/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Hapus aktivitas baris 1|Delete activity row 1/i })).toBeInTheDocument()
  })

  it('marks results as stale after editing the model while keeping previous output visible', async () => {
    renderWithProviders(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Run SRA/i }))
    await screen.findByText(/Ringkasan hasil|Results summary/i)

    fireEvent.click(screen.getByRole('button', { name: /Input/i }))
    fireEvent.change(screen.getByLabelText(/Nama aktivitas baris 1|Activity name row 1/i), {
      target: { value: 'Aktivitas revisi' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Results/i }))

    expect(screen.getByText(/Hasil ini berasal dari run sebelumnya|These results come from the previous run/i)).toBeInTheDocument()
    expect(screen.getAllByText(/P80/i).length).toBeGreaterThan(0)
  })

  it('uses stored compare results without triggering a rerun on render', async () => {
    const project = createProject('Compare Project')
    const secondScenario = createScenario('Mitigated', project.scenarios[0].activities)
    project.scenarios.push(secondScenario)
    project.currentScenarioId = project.scenarios[0].id

    const runA = simulation.runSimulation(project.scenarios[0].activities, 50, {
      calendarConfig: project.calendarConfig,
    })
    const runB = simulation.runSimulation(secondScenario.activities, 50, {
      calendarConfig: project.calendarConfig,
    })

    project.scenarios[0].lastRunSummary = {
      statistics: runA.statistics,
      networkSummary: runA.networkSummary,
      iterations: runA.iterations,
      runAt: '2026-03-24T00:00:00.000Z',
      analysisMode: runA.analysisMode,
      sensitivityData: runA.sensitivityData ?? simulation.calcSensitivity(project.scenarios[0].activities),
      modelSignature: JSON.stringify({ seed: 'a' }),
    }
    secondScenario.lastRunSummary = {
      statistics: runB.statistics,
      networkSummary: runB.networkSummary,
      iterations: runB.iterations,
      runAt: '2026-03-24T00:00:00.000Z',
      analysisMode: runB.analysisMode,
      sensitivityData: runB.sensitivityData ?? simulation.calcSensitivity(secondScenario.activities),
      modelSignature: JSON.stringify({ seed: 'b' }),
    }

    window.localStorage.setItem('sra-workspace-v2', JSON.stringify({
      projects: [project],
      currentProjectId: project.id,
      recentProjectIds: [project.id],
    }))

    const runSpy = vi.spyOn(simulation, 'runSimulation')
    renderWithProviders(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Run SRA/i }))
    await screen.findByText(/Scenario compare/i)
    runSpy.mockClear()

    expect(screen.getByText(/Scenario compare/i)).toBeInTheDocument()
    expect(runSpy).not.toHaveBeenCalled()
  })

  it('toggles the main UI copy when language is switched', () => {
    renderWithProviders(<App />)

    expect(screen.getByText(/Daftar aktivitas/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /English/i }))
    expect(screen.getByText(/Activity list/i)).toBeInTheDocument()
  })
})
