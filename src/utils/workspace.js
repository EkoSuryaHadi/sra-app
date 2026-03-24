const STORAGE_KEY = 'sra-workspace-v2'

export const DEFAULT_CALENDAR_CONFIG = {
  workweekDays: 7,
  projectStartDate: '',
  holidayDates: '',
  holidayOverrides: '',
  analysisMode: 'plan',
}

export function normalizePredecessorIds(value) {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[\n,;|]+/)
      : value
        ? [value]
        : []

  return Array.from(
    new Set(
      rawValues
        .map(entry => String(entry ?? '').trim())
        .filter(Boolean)
    )
  )
}

export function normalizeDependencyLinks(partial = {}) {
  if (Array.isArray(partial.dependencyLinks) && partial.dependencyLinks.length > 0) {
    return partial.dependencyLinks
      .map(link => ({
        predecessorId: String(link?.predecessorId ?? '').trim(),
        dependencyType: link?.dependencyType === 'SS' ? 'SS' : 'FS',
        lag: String(link?.lag ?? '0'),
      }))
      .filter(link => link.predecessorId !== '')
  }

  const predecessorIds = normalizePredecessorIds(partial.predecessorIds ?? partial.predecessorId)
  return predecessorIds.map(predecessorId => ({
    predecessorId,
    dependencyType: partial.dependencyType === 'SS' ? 'SS' : 'FS',
    lag: String(partial.lag ?? '0'),
  }))
}

const DEFAULT_ACTIVITY_SEED = [
  { name: 'Mobilisasi & Persiapan Lahan', optimistic: '5', mostLikely: '7', pessimistic: '12' },
  { name: 'Pekerjaan Pondasi', optimistic: '15', mostLikely: '20', pessimistic: '30' },
  { name: 'Fabrikasi Struktur Baja', optimistic: '20', mostLikely: '28', pessimistic: '40' },
  { name: 'Erection & Mechanical Works', optimistic: '25', mostLikely: '35', pessimistic: '55' },
  { name: 'Commissioning & Testing', optimistic: '7', mostLikely: '10', pessimistic: '18' },
]

function createId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyActivity(partial = {}) {
  const dependencyLinks = normalizeDependencyLinks(partial)
  const predecessorIds = dependencyLinks.map(link => link.predecessorId)

  return {
    id: partial.id ?? createId('act'),
    name: partial.name ?? '',
    optimistic: partial.optimistic ?? '',
    mostLikely: partial.mostLikely ?? '',
    pessimistic: partial.pessimistic ?? '',
    predecessorId: predecessorIds[0] ?? '',
    predecessorIds,
    dependencyLinks,
    dependencyType: dependencyLinks[0]?.dependencyType ?? partial.dependencyType ?? 'FS',
    lag: dependencyLinks[0]?.lag ?? partial.lag ?? '0',
    progressPercent: partial.progressPercent ?? '0',
    remainingDuration: partial.remainingDuration ?? '',
    actualStart: partial.actualStart ?? '',
    mitigationNote: partial.mitigationNote ?? '',
    mitigationAction: partial.mitigationAction ?? '',
    mitigationOwner: partial.mitigationOwner ?? '',
    mitigationDueDate: partial.mitigationDueDate ?? '',
    mitigationStatus: partial.mitigationStatus ?? 'not_started',
  }
}

export function hydrateActivities(activities = []) {
  return activities.map(activity => createEmptyActivity(activity))
}

export function createDefaultActivities() {
  const activities = DEFAULT_ACTIVITY_SEED.map(createEmptyActivity)

  return activities.map((activity, index) => ({
    ...activity,
    predecessorId: index === 0 ? '' : activities[index - 1].id,
    predecessorIds: index === 0 ? [] : [activities[index - 1].id],
    dependencyLinks: index === 0 ? [] : [{
      predecessorId: activities[index - 1].id,
      dependencyType: 'FS',
      lag: '0',
    }],
  }))
}

