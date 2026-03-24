import { createEmptyActivity } from './workspace'

function splitCsvLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === '"') {
      const nextChar = line[index + 1]
      if (inQuotes && nextChar === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  fields.push(current.trim())
  return fields
}

function normalizeHeader(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

const HEADER_MAP = {
  name: 'name',
  activity: 'name',
  activityname: 'name',
  optimistic: 'optimistic',
  o: 'optimistic',
  mostlikely: 'mostLikely',
  m: 'mostLikely',
  pessimistic: 'pessimistic',
  p: 'pessimistic',
  predecessor: 'predecessorName',
  predecessors: 'predecessorName',
  predecessorname: 'predecessorName',
  dependencytype: 'dependencyType',
  relation: 'dependencyType',
  lag: 'lag',
  progresspercent: 'progressPercent',
  progress: 'progressPercent',
  remainingduration: 'remainingDuration',
  actualstart: 'actualStart',
  mitigationaction: 'mitigationAction',
  mitigationowner: 'mitigationOwner',
  mitigationstatus: 'mitigationStatus',
  mitigationduedate: 'mitigationDueDate',
  risknote: 'mitigationNote',
  mitigationnote: 'mitigationNote',
}

export function parseActivitiesCSV(csvText) {
  const rows = csvText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  if (rows.length < 2) {
    throw new Error('File CSV tidak berisi data aktivitas.')
  }

  const headers = splitCsvLine(rows[0]).map(header => HEADER_MAP[normalizeHeader(header)] ?? null)
  if (!headers.includes('name')) {
    throw new Error('Kolom nama aktivitas tidak ditemukan pada CSV.')
  }

  const importedRows = rows.slice(1).map(line => {
    const fields = splitCsvLine(line)
    const partial = {}

    headers.forEach((header, index) => {
      if (!header) return
      partial[header] = fields[index] ?? ''
    })

    return partial
  }).filter(row => Object.values(row).some(value => String(value ?? '').trim() !== ''))

  const activities = importedRows.map(createEmptyActivity)
  const nameToId = new Map(activities.map(activity => [activity.name.trim().toLowerCase(), activity.id]))

  return activities.map((activity, index) => {
    const predecessorNames = String(importedRows[index].predecessorName ?? '')
      .split(/[;|]+/)
      .map(value => value.trim().toLowerCase())
      .filter(Boolean)
    const predecessorIds = predecessorNames
      .map(name => nameToId.get(name) ?? '')
      .filter(Boolean)
    const dependencyTypes = String(importedRows[index].dependencyType ?? '')
      .split(/[;|]+/)
      .map(value => value.trim().toUpperCase())
      .filter(Boolean)
    const lags = String(importedRows[index].lag ?? '')
      .split(/[;|]+/)
      .map(value => value.trim())
      .filter(value => value !== '')
    const dependencyLinks = predecessorIds.map((predecessorId, linkIndex) => ({
      predecessorId,
      dependencyType: dependencyTypes[linkIndex] === 'SS' ? 'SS' : (dependencyTypes[0] === 'SS' ? 'SS' : 'FS'),
      lag: lags[linkIndex] ?? lags[0] ?? '0',
    }))

    return {
      ...activity,
      predecessorId: predecessorIds[0] ?? '',
      predecessorIds,
      dependencyLinks,
      dependencyType: dependencyLinks[0]?.dependencyType ?? 'FS',
      lag: dependencyLinks[0]?.lag ?? '0',
    }
  })
}

export function buildActivityTemplateCSV() {
  return [
    'name,optimistic,mostLikely,pessimistic,predecessors,dependencyType,lag,progressPercent,remainingDuration,mitigationAction,mitigationOwner,mitigationStatus',
    'Mobilisasi,3,5,8,,FS,0,0,,Koordinasi early mobilization,Planner,not_started',
    'Pondasi,12,18,28,Mobilisasi,FS,0,10,16,Review vendor beton,Site Engineer,in_progress',
  ].join('\n')
}

export function downloadActivityTemplateCSV() {
  const blob = new Blob([buildActivityTemplateCSV()], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'SRA_Activity_Template.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
