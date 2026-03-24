import { useCallback } from 'react'
import {
  createDefaultWorkspace,
  createProject,
  createScenario,
  trackRecentProject,
} from '../utils/workspace'
import { getTemplateActivities } from '../utils/templates'
import { parseActivitiesCSV } from '../utils/import'
import { autoFixActivityIssue } from '../utils/simulation'

function cloneActivities(activities) {
  const idMap = new Map()
  const cloned = activities.map(activity => {
    const id = `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    idMap.set(activity.id, id)
    return { ...activity, id }
  })

  return cloned.map(activity => {
    const dependencyLinks = Array.isArray(activity.dependencyLinks)
      ? activity.dependencyLinks
        .map(link => ({
          ...link,
          predecessorId: idMap.get(link.predecessorId) ?? '',
        }))
        .filter(link => link.predecessorId)
      : []
    const predecessorIds = dependencyLinks.length > 0
      ? dependencyLinks.map(link => link.predecessorId)
      : Array.isArray(activity.predecessorIds)
        ? activity.predecessorIds.map(predecessorId => idMap.get(predecessorId) ?? '').filter(Boolean)
        : activity.predecessorId
          ? [idMap.get(activity.predecessorId) ?? ''].filter(Boolean)
          : []

    return {
      ...activity,
      dependencyLinks,
      predecessorIds,
      predecessorId: predecessorIds[0] ?? '',
    }
  })
}

function cloneScenario(sourceScenario, name) {
  const clonedActivities = cloneActivities(sourceScenario.activities)
  const scenario = createScenario(name, clonedActivities)
  return {
    ...scenario,
    iterations: sourceScenario.iterations,
    notes: sourceScenario.notes ?? '',
  }
}

function cloneProject(sourceProject, name) {
  const scenarios = sourceProject.scenarios.map((scenario, index) =>
    cloneScenario(scenario, index === 0 ? 'Baseline' : `${scenario.name} Copy`)
  )

  return {
    ...createProject(name, scenarios[0].activities),
    notes: sourceProject.notes,
    calendarConfig: { ...sourceProject.calendarConfig },
    scenarios,
    currentScenarioId: scenarios[0].id,
  }
}

export function useWorkspaceActions({
  workspace,
  setWorkspace,
  setSimResults,
  currentProject,
  currentScenario,
  updateWorkspace,
  updateCurrentProject,
  updateCurrentScenario,
  setSelectedActivityId,
}) {
  const handleSelectProject = useCallback((projectId) => {
    updateWorkspace(current => trackRecentProject(current, projectId))
  }, [updateWorkspace])

  const handleCreateProject = useCallback(() => {
    const project = createProject(`Project ${workspace.projects.length + 1}`)
    updateWorkspace(current => ({
      ...current,
      projects: [...current.projects, project],
      currentProjectId: project.id,
      recentProjectIds: [project.id, ...current.recentProjectIds.filter(id => id !== project.id)].slice(0, 5),
    }))
  }, [updateWorkspace, workspace.projects.length])

  const handleDuplicateProject = useCallback(() => {
    const project = cloneProject(currentProject, `${currentProject.name} Copy`)
    updateWorkspace(current => ({
      ...current,
      projects: [...current.projects, project],
      currentProjectId: project.id,
      recentProjectIds: [project.id, ...current.recentProjectIds.filter(id => id !== project.id)].slice(0, 5),
    }))
  }, [currentProject, updateWorkspace])

  const handleDeleteProject = useCallback(() => {
    if (workspace.projects.length === 1) {
      setWorkspace(createDefaultWorkspace())
      setSimResults({})
      return
    }

    const deletedScenarioIds = currentProject.scenarios.map(scenario => scenario.id)
    setSimResults(current => Object.fromEntries(
      Object.entries(current).filter(([scenarioId]) => !deletedScenarioIds.includes(scenarioId))
    ))

    updateWorkspace(current => {
      const projects = current.projects.filter(project => project.id !== currentProject.id)
      return {
        ...current,
        projects,
        currentProjectId: projects[0].id,
        recentProjectIds: current.recentProjectIds.filter(id => id !== currentProject.id),
      }
    })
  }, [currentProject, setSimResults, setWorkspace, updateWorkspace, workspace.projects.length])

  const handleCreateScenario = useCallback(() => {
    updateCurrentProject(project => {
      const scenario = cloneScenario(currentScenario, `Scenario ${project.scenarios.length + 1}`)
      return {
        ...project,
        scenarios: [...project.scenarios, scenario],
        currentScenarioId: scenario.id,
      }
    })
  }, [currentScenario, updateCurrentProject])

  const handleDuplicateScenario = useCallback(() => {
    updateCurrentProject(project => {
      const scenario = cloneScenario(currentScenario, `${currentScenario.name} Copy`)
      return {
        ...project,
        scenarios: [...project.scenarios, scenario],
        currentScenarioId: scenario.id,
      }
    })
  }, [currentScenario, updateCurrentProject])

  const handleDeleteScenario = useCallback(() => {
    setSimResults(current => Object.fromEntries(
      Object.entries(current).filter(([scenarioId]) => scenarioId !== currentScenario.id)
    ))

    updateCurrentProject(project => {
      if (project.scenarios.length === 1) {
        const scenario = createScenario('Baseline')
        return {
          ...project,
          scenarios: [scenario],
          currentScenarioId: scenario.id,
        }
      }

      const scenarios = project.scenarios.filter(scenario => scenario.id !== currentScenario.id)
      return {
        ...project,
        scenarios,
        currentScenarioId: scenarios[0].id,
      }
    })
  }, [currentScenario.id, setSimResults, updateCurrentProject])

  const handleImportCSV = useCallback(async (file) => {
    const text = await file.text()
    const importedActivities = parseActivitiesCSV(text)
    updateCurrentScenario(scenario => ({
      ...scenario,
      activities: importedActivities,
    }))
    setSelectedActivityId(importedActivities[0]?.id ?? null)
  }, [setSelectedActivityId, updateCurrentScenario])

  const handleApplyPreset = useCallback((templateId) => {
    const templateActivities = getTemplateActivities(templateId)
    updateCurrentScenario(scenario => ({
      ...scenario,
      activities: templateActivities,
    }))
    setSelectedActivityId(templateActivities[0]?.id ?? null)
  }, [setSelectedActivityId, updateCurrentScenario])

  const handleAutoFixIssue = useCallback((issue) => {
    updateCurrentScenario(scenario => ({
      ...scenario,
      activities: scenario.activities.map(activity =>
        activity.id === issue.rowId ? autoFixActivityIssue(activity, issue.type) : activity
      ),
    }))
  }, [updateCurrentScenario])

  return {
    handleSelectProject,
    handleCreateProject,
    handleDuplicateProject,
    handleDeleteProject,
    handleCreateScenario,
    handleDuplicateScenario,
    handleDeleteScenario,
    handleImportCSV,
    handleApplyPreset,
    handleAutoFixIssue,
  }
}