export function createScenario(name = 'Baseline', seedActivities = createDefaultActivities()) {
  const now = new Date().toISOString()
  return {
    id: createId('scn'),
    name,
    createdAt: now,
    updatedAt: now,
    iterations: 5000,
    activities: hydrateActivities(seedActivities),
    notes: '',
    lastRunSummary: null,
  }
}

export function createProject(name = 'Project 1', seedActivities = createDefaultActivities()) {
  const now = new Date().toISOString()
  const baselineScenario = createScenario('Baseline', seedActivities)

  return {
    id: createId('prj'),
    name,
    createdAt: now,
    updatedAt: now,
    notes: '',
    calendarConfig: { ...DEFAULT_CALENDAR_CONFIG },
    scenarios: [baselineScenario],
    currentScenarioId: baselineScenario.id,
  }
}

export function createDefaultWorkspace() {
  const project = createProject('Project Demo')

  return {
    projects: [project],
    currentProjectId: project.id,
    recentProjectIds: [project.id],
  }
}

export function hydrateWorkspace(rawWorkspace) {
  if (!rawWorkspace?.projects?.length) {
    return createDefaultWorkspace()
  }

  const projects = rawWorkspace.projects.map((project, index) => {
    const scenarios = (project.scenarios?.length ? project.scenarios : [createScenario('Baseline')]).map(scenario => ({
      ...scenario,
      iterations: Number(scenario.iterations) || 5000,
      activities: hydrateActivities(scenario.activities),
      lastRunSummary: scenario.lastRunSummary
        ? {
            ...scenario.lastRunSummary,
            runAt: scenario.lastRunSummary.runAt ?? null,
            analysisMode: scenario.lastRunSummary.analysisMode ?? 'plan',
            modelSignature: scenario.lastRunSummary.modelSignature ?? null,
            sensitivityData: Array.isArray(scenario.lastRunSummary.sensitivityData)
              ? scenario.lastRunSummary.sensitivityData
              : [],
          }
        : null,
    }))

    const currentScenarioId = scenarios.some(scenario => scenario.id === project.currentScenarioId)
      ? project.currentScenarioId
      : scenarios[0].id

    return {
      ...project,
      name: project.name || `Project ${index + 1}`,
      notes: project.notes ?? '',
      calendarConfig: {
        ...DEFAULT_CALENDAR_CONFIG,
        ...(project.calendarConfig ?? {}),
      },
      scenarios,
      currentScenarioId,
    }
  })

  const currentProjectId = projects.some(project => project.id === rawWorkspace.currentProjectId)
    ? rawWorkspace.currentProjectId
    : projects[0].id

  const recentProjectIds = Array.from(
    new Set([...(rawWorkspace.recentProjectIds ?? []), currentProjectId])
  ).filter(projectId => projects.some(project => project.id === projectId))

  return {
    projects,
    currentProjectId,
    recentProjectIds,
  }
}

export function loadWorkspace() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createDefaultWorkspace()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultWorkspace()

    return hydrateWorkspace(JSON.parse(raw))
  } catch {
    return createDefaultWorkspace()
  }
}

export function saveWorkspace(workspace) {
  if (typeof window === 'undefined' || !window.localStorage) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace))
}

export function getCurrentProject(workspace) {
  return workspace.projects.find(project => project.id === workspace.currentProjectId) ?? workspace.projects[0]
}

export function getCurrentScenario(project) {
  return project?.scenarios.find(scenario => scenario.id === project.currentScenarioId) ?? project?.scenarios?.[0] ?? null
}

export function withUpdatedProject(workspace, projectId, updater) {
  const projects = workspace.projects.map(project => {
    if (project.id !== projectId) return project
    return {
      ...updater(project),
      updatedAt: new Date().toISOString(),
    }
  })

  return {
    ...workspace,
    projects,
  }
}

export function trackRecentProject(workspace, projectId) {
  return {
    ...workspace,
    currentProjectId: projectId,
    recentProjectIds: [projectId, ...workspace.recentProjectIds.filter(id => id !== projectId)].slice(0, 5),
  }
}

export function clearWorkspaceStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return
  window.localStorage.removeItem(STORAGE_KEY)
}
