import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getCurrentProject,
  getCurrentScenario,
  loadWorkspace,
  saveWorkspace,
  withUpdatedProject,
} from '../utils/workspace'

export function useWorkspaceModel() {
  const [workspace, setWorkspace] = useState(() => loadWorkspace())

  const currentProject = useMemo(() => getCurrentProject(workspace), [workspace])
  const currentScenario = useMemo(() => getCurrentScenario(currentProject), [currentProject])

  const updateWorkspace = useCallback((updater) => {
    setWorkspace(current => updater(current))
  }, [])

  const updateCurrentProject = useCallback((updater) => {
    updateWorkspace(current => withUpdatedProject(current, current.currentProjectId, updater))
  }, [updateWorkspace])

  const updateCurrentScenario = useCallback((updater) => {
    updateCurrentProject(project => ({
      ...project,
      scenarios: project.scenarios.map(scenario =>
        scenario.id === project.currentScenarioId
          ? { ...updater(scenario), updatedAt: new Date().toISOString() }
          : scenario
      ),
    }))
  }, [updateCurrentProject])

  useEffect(() => {
    saveWorkspace(workspace)
  }, [workspace])

  return {
    workspace,
    setWorkspace,
    currentProject,
    currentScenario,
    updateWorkspace,
    updateCurrentProject,
    updateCurrentScenario,
  }
}
