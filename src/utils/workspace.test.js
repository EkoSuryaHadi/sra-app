import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearWorkspaceStorage,
  createDefaultWorkspace,
  createProject,
  createScenario,
  getCurrentProject,
  getCurrentScenario,
  hydrateWorkspace,
  loadWorkspace,
  saveWorkspace,
} from './workspace'

describe('workspace storage', () => {
  beforeEach(() => {
    clearWorkspaceStorage()
  })

  it('saves and reloads the last active project workspace', () => {
    const workspace = createDefaultWorkspace()
    workspace.projects[0].name = 'Persisted Project'

    saveWorkspace(workspace)
    const loaded = loadWorkspace()

    expect(getCurrentProject(loaded).name).toBe('Persisted Project')
    expect(getCurrentScenario(getCurrentProject(loaded)).name).toBe('Baseline')
  })

  it('hydrates custom projects and scenarios from storage', () => {
    const project = createProject('Project Alpha')
    const scenario = createScenario('Mitigated', project.scenarios[0].activities)
    project.calendarConfig.projectStartDate = '2026-03-20'
    project.calendarConfig.holidayDates = '2026-03-31'
    project.calendarConfig.holidayOverrides = 'Lebaran 1\nLebaran 2'
    project.scenarios.push(scenario)
    project.currentScenarioId = scenario.id

    saveWorkspace({
      projects: [project],
      currentProjectId: project.id,
      recentProjectIds: [project.id],
    })

    const loaded = loadWorkspace()
    expect(getCurrentProject(loaded).scenarios).toHaveLength(2)
    expect(getCurrentScenario(getCurrentProject(loaded)).name).toBe('Mitigated')
    expect(getCurrentProject(loaded).calendarConfig.projectStartDate).toBe('2026-03-20')
    expect(getCurrentProject(loaded).calendarConfig.holidayDates).toBe('2026-03-31')
    expect(getCurrentProject(loaded).calendarConfig.holidayOverrides).toBe('Lebaran 1\nLebaran 2')
  })

  it('hydrates extended last run metadata safely', () => {
    const project = createProject('Project Beta')
    project.scenarios[0].lastRunSummary = {
      statistics: { p50: 10, p80: 12, p90: 14 },
      networkSummary: { totalDuration: 12, criticalPath: ['A'] },
      iterations: 5000,
      runAt: '2026-03-24T00:00:00.000Z',
      analysisMode: 'plan',
      modelSignature: 'signature-1',
      sensitivityData: [{ name: 'A', range: 3, riskLevel: 'HIGH' }],
    }

    saveWorkspace({
      projects: [project],
      currentProjectId: project.id,
      recentProjectIds: [project.id],
    })

    const loaded = loadWorkspace()
    const lastRunSummary = getCurrentScenario(getCurrentProject(loaded)).lastRunSummary

    expect(lastRunSummary.runAt).toBe('2026-03-24T00:00:00.000Z')
    expect(lastRunSummary.modelSignature).toBe('signature-1')
    expect(lastRunSummary.sensitivityData).toHaveLength(1)
  })

  it('upgrades legacy single predecessor fields into predecessor arrays', () => {
    const workspace = hydrateWorkspace({
      projects: [{
        id: 'project-1',
        name: 'Legacy Project',
        notes: '',
        calendarConfig: {},
        currentScenarioId: 'scenario-1',
        scenarios: [{
          id: 'scenario-1',
          name: 'Baseline',
          iterations: 5000,
          activities: [
            { id: 'a', name: 'Start', optimistic: '1', mostLikely: '2', pessimistic: '3' },
            { id: 'b', name: 'Finish', optimistic: '2', mostLikely: '3', pessimistic: '4', predecessorId: 'a' },
          ],
        }],
      }],
      currentProjectId: 'project-1',
      recentProjectIds: ['project-1'],
    })

    const scenario = getCurrentScenario(getCurrentProject(workspace))
    expect(scenario.activities[1].predecessorIds).toEqual(['a'])
  })
})
