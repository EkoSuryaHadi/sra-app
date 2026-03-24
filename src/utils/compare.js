import { calcSensitivity } from './simulation'

function toDelta(leftValue, rightValue) {
  return parseFloat((rightValue - leftValue).toFixed(2))
}

export function buildScenarioComparison(leftScenario, rightScenario, leftResult, rightResult) {
  if (!leftScenario || !rightScenario || !leftResult || !rightResult) return null

  const leftStats = leftResult.statistics
  const rightStats = rightResult.statistics
  const leftSensitivity = leftResult.sensitivityData ?? calcSensitivity(leftScenario.activities)
  const rightSensitivity = rightResult.sensitivityData ?? calcSensitivity(rightScenario.activities)

  const metrics = [
    { label: 'P50', left: leftStats.p50, right: rightStats.p50 },
    { label: 'P80', left: leftStats.p80, right: rightStats.p80 },
    { label: 'P90', left: leftStats.p90, right: rightStats.p90 },
    {
      label: 'Contingency',
      left: parseFloat((leftStats.p80 - leftStats.p50).toFixed(2)),
      right: parseFloat((rightStats.p80 - rightStats.p50).toFixed(2)),
    },
  ].map(metric => ({
    ...metric,
    delta: toDelta(metric.left, metric.right),
  }))

  const rangeMap = new Map(leftSensitivity.map(item => [item.name, item.range]))
  const topRiskShift = rightSensitivity
    .map(item => ({
      name: item.name,
      before: rangeMap.get(item.name) ?? 0,
      after: item.range,
      delta: parseFloat((item.range - (rangeMap.get(item.name) ?? 0)).toFixed(2)),
      riskLevel: item.riskLevel,
    }))
    .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))[0] ?? null

  return {
    metrics,
    topRiskShift,
    summary:
      topRiskShift && topRiskShift.delta !== 0
        ? {
            key: 'changed',
            name: topRiskShift.name,
            direction: topRiskShift.delta > 0 ? 'up' : 'down',
            delta: Math.abs(topRiskShift.delta),
          }
        : {
            key: 'flat',
          },
  }
}
