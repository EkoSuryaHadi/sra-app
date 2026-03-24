import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildNetworkSummary,
  calcSensitivity,
  countHolidayOverrides,
  getActivityDiagnostics,
  parseHolidayDates,
  runSimulation,
  sanitizeActivity,
  sampleTriangular,
} from './simulation'

describe('sanitizeActivity', () => {
  it('falls back to deterministic most likely value when O/M/P order is invalid', () => {
    expect(
      sanitizeActivity({ optimistic: '12', mostLikely: '10', pessimistic: '20' })
    ).toEqual({ o: 10, m: 10, p: 10, valid: false })
  })

  it('rejects non numeric values', () => {
    expect(
      sanitizeActivity({ optimistic: 'a', mostLikely: '8', pessimistic: '12' })
    ).toEqual({ o: 8, m: 8, p: 8, valid: false })
  })
})

describe('sampleTriangular', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses the lower branch when random value is below the CDF breakpoint', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    expect(sampleTriangular(10, 15, 25)).toBeCloseTo(12.739, 3)
  })

  it('uses the upper branch when random value is above the CDF breakpoint', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    expect(sampleTriangular(10, 15, 25)).toBeCloseTo(21.127, 3)
  })
})

describe('runSimulation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns deterministic statistics when all activities collapse to fixed values', () => {
    const activities = [
      { name: 'A', optimistic: '5', mostLikely: '5', pessimistic: '5' },
      { name: 'B', optimistic: '3', mostLikely: '3', pessimistic: '3' },
    ]

    const result = runSimulation(activities, 5)

    expect(result.rawResults).toEqual([8, 8, 8, 8, 8])
    expect(result.statistics).toEqual({
      mean: 8,
      stdDev: 0,
      min: 8,
      max: 8,
      p10: 8,
      p50: 8,
      p80: 8,
      p90: 8,
    })
  })

  it('throws when no valid activities are available', () => {
    expect(() => runSimulation([{ name: '', optimistic: '', mostLikely: '', pessimistic: '' }], 10))
      .toThrow('No valid activities found. Please check your input.')
  })

  it('respects lightweight FS dependencies when calculating total duration', () => {
    const activities = [
      { id: 'a', name: 'A', optimistic: '5', mostLikely: '5', pessimistic: '5', predecessorIds: [], dependencyType: 'FS', lag: '0' },
      { id: 'b', name: 'B', optimistic: '3', mostLikely: '3', pessimistic: '3', predecessorIds: ['a'], dependencyType: 'FS', lag: '2' },
    ]

    const result = runSimulation(activities, 5)

    expect(result.statistics.p50).toBe(10)
    expect(result.networkSummary.criticalPath).toEqual(['A', 'B'])
  })

  it('supports remaining risk mode and workweek conversion', () => {
    const activities = [
      {
        id: 'a',
        name: 'A',
        optimistic: '10',
        mostLikely: '10',
        pessimistic: '10',
        predecessorIds: [],
        dependencyType: 'FS',
        lag: '0',
        progressPercent: '50',
        remainingDuration: '4',
      },
    ]

    const result = runSimulation(activities, 5, {
      calendarConfig: { analysisMode: 'remaining', workweekDays: 5 },
    })

    expect(result.statistics.p50).toBeCloseTo(5.6, 1)
  })

  it('adds holiday overrides as a global allowance to project duration', () => {
    const activities = [
      { id: 'a', name: 'A', optimistic: '5', mostLikely: '5', pessimistic: '5', predecessorIds: [], dependencyType: 'FS', lag: '0' },
    ]

    const result = runSimulation(activities, 5, {
      calendarConfig: {
        analysisMode: 'plan',
        workweekDays: 7,
        holidayOverrides: 'Lebaran 1\nLebaran 2',
      },
    })

    expect(result.statistics.p50).toBe(7)
    expect(result.networkSummary.holidayAdjustmentDays).toBe(2)
  })

  it('uses the latest predecessor from a multi-predecessor chain as the schedule driver', () => {
    const activities = [
      { id: 'a', name: 'A', optimistic: '4', mostLikely: '4', pessimistic: '4', predecessorIds: [], dependencyType: 'FS', lag: '0' },
      { id: 'b', name: 'B', optimistic: '8', mostLikely: '8', pessimistic: '8', predecessorIds: [], dependencyType: 'FS', lag: '0' },
      { id: 'c', name: 'C', optimistic: '3', mostLikely: '3', pessimistic: '3', predecessorIds: ['a', 'b'], dependencyType: 'FS', lag: '0' },
    ]

    const result = runSimulation(activities, 5)

    expect(result.statistics.p50).toBe(11)
    expect(result.networkSummary.criticalPath).toEqual(['B', 'C'])
  })

  it('supports dependency type and lag per predecessor link', () => {
    const activities = [
      { id: 'a', name: 'A', optimistic: '4', mostLikely: '4', pessimistic: '4', dependencyLinks: [] },
      { id: 'b', name: 'B', optimistic: '6', mostLikely: '6', pessimistic: '6', dependencyLinks: [] },
      {
        id: 'c',
        name: 'C',
        optimistic: '3',
        mostLikely: '3',
        pessimistic: '3',
        dependencyLinks: [
          { predecessorId: 'a', dependencyType: 'FS', lag: '1' },
          { predecessorId: 'b', dependencyType: 'SS', lag: '2' },
        ],
      },
    ]

    const result = runSimulation(activities, 5)

    expect(result.statistics.p50).toBe(8)
    expect(result.networkSummary.criticalPath).toEqual(['A', 'C'])
  })

  it('uses project start date and 5-day calendar to derive forecast finish date', () => {
    const activities = [
      { id: 'a', name: 'A', optimistic: '2', mostLikely: '2', pessimistic: '2', dependencyLinks: [] },
    ]

    const result = runSimulation(activities, 5, {
      calendarConfig: {
        analysisMode: 'plan',
        workweekDays: 5,
        projectStartDate: '2026-03-20',
      },
    })

    expect(result.statistics.p50).toBe(4)
    expect(result.networkSummary.projectFinishDate).toBe('2026-03-24')
  })

  it('skips holiday dates when calculating date-aware duration', () => {
    const activities = [
      { id: 'a', name: 'A', optimistic: '2', mostLikely: '2', pessimistic: '2', dependencyLinks: [] },
    ]

    const result = runSimulation(activities, 5, {
      calendarConfig: {
        analysisMode: 'plan',
        workweekDays: 5,
        projectStartDate: '2026-03-23',
        holidayDates: '2026-03-24',
      },
    })

    expect(result.statistics.p50).toBe(3)
    expect(result.networkSummary.projectFinishDate).toBe('2026-03-26')
    expect(result.networkSummary.holidayDateCount).toBe(1)
  })
})

