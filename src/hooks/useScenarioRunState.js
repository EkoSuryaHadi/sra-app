import { useMemo } from 'react'
import { getCompareState, getScenarioResultState } from '../utils/resultState'

export function useScenarioRunState({
  currentProject,
  currentScenario,
  compareLeftId,
  compareRightId,
  simResults,
}) {
  const currentResultState = useMemo(() => getScenarioResultState({
    project: currentProject,
    scenario: currentScenario,
    simResults,
  }), [currentProject, currentScenario, simResults])

  const compareState = useMemo(() => getCompareState({
    project: currentProject,
    scenarios: currentProject?.scenarios ?? [],
    compareLeftId,
    compareRightId,
    simResults,
  }), [compareLeftId, compareRightId, currentProject, simResults])

  return {
    currentResultState,
    compareState,
  }
}
