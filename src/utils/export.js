/**
 * export.js
 * CSV export utility for simulation results (FR-RES-04)
 * Uses native Blob API — no external dependencies.
 */

/**
 * Download simulation results as a CSV file.
 *
 * @param {Object} simResult - result object from runSimulation()
 * @param {Array}  activities - original activity list
 */
export function exportToCSV(simResult, activities) {
  if (!simResult) return

  const { statistics, rawResults, iterations } = simResult

  const lines = []

  // Section 1: Summary Statistics
  lines.push('=== SRA SIMULATION RESULTS ===')
  lines.push(`Generated:,${new Date().toLocaleString('id-ID')}`)
  lines.push(`Iterations:,${iterations}`)
  lines.push('')

  lines.push('--- SUMMARY STATISTICS ---')
  lines.push('Metric,Value (days)')
  lines.push(`P10 (Optimistic),${statistics.p10}`)
  lines.push(`P50 (Median),${statistics.p50}`)
  lines.push(`P80 (Target),${statistics.p80}`)
  lines.push(`P90 (Conservative),${statistics.p90}`)
  lines.push(`Mean,${statistics.mean}`)
  lines.push(`Std Deviation,${statistics.stdDev}`)
  lines.push(`Min,${statistics.min}`)
  lines.push(`Max,${statistics.max}`)
  lines.push('')

  // Section 2: Activity Input Summary
  lines.push('--- ACTIVITY INPUT ---')
  lines.push('No,Activity Name,Optimistic (O),Most Likely (M),Pessimistic (P),Range (P-O),Predecessors,Dependency Type,Lag')
  const activityNames = new Map(activities.map(activity => [activity.id, activity.name]))
  activities.forEach((a, i) => {
    const o = parseFloat(a.optimistic) || 0
    const m = parseFloat(a.mostLikely) || 0
    const p = parseFloat(a.pessimistic) || 0
    const range = (p - o).toFixed(1)
    const dependencyLinks = Array.isArray(a.dependencyLinks) && a.dependencyLinks.length > 0
      ? a.dependencyLinks
      : (Array.isArray(a.predecessorIds)
        ? a.predecessorIds
        : a.predecessorId
          ? [a.predecessorId]
          : []
      ).map(predecessorId => ({
        predecessorId,
        dependencyType: a.dependencyType ?? 'FS',
        lag: a.lag ?? '0',
      }))
    const predecessorNames = dependencyLinks
      .map(link => activityNames.get(link.predecessorId) ?? link.predecessorId)
      .join(' | ')
    const dependencyTypes = dependencyLinks.map(link => link.dependencyType ?? 'FS').join(' | ')
    const lags = dependencyLinks.map(link => parseFloat(link.lag) || 0).join(' | ')
    lines.push(
      `${i + 1},"${a.name}",${o},${m},${p},${range},"${predecessorNames}","${dependencyTypes}","${lags}"`
    )
  })
  lines.push('')

  // Section 3: Raw Simulation Data
  lines.push('--- RAW SIMULATION DATA ---')
  lines.push('Iteration,Total Duration (days)')
  rawResults.forEach((v, i) => {
    lines.push(`${i + 1},${v.toFixed(2)}`)
  })

  const csvContent = lines.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `SRA_Results_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
