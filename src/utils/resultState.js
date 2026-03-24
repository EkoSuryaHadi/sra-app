import { buildScenarioComparison } from './compare'
import { calcSensitivity } from './simulation'

function normalizeDependencyLinks(activity) {
  if (Array.isArray(activity?.dependencyLinks) && activity.dependencyLinks.length > 0) {
    return activity.dependencyLinks.map(link => ({
      predecessorId: String(link?.predecessorId ?? '').trim(),
      dependencyType: link?.dependencyType === 'SS' ? 'SS' : 'FS',
      lag: String(link?.lag ?? '0'),
    }))
  }

  const predecessorIds = Array.isArray(activity?.predecessorIds)
    ? activity.predecessorIds
    : activity?.predecessorId
      ? [activity.predecessorId]
      : []

  return predecessorIds
    .map(predecessorId => String(predecessorId ?? '').trim())
    .filter(Boolean)
    .map(predecessorId => ({
      predecessorId,
      dependencyType: activity?.dependencyType === 'SS' ? 'SS' : 'FS',
      lag: String(activity?.lag ?? '0'),
    }))
}

function normalizeActivityForSignature(activity) {
  return {
    id: String(activity?.id ?? ''),
    name: String(activity?.name ?? ''),
    optimistic: String(activity?.optimistic ?? ''),
    mostLikely: String(activity?.mostLikely ?? ''),
    pessimistic: String(activity?.pessimistic ?? ''),
    dependencyLinks: normalizeDependencyLinks(activity),
    progressPercent: String(activity?.progressPercent ?? '0'),
    remainingDuration: String(activity?.remainingDuration ?? ''),
    actualStart: String(activity?.actualStart ?? ''),
  }
}

export function buildScenarioModelSignature(project, scenario) {
  return JSON.stringify({
    scenarioName: String(scenario?.name ?? ''),
    iterations: Number(scenario?.iterations ?? 0),
    calendarConfig: {
      workweekDays: Number(project?.calendarConfig?.workweekDays ?? 7),
      projectStartDate: String(project?.calendarConfig?.projectStartDate ?? ''),
      holidayDates: String(project?.calendarConfig?.holidayDates ?? ''),
      holidayOverrides: String(project?.calendarConfig?.holidayOverrides ?? ''),
      analysisMode: String(project?.calendarConfig?.analysisMode ?? 'plan'),
    },
    activities: (scenario?.activities ?? []).map(normalizeActivityForSignature),
  })
}

export function createStoredRunSummary({ project, scenario, result, runAt = new Date().toISOString() }) {
  const sensitivityData = result?.sensitivityData ?? calcSensitivity(scenario?.activities ?? [])

  return {
    statistics: result.statistics,
    networkSummary: result.networkSummary,
    iterations: result.iterations,
    runAt,
    analysisMode: result.analysisMode,
    sensitivityData,
    modelSignature: buildScenarioModelSignature(project, scenario),
  }
}

export function decorateSimulationResult({ project, scenario, result, runAt = new Date().toISOString() }) {
  return {
    ...result,
    ...createStoredRunSummary({ project, scenario, result, runAt }),
  }
}

export function getStoredScenarioResult(simResults, scenario) {
  if (!scenario) return null
  return simResults?.[scenario.id] ?? scenario.lastRunSummary ?? null
}

export function getScenarioResultState({ project, scenario, simResults }) {
  const result = getStoredScenarioResult(simResults, scenario)
  const hasStoredResult = Boolean(result)
  const currentSignature = scenario ? buildScenarioModelSignature(project, scenario) : null
  const resultSignature = result?.modelSignature ?? null

  return {
    result,
    hasStoredResult,
    hasCharts: Boolean(result?.histData && result?.sCurveData),
    isStale: Boolean(result && resultSignature && currentSignature && resultSignature !== currentSignature),
  }
}

export function getCompareState({
  project,
  scenarios,
  compareLeftId,
  compareRightId,
  simResults,
}) {
  const leftScenario = scenarios.find(scenario => scenario.id === compareLeftId) ?? scenarios[0] ?? null
  const rightScenario = scenarios.find(scenario => scenario.id === compareRightId) ?? scenarios[1] ?? scenarios[0] ?? null
  const leftState = getScenarioResultState({ project, scenario: leftScenario, simResults })
  const rightState = getScenarioResultState({ project, scenario: rightScenario, simResults })

  let missingSide = null
  if (!leftState.hasStoredResult && !rightState.hasStoredResult) missingSide = 'both'
  else if (!leftState.hasStoredResult) missingSide = 'left'
  else if (!rightState.hasStoredResult) missingSide = 'right'

  return {
    leftScenario,
    rightScenario,
    leftState,
    rightState,
    missingSide,
    comparison:
      leftState.hasStoredResult && rightState.hasStoredResult
        ? buildScenarioComparison(leftScenario, rightScenario, leftState.result, rightState.result)
        : null,
  }
}
