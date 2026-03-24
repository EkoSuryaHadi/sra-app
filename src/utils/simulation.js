/**
 * simulation.js
 * Monte Carlo Simulation Engine using Triangular Distribution
 * Method: Inverse Transform (AACE RP 41R-08 compliant)
 */

const NARROW_RANGE_THRESHOLD = 1
const WIDE_RANGE_RATIO = 1.2
const DOMINANT_CONTRIBUTION_THRESHOLD = 35

function parseNumber(value, fallback = NaN) {
  const parsed = parseFloat(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function parseISODate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return null
  const [year, month, day] = value.trim().split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

function formatISODate(date) {
  return date.toISOString().slice(0, 10)
}

function addCalendarDays(date, days) {
  const next = new Date(date.getTime())
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function countElapsedDays(startDate, endDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  return Math.round((endDate.getTime() - startDate.getTime()) / millisecondsPerDay)
}

function getAverageCalendarRatio(workweekDays) {
  const weekDays = clamp(parseNumber(workweekDays, 7), 5, 7)
  return 7 / weekDays
}

export function parseHolidayDates(holidayDates) {
  if (typeof holidayDates !== 'string') return []

  return Array.from(
    new Set(
      holidayDates
        .split(/[\n,;]+/)
        .map(entry => parseISODate(entry))
        .filter(Boolean)
        .map(formatISODate)
    )
  )
}

function isDateAwareCalendar(calendarConfig) {
  return Boolean(parseISODate(calendarConfig?.projectStartDate))
}

function isWorkingDate(date, calendarConfig) {
  const workweekDays = clamp(parseNumber(calendarConfig?.workweekDays, 7), 5, 7)
  const day = date.getUTCDay()
  const holidaySet = new Set(parseHolidayDates(calendarConfig?.holidayDates))

  const isWeekend = (
    (workweekDays === 5 && (day === 0 || day === 6)) ||
    (workweekDays === 6 && day === 0)
  )

  if (isWeekend) return false
  if (holidaySet.has(formatISODate(date))) return false
  return true
}

function getDateFromOffset(projectStartDate, offset) {
  const baseDate = parseISODate(projectStartDate)
  if (!baseDate) return null
  return addCalendarDays(baseDate, Math.floor(offset))
}

function alignToWorkingBoundary(offset, calendarConfig) {
  if (!isDateAwareCalendar(calendarConfig)) return offset

  let alignedOffset = offset
  let currentDate = getDateFromOffset(calendarConfig.projectStartDate, alignedOffset)

  while (currentDate && !isWorkingDate(currentDate, calendarConfig)) {
    alignedOffset = Math.floor(alignedOffset) + 1
    currentDate = getDateFromOffset(calendarConfig.projectStartDate, alignedOffset)
  }

  return alignedOffset
}

function advanceWorkingDuration(startOffset, workingDuration, calendarConfig) {
  if (!isDateAwareCalendar(calendarConfig)) {
    return startOffset + normalizeCalendarDuration(workingDuration, calendarConfig?.workweekDays ?? 7)
  }

  const safeDuration = Math.max(workingDuration, 0)
  let currentOffset = startOffset
  const wholeDays = Math.floor(safeDuration)
  const fraction = safeDuration - wholeDays

  for (let dayIndex = 0; dayIndex < wholeDays; dayIndex += 1) {
    currentOffset = alignToWorkingBoundary(currentOffset, calendarConfig)
    currentOffset += 1
  }

  if (fraction > 0) {
    currentOffset = alignToWorkingBoundary(currentOffset, calendarConfig)
    currentOffset += fraction * getAverageCalendarRatio(calendarConfig?.workweekDays ?? 7)
  }

  return currentOffset
}

function getPredecessorIds(activity) {
  if (Array.isArray(activity.dependencyLinks) && activity.dependencyLinks.length > 0) {
    return Array.from(
      new Set(
        activity.dependencyLinks
          .map(link => String(link?.predecessorId ?? '').trim())
          .filter(Boolean)
      )
    )
  }

  const rawValues = Array.isArray(activity.predecessorIds)
    ? activity.predecessorIds
    : typeof activity.predecessorId === 'string' && activity.predecessorId.trim() !== ''
      ? [activity.predecessorId]
      : []

  return Array.from(
    new Set(
      rawValues
        .map(value => String(value ?? '').trim())
        .filter(Boolean)
    )
  )
}

function getDependencyLinks(activity) {
  if (Array.isArray(activity.dependencyLinks) && activity.dependencyLinks.length > 0) {
    return activity.dependencyLinks
      .map(link => ({
        predecessorId: String(link?.predecessorId ?? '').trim(),
        dependencyType: link?.dependencyType === 'SS' ? 'SS' : 'FS',
        lag: parseNumber(link?.lag),
      }))
      .filter(link => link.predecessorId !== '')
  }

  return getPredecessorIds(activity).map(predecessorId => ({
    predecessorId,
    dependencyType: activity.dependencyType === 'SS' ? 'SS' : 'FS',
    lag: parseNumber(activity.lag, 0),
  }))
}

function normalizeCalendarDuration(duration, workweekDays) {
  const weekDays = clamp(parseNumber(workweekDays, 7), 5, 7)
  return duration * (7 / weekDays)
}

export function countHolidayOverrides(holidayOverrides) {
  if (typeof holidayOverrides !== 'string') return 0

  return Array.from(
    new Set(
      holidayOverrides
        .split(/[\n,;]+/)
        .map(entry => entry.trim())
        .filter(Boolean)
    )
  ).length
}

function getAnalysisDuration(activity, sampledDuration, analysisMode, workweekDays) {
  let duration = sampledDuration
  const remainingDuration = parseNumber(activity.remainingDuration)
  const progressRatio = clamp(parseNumber(activity.progressPercent, 0), 0, 100) / 100

  if (analysisMode === 'remaining') {
    if (!Number.isNaN(remainingDuration) && remainingDuration > 0) {
      duration = remainingDuration
    } else if (progressRatio > 0) {
      duration = sampledDuration * (1 - progressRatio)
    }
  }

  return parseFloat(Math.max(duration, 0).toFixed(4))
}

function sortActivitiesByDependencies(activities) {
  const byId = new Map(activities.map(activity => [activity.id, activity]))
  const visited = new Set()
  const inStack = new Set()
  const ordered = []

  function visit(activity) {
    if (visited.has(activity.id)) return
    if (inStack.has(activity.id)) return

    inStack.add(activity.id)
    getPredecessorIds(activity).forEach(predecessorId => {
      if (byId.has(predecessorId)) {
        visit(byId.get(predecessorId))
      }
    })
    inStack.delete(activity.id)
    visited.add(activity.id)
    ordered.push(activity)
  }

  activities.forEach(visit)
  return ordered
}

function detectCyclicDependencyIds(activities) {
  const byId = new Map(activities.map(activity => [activity.id, activity]))
  const visited = new Set()
  const inStack = []
  const cycleIds = new Set()

  function visit(activity) {
    if (visited.has(activity.id)) return

    visited.add(activity.id)
    inStack.push(activity.id)

    getPredecessorIds(activity).forEach(predecessorId => {
      if (!byId.has(predecessorId)) return

      const cycleIndex = inStack.indexOf(predecessorId)
      if (cycleIndex >= 0) {
        inStack.slice(cycleIndex).forEach(id => cycleIds.add(id))
        return
      }

      visit(byId.get(predecessorId))
    })

    inStack.pop()
  }

  activities.forEach(visit)
  return cycleIds
}

function buildScheduledSample(activities, options, sampleForActivity) {
  const calendarConfig = options?.calendarConfig ?? {}
  const workweekDays = calendarConfig?.workweekDays ?? 7
  const analysisMode = calendarConfig?.analysisMode ?? 'plan'
  const holidayAdjustmentDays = countHolidayOverrides(calendarConfig?.holidayOverrides)
  const dateAware = isDateAwareCalendar(calendarConfig)
  const orderedActivities = sortActivitiesByDependencies(activities)
  const useImplicitSequence = orderedActivities.every(activity => getPredecessorIds(activity).length === 0)
  const timings = {}
  let totalDuration = 0

  orderedActivities.forEach((activity, index) => {
    const sampledDuration = sampleForActivity(activity)
    const workingDuration = getAnalysisDuration(activity, sampledDuration, analysisMode, workweekDays)
    const explicitLinks = getDependencyLinks(activity)
      .map(link => ({
        ...link,
        predecessor: timings[link.predecessorId],
      }))
      .filter(link => link.predecessor)
    const predecessors = explicitLinks.length > 0
      ? explicitLinks
      : useImplicitSequence && index > 0
        ? [{
            predecessorId: orderedActivities[index - 1].id,
            dependencyType: 'FS',
            lag: 0,
            predecessor: timings[orderedActivities[index - 1].id],
          }].filter(link => link.predecessor)
        : []

    let start = 0
    let driverId = null
    let driverLink = null
    if (predecessors.length > 0) {
      const driver = predecessors.reduce((latest, link) => {
        const effectiveLag = Number.isNaN(link.lag) ? 0 : link.lag
        const baseOffset = link.dependencyType === 'SS'
          ? link.predecessor.start
          : link.predecessor.finish
        const candidate = advanceWorkingDuration(baseOffset, effectiveLag, calendarConfig)

        if (!latest || candidate > latest.value) {
          return {
            id: link.predecessor.id,
            value: candidate,
            link: {
              ...link,
              lag: effectiveLag,
            },
          }
        }

        return latest
      }, null)

      start = driver?.value ?? 0
      driverId = driver?.id ?? null
      driverLink = driver?.link ?? null
    }

    const finish = advanceWorkingDuration(start, workingDuration, calendarConfig)
    const alignedStart = dateAware ? alignToWorkingBoundary(start, calendarConfig) : start
    timings[activity.id] = {
      id: activity.id,
      name: activity.name,
      start: parseFloat(start.toFixed(2)),
      alignedStart: parseFloat(alignedStart.toFixed(2)),
      finish: parseFloat(finish.toFixed(2)),
      duration: parseFloat(workingDuration.toFixed(2)),
      predecessorIds: explicitLinks.map(link => link.predecessorId),
      dependencyLinks: explicitLinks.map(link => ({
        predecessorId: link.predecessorId,
        dependencyType: link.dependencyType,
        lag: link.lag,
      })),
      dependencyType: driverLink?.dependencyType ?? activity.dependencyType,
      lag: driverLink?.lag ?? parseNumber(activity.lag, 0),
      driverId,
      startDate: dateAware ? formatISODate(getDateFromOffset(calendarConfig.projectStartDate, alignedStart)) : null,
      finishDate: dateAware ? formatISODate(getDateFromOffset(calendarConfig.projectStartDate, finish)) : null,
    }

    totalDuration = Math.max(totalDuration, finish)
  })

  const adjustedTotalDuration = parseFloat((totalDuration + holidayAdjustmentDays).toFixed(2))
  const projectFinishDate = dateAware
    ? formatISODate(getDateFromOffset(calendarConfig.projectStartDate, adjustedTotalDuration))
    : null

  return {
    timings,
    totalDuration: adjustedTotalDuration,
    holidayAdjustmentDays,
    holidayDateCount: parseHolidayDates(calendarConfig?.holidayDates).length,
    projectStartDate: dateAware ? calendarConfig.projectStartDate : null,
    projectFinishDate,
    dateAware,
    orderedActivities,
  }
}

function buildSimulationActivity(activity) {
  const sanitized = sanitizeActivity(activity)
  const predecessorIds = getPredecessorIds(activity)
  const dependencyLinks = getDependencyLinks(activity)
  return {
    ...activity,
    ...sanitized,
    id: activity.id ?? activity.name ?? `activity-${Math.random().toString(36).slice(2, 8)}`,
    predecessorId: predecessorIds[0] ?? '',
    predecessorIds,
    dependencyLinks,
    dependencyType: dependencyLinks[0]?.dependencyType ?? activity.dependencyType ?? 'FS',
    lag: String(dependencyLinks[0]?.lag ?? activity.lag ?? '0'),
    progressPercent: activity.progressPercent ?? '0',
    remainingDuration: activity.remainingDuration ?? '',
  }
}

export function sampleTriangular(o, m, p) {
  const u = Math.random()
  const fc = (m - o) / (p - o)

  if (u < fc) {
    return o + Math.sqrt(u * (p - o) * (m - o))
  }
  return p - Math.sqrt((1 - u) * (p - o) * (p - m))
}

export function sanitizeActivity(activity) {
  const o = parseFloat(activity.optimistic)
  const m = parseFloat(activity.mostLikely)
  const p = parseFloat(activity.pessimistic)

  if (isNaN(o) || isNaN(m) || isNaN(p) || m <= 0) {
    return { o: m || 0, m: m || 0, p: m || 0, valid: false }
  }

  if (o > m || m > p) {
    return { o: m, m: m, p: m, valid: false }
  }

  if (o === m && m === p) {
    return { o, m, p, valid: true }
  }

  return { o, m, p, valid: true }
}

export function autoFixActivityIssue(activity, issueType) {
  if (issueType !== 'invalid_order') return activity

  const values = [
    parseNumber(activity.optimistic, 0),
    parseNumber(activity.mostLikely, 0),
    parseNumber(activity.pessimistic, 0),
  ].sort((left, right) => left - right)

  return {
    ...activity,
    optimistic: String(values[0]),
    mostLikely: String(values[1]),
    pessimistic: String(values[2]),
  }
}

export function getActivityDiagnostics(activities) {
  const namedActivities = activities.filter(activity => activity.name?.trim() !== '')
  const activityIds = new Set(activities.map(activity => activity.id))
  const cyclicDependencyIds = detectCyclicDependencyIds(namedActivities)
  const nameCounts = namedActivities.reduce((counts, activity) => {
    const key = activity.name.trim().toLowerCase()
    counts.set(key, (counts.get(key) ?? 0) + 1)
    return counts
  }, new Map())

  const totalMostLikely = namedActivities.reduce(
    (sum, activity) => sum + Math.max(0, parseNumber(activity.mostLikely, 0)),
    0
  )

  const rows = activities.map((activity, index) => {
    const name = activity.name?.trim() || ''
    const predecessorIds = getPredecessorIds(activity)
    const dependencyLinks = getDependencyLinks(activity)
    const o = parseNumber(activity.optimistic)
    const m = parseNumber(activity.mostLikely)
    const p = parseNumber(activity.pessimistic)
    const named = name !== ''
    const hasNumericValues = !isNaN(o) && !isNaN(m) && !isNaN(p) && m > 0
    const ordered = hasNumericValues && o <= m && m <= p
    const duplicate = named && (nameCounts.get(name.toLowerCase()) ?? 0) > 1
    const range = named && !isNaN(o) && !isNaN(p)
      ? parseFloat(Math.max(0, p - o).toFixed(1))
      : null
    const contribution = totalMostLikely > 0 && m > 0
      ? parseFloat(((m / totalMostLikely) * 100).toFixed(1))
      : 0
    const rangeRatio = hasNumericValues && m > 0
      ? parseFloat(((Math.max(0, p - o) / m) || 0).toFixed(2))
      : 0
    const hasSelfDependency = predecessorIds.includes(activity.id)
    const missingPredecessorIds = predecessorIds.filter(predecessorId => !activityIds.has(predecessorId))
    const duplicatePredecessorIds = dependencyLinks
      .map(link => link.predecessorId)
      .filter(Boolean).length !== Array.from(new Set(predecessorIds)).length
    const hasCycle = cyclicDependencyIds.has(activity.id)
    const hasInvalidLag = dependencyLinks.some(link => Number.isNaN(link.lag))

    let reason = null
    let issueType = null

    if (named && !hasNumericValues) {
      reason = 'Lengkapi nilai durasi numerik dan pastikan Most Likely lebih besar dari 0.'
      issueType = 'missing_numeric'
    } else if (named && !ordered) {
      reason = 'Urutan estimasi harus O <= M <= P.'
      issueType = 'invalid_order'
    } else if (named && hasSelfDependency) {
      reason = 'Aktivitas tidak boleh menjadi predecessor untuk dirinya sendiri.'
      issueType = 'self_dependency'
    } else if (named && missingPredecessorIds.length > 0) {
      reason = 'Ada predecessor yang belum cocok dengan aktivitas mana pun.'
      issueType = 'missing_predecessor'
    } else if (named && hasCycle) {
      reason = 'Dependency membentuk cycle dan perlu diputus.'
      issueType = 'cyclic_dependency'
    } else if (named && hasInvalidLag) {
      reason = 'Lag dependency harus berupa angka yang valid.'
      issueType = 'invalid_lag'
    }

    return {
      id: activity.id,
      index: index + 1,
      name: name || `Aktivitas ${index + 1}`,
      named,
      valid: named && hasNumericValues && ordered,
      reason,
      issueType,
      mostLikely: !isNaN(m) && m > 0 ? m : 0,
      contribution,
      range,
      rangeRatio,
      duplicate,
      hasSelfDependency,
      missingPredecessorIds,
      duplicatePredecessorIds,
      hasCycle,
      hasInvalidLag,
      mitigationReady: Boolean(activity.mitigationAction?.trim()),
    }
  })

  const namedRows = rows.filter(row => row.named)
  const invalidRows = namedRows.filter(row => row.reason)
  const largestRangeRow = namedRows.reduce((largest, row) => {
    if (row.range === null) return largest
    if (!largest || row.range > largest.range) return row
    return largest
  }, null)

  const issues = []
  namedRows.forEach(row => {
    if (row.reason) {
      issues.push({
        id: `${row.id}-${row.issueType}`,
        rowId: row.id,
        rowIndex: row.index,
        type: row.issueType,
        severity: 'high',
        title: `Baris ${row.index}: ${row.reason}`,
        canAutoFix: row.issueType === 'invalid_order',
      })
    }

    if (row.duplicate) {
      issues.push({
        id: `${row.id}-duplicate_name`,
        rowId: row.id,
        rowIndex: row.index,
        type: 'duplicate_name',
        severity: 'medium',
        title: `Baris ${row.index}: nama aktivitas duplikat dengan baris lain.`,
        canAutoFix: false,
      })
    }

    if (row.duplicatePredecessorIds) {
      issues.push({
        id: `${row.id}-duplicate_predecessor`,
        rowId: row.id,
        rowIndex: row.index,
        type: 'duplicate_predecessor',
        severity: 'low',
        title: `Baris ${row.index}: predecessor yang sama dipilih lebih dari satu kali.`,
        canAutoFix: false,
      })
    }

    if (row.valid && row.range !== null && row.range <= NARROW_RANGE_THRESHOLD) {
      issues.push({
        id: `${row.id}-narrow_range`,
        rowId: row.id,
        rowIndex: row.index,
        type: 'narrow_range',
        severity: 'low',
        title: `Baris ${row.index}: range hanya ${row.range} hari, cek apakah terlalu sempit.`,
        canAutoFix: false,
      })
    }

    if (row.valid && row.rangeRatio >= WIDE_RANGE_RATIO) {
      issues.push({
        id: `${row.id}-wide_range`,
        rowId: row.id,
        rowIndex: row.index,
        type: 'wide_range',
        severity: 'medium',
        title: `Baris ${row.index}: range terhadap Most Likely cukup lebar (${row.rangeRatio}x).`,
        canAutoFix: false,
      })
    }

    if (row.valid && row.contribution >= DOMINANT_CONTRIBUTION_THRESHOLD) {
      issues.push({
        id: `${row.id}-dominant_contribution`,
        rowId: row.id,
        rowIndex: row.index,
        type: 'dominant_contribution',
        severity: 'medium',
        title: `Baris ${row.index}: kontribusi Most Likely ${row.contribution}% dari total.`,
        canAutoFix: false,
      })
    }
  })

  return {
    rows,
    issues,
    activityCount: namedRows.length,
    validCount: namedRows.filter(row => row.valid).length,
    invalidCount: invalidRows.length,
    invalidRows,
    totalMostLikely: parseFloat(totalMostLikely.toFixed(1)),
    largestRange: largestRangeRow?.range ?? 0,
    largestRangeName: largestRangeRow?.name ?? null,
  }
}

export function buildNetworkSummary(activities, options = {}) {
  const validActivities = activities
    .filter(activity => activity.name?.trim() !== '')
    .map(buildSimulationActivity)
    .filter(activity => activity.m > 0)

  if (validActivities.length === 0) {
    return {
      totalDuration: 0,
      holidayAdjustmentDays: 0,
      holidayDateCount: 0,
      projectStartDate: options?.calendarConfig?.projectStartDate ?? null,
      projectFinishDate: null,
      dateAware: false,
      criticalPath: [],
      nearCriticalPath: [],
      timingRows: [],
    }
  }

  const sampled = buildScheduledSample(validActivities, options, activity => activity.m)
  const endActivity = Object.values(sampled.timings).sort((left, right) => right.finish - left.finish)[0] ?? null

  const byName = new Map(validActivities.map(activity => [activity.id, activity.name]))
  const criticalPath = []
  let currentId = endActivity?.id ?? null
  while (currentId) {
    criticalPath.unshift(byName.get(currentId) ?? currentId)
    currentId = sampled.timings[currentId]?.driverId ?? null
  }

  const threshold = sampled.totalDuration * 0.9
  const nearCriticalPath = Object.values(sampled.timings)
    .filter(row => row.finish >= threshold && !criticalPath.includes(row.name))
    .map(row => row.name)

  return {
    totalDuration: sampled.totalDuration,
    holidayAdjustmentDays: sampled.holidayAdjustmentDays,
    holidayDateCount: sampled.holidayDateCount,
    projectStartDate: sampled.projectStartDate,
    projectFinishDate: sampled.projectFinishDate,
    dateAware: sampled.dateAware,
    criticalPath,
    nearCriticalPath,
    timingRows: sampled.orderedActivities.map(activity => sampled.timings[activity.id]),
  }
}

export function runSimulation(activities, iterations = 5000, options = {}) {
  const validActivities = activities
    .filter(activity => activity.name?.trim() !== '')
    .map(buildSimulationActivity)
    .filter(activity => activity.m > 0)

  if (validActivities.length === 0) {
    throw new Error('No valid activities found. Please check your input.')
  }

  const results = new Float64Array(iterations)
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const scheduled = buildScheduledSample(validActivities, options, activity => {
      if (activity.o === activity.p) return activity.m
      return sampleTriangular(activity.o, activity.m, activity.p)
    })

    results[iteration] = scheduled.totalDuration
  }

  const sorted = Array.from(results).sort((left, right) => left - right)
  const percentile = (pct) => {
    const idx = Math.ceil((pct / 100) * iterations) - 1
    return sorted[Math.max(0, Math.min(idx, iterations - 1))]
  }

  const mean = sorted.reduce((sum, value) => sum + value, 0) / iterations
  const variance = sorted.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / iterations
  const stdDev = Math.sqrt(variance)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]

  const p10 = percentile(10)
  const p50 = percentile(50)
  const p80 = percentile(80)
  const p90 = percentile(90)

  const numBins = 30
  const binWidth = (max - min) / numBins || 1
  const bins = Array.from({ length: numBins }, (_, index) => ({
    midpoint: min + ((index + 0.5) * binWidth),
    count: 0,
    risk: index / (numBins - 1),
  }))

  sorted.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), numBins - 1)
    bins[binIndex].count += 1
  })

  const histData = bins.map(bin => ({
    x: parseFloat(bin.midpoint.toFixed(2)),
    frequency: bin.count,
    risk: bin.risk,
  }))

  const sCurvePoints = 200
  const sCurveStep = (max - min) / sCurvePoints
  const sCurveData = []
  for (let index = 0; index <= sCurvePoints; index += 1) {
    const x = min + (index * sCurveStep)
    let cumCount = 0
    for (const value of sorted) {
      if (value <= x) cumCount += 1
      else break
    }
    sCurveData.push({
      x: parseFloat(x.toFixed(2)),
      probability: parseFloat(((cumCount / iterations) * 100).toFixed(2)),
    })
  }

  return {
    iterations,
    rawResults: Array.from(sorted),
    statistics: {
      mean: parseFloat(mean.toFixed(2)),
      stdDev: parseFloat(stdDev.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      p10: parseFloat(p10.toFixed(2)),
      p50: parseFloat(p50.toFixed(2)),
      p80: parseFloat(p80.toFixed(2)),
      p90: parseFloat(p90.toFixed(2)),
    },
    histData,
    sCurveData,
    sensitivityData: calcSensitivity(activities),
    networkSummary: buildNetworkSummary(activities, options),
    analysisMode: options?.calendarConfig?.analysisMode ?? 'plan',
  }
}