describe('getActivityDiagnostics', () => {
  it('summarizes valid and invalid named rows without counting blank rows as invalid', () => {
    const diagnostics = getActivityDiagnostics([
      { name: 'Valid task', optimistic: '2', mostLikely: '3', pessimistic: '5' },
      { name: 'Bad order', optimistic: '9', mostLikely: '4', pessimistic: '18' },
      { name: '', optimistic: '', mostLikely: '', pessimistic: '' },
    ])

    expect(diagnostics.activityCount).toBe(2)
    expect(diagnostics.validCount).toBe(1)
    expect(diagnostics.invalidCount).toBe(1)
    expect(diagnostics.totalMostLikely).toBe(7)
    expect(diagnostics.largestRangeName).toBe('Bad order')
    expect(diagnostics.invalidRows[0].reason).toContain('O <= M <= P')
  })

  it('flags cyclic dependencies as invalid rows', () => {
    const diagnostics = getActivityDiagnostics([
      { id: 'a', name: 'Task A', optimistic: '2', mostLikely: '3', pessimistic: '4', predecessorIds: ['b'] },
      { id: 'b', name: 'Task B', optimistic: '2', mostLikely: '3', pessimistic: '4', predecessorIds: ['a'] },
    ])

    expect(diagnostics.invalidCount).toBe(2)
    expect(diagnostics.issues.some(issue => issue.type === 'cyclic_dependency')).toBe(true)
  })

  it('flags invalid dependency lag values', () => {
    const diagnostics = getActivityDiagnostics([
      { id: 'a', name: 'Task A', optimistic: '2', mostLikely: '3', pessimistic: '4', dependencyLinks: [] },
      {
        id: 'b',
        name: 'Task B',
        optimistic: '2',
        mostLikely: '3',
        pessimistic: '4',
        dependencyLinks: [{ predecessorId: 'a', dependencyType: 'FS', lag: 'abc' }],
      },
    ])

    expect(diagnostics.issues.some(issue => issue.type === 'invalid_lag')).toBe(true)
  })
})

describe('calcSensitivity', () => {
  it('sorts by range descending and assigns risk levels relative to the largest range', () => {
    const result = calcSensitivity([
      { name: 'Critical', optimistic: '10', mostLikely: '15', pessimistic: '40' },
      { name: 'Medium', optimistic: '8', mostLikely: '10', pessimistic: '20' },
      { name: 'Low', optimistic: '5', mostLikely: '8', pessimistic: '10' },
    ])

    expect(result.map(item => item.name)).toEqual(['Critical', 'Medium', 'Low'])
    expect(result.map(item => item.riskLevel)).toEqual(['HIGH', 'MEDIUM', 'LOW'])
  })

  it('limits tornado data to the top 8 activities', () => {
    const activities = Array.from({ length: 10 }, (_, index) => ({
      name: `Activity ${index + 1}`,
      optimistic: '1',
      mostLikely: '2',
      pessimistic: String(12 - index),
    }))

    expect(calcSensitivity(activities)).toHaveLength(8)
  })
})

describe('buildNetworkSummary', () => {
  it('returns critical and near critical paths for deterministic network summary', () => {
    const summary = buildNetworkSummary([
      { id: 'a', name: 'Start', optimistic: '2', mostLikely: '2', pessimistic: '2', predecessorIds: [], dependencyType: 'FS', lag: '0' },
      { id: 'b', name: 'Parallel', optimistic: '5', mostLikely: '5', pessimistic: '5', predecessorIds: [], dependencyType: 'FS', lag: '0' },
      { id: 'c', name: 'Finish', optimistic: '3', mostLikely: '3', pessimistic: '3', predecessorIds: ['b'], dependencyType: 'FS', lag: '0' },
    ])

    expect(summary.totalDuration).toBe(8)
    expect(summary.criticalPath).toEqual(['Parallel', 'Finish'])
  })
})

describe('countHolidayOverrides', () => {
  it('counts unique holiday override entries from textarea input', () => {
    expect(countHolidayOverrides('Shutdown\nShutdown\nLebaran, Natal')).toBe(3)
  })
})

describe('parseHolidayDates', () => {
  it('keeps unique valid ISO holiday dates only', () => {
    expect(parseHolidayDates('2026-03-24\n2026-03-24\ninvalid;2026-04-01')).toEqual([
      '2026-03-24',
      '2026-04-01',
    ])
  })
})
