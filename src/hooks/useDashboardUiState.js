import { useCallback, useEffect, useState } from 'react'

export function useDashboardUiState({ currentProject, currentScenario }) {
  const activities = currentScenario?.activities ?? []
  const currentScenarioId = currentScenario?.id

  const [selectedActivityId, setSelectedActivityId] = useState(activities[0]?.id ?? null)
  const [dismissedIssueIds, setDismissedIssueIds] = useState([])
  const [compareLeftId, setCompareLeftId] = useState(currentProject?.scenarios?.[0]?.id ?? '')
  const [compareRightId, setCompareRightId] = useState(
    currentProject?.scenarios?.[1]?.id ?? currentProject?.scenarios?.[0]?.id ?? ''
  )

  useEffect(() => {
    if (!activities.some(activity => activity.id === selectedActivityId)) {
      setSelectedActivityId(activities[0]?.id ?? null)
    }
  }, [activities, selectedActivityId])

  useEffect(() => {
    setDismissedIssueIds([])
  }, [currentScenarioId])

  useEffect(() => {
    const scenarioIds = currentProject.scenarios.map(scenario => scenario.id)
    if (!scenarioIds.includes(compareLeftId)) {
      setCompareLeftId(scenarioIds[0] ?? '')
    }
    if (!scenarioIds.includes(compareRightId)) {
      setCompareRightId(scenarioIds[1] ?? scenarioIds[0] ?? '')
    }
  }, [compareLeftId, compareRightId, currentProject.scenarios])

  const handleJumpToIssue = useCallback((rowId) => {
    setSelectedActivityId(rowId)
    requestAnimationFrame(() => {
      const node = document.getElementById(`activity-name-${rowId}`)
      node?.focus()
      node?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [])

  return {
    selectedActivityId,
    setSelectedActivityId,
    dismissedIssueIds,
    setDismissedIssueIds,
    compareLeftId,
    setCompareLeftId,
    compareRightId,
    setCompareRightId,
    handleJumpToIssue,
  }
}