export function calcSensitivity(activities) {
  const totalML = activities.reduce((sum, activity) => sum + (parseNumber(activity.mostLikely, 0) || 0), 0)

  const items = activities
    .filter(activity => activity.name?.trim() !== '')
    .map(activity => {
      const o = parseNumber(activity.optimistic, 0)
      const m = parseNumber(activity.mostLikely, 0)
      const p = parseNumber(activity.pessimistic, 0)
      const range = Math.max(0, p - o)
      const contribution = totalML > 0 ? (m / totalML) * 100 : 0
      return {
        name: activity.name,
        optimistic: o,
        mostLikely: m,
        pessimistic: p,
        range: parseFloat(range.toFixed(2)),
        contribution: parseFloat(contribution.toFixed(1)),
        mitigationStatus: activity.mitigationStatus ?? 'not_started',
        mitigationAction: activity.mitigationAction ?? '',
      }
    })
    .filter(activity => activity.mostLikely > 0)
    .sort((left, right) => right.range - left.range)

  const maxRange = items[0]?.range || 1

  return items.slice(0, 8).map(item => {
    const riskRatio = item.range / maxRange
    let riskLevel = 'LOW'
    if (riskRatio > 0.8) riskLevel = 'HIGH'
    else if (riskRatio >= 0.4) riskLevel = 'MEDIUM'

    return {
      ...item,
      riskLevel,
      riskRatio,
      mitigationReady: Boolean(item.mitigationAction?.trim()),
    }
  })
}
