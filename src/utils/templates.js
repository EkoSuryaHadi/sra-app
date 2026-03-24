import { createEmptyActivity } from './workspace'

const TEMPLATE_SEEDS = {
  building: [
    { name: 'Survey & Mobilisasi', optimistic: '3', mostLikely: '5', pessimistic: '8' },
    { name: 'Pekerjaan Pondasi', optimistic: '12', mostLikely: '18', pessimistic: '28' },
    { name: 'Struktur Atas', optimistic: '25', mostLikely: '35', pessimistic: '50' },
    { name: 'MEP Rough-in', optimistic: '14', mostLikely: '20', pessimistic: '32' },
    { name: 'Finishing & Snagging', optimistic: '10', mostLikely: '14', pessimistic: '24' },
  ],
  shutdown: [
    { name: 'Isolation & Permit', optimistic: '1', mostLikely: '2', pessimistic: '3' },
    { name: 'Equipment Cooldown', optimistic: '1', mostLikely: '2', pessimistic: '4' },
    { name: 'Inspection & Cleaning', optimistic: '2', mostLikely: '4', pessimistic: '7' },
    { name: 'Repair Window', optimistic: '3', mostLikely: '5', pessimistic: '10' },
    { name: 'Restart & Stabilization', optimistic: '1', mostLikely: '2', pessimistic: '4' },
  ],
  fabrication: [
    { name: 'Shop Drawing Approval', optimistic: '4', mostLikely: '6', pessimistic: '10' },
    { name: 'Material Procurement', optimistic: '6', mostLikely: '10', pessimistic: '18' },
    { name: 'Cutting & Fit-up', optimistic: '5', mostLikely: '8', pessimistic: '13' },
    { name: 'Welding & NDT', optimistic: '8', mostLikely: '12', pessimistic: '20' },
    { name: 'Painting & Delivery', optimistic: '4', mostLikely: '6', pessimistic: '11' },
  ],
  epc: [
    { name: 'Basic Engineering', optimistic: '15', mostLikely: '22', pessimistic: '35' },
    { name: 'Detailed Engineering', optimistic: '25', mostLikely: '35', pessimistic: '55' },
    { name: 'Long Lead Procurement', optimistic: '35', mostLikely: '50', pessimistic: '80' },
    { name: 'Construction Window', optimistic: '40', mostLikely: '55', pessimistic: '90' },
    { name: 'Pre-commissioning', optimistic: '10', mostLikely: '15', pessimistic: '25' },
  ],
}

export const PROJECT_TEMPLATES = [
  { id: 'building', label: 'Building' },
  { id: 'shutdown', label: 'Shutdown' },
  { id: 'fabrication', label: 'Fabrication' },
  { id: 'epc', label: 'EPC ringan' },
]

export function getTemplateActivities(templateId) {
  const seed = TEMPLATE_SEEDS[templateId] ?? TEMPLATE_SEEDS.building
  const activities = seed.map(createEmptyActivity)

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
