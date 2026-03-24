import { jsPDF } from 'jspdf'
import { toPng } from 'html-to-image'
import { calcSensitivity } from './simulation'

function baseFileName(projectName, scenarioName) {
  const safeProject = projectName.replace(/[^\w-]+/g, '_')
  const safeScenario = scenarioName.replace(/[^\w-]+/g, '_')
  const date = new Date().toISOString().slice(0, 10)
  return `SRA_${safeProject}_${safeScenario}_${date}`
}

export async function exportResultsToPNG(node, projectName, scenarioName) {
  if (!node) return

  const dataUrl = await toPng(node, {
    cacheBust: true,
    backgroundColor: '#ffffff',
    pixelRatio: 2,
  })

  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `${baseFileName(projectName, scenarioName)}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function exportResultsToPDF({
  node,
  project,
  scenario,
  simResult,
  comparison,
}) {
  if (!project || !scenario || !simResult) return

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40
  let currentY = 46

  const writeLine = (text, options = {}) => {
    doc.setFontSize(options.size ?? 11)
    doc.setFont('helvetica', options.bold ? 'bold' : 'normal')
    doc.text(text, margin, currentY)
    currentY += options.gap ?? 18
  }

  const contingency = parseFloat((simResult.statistics.p80 - simResult.statistics.p50).toFixed(2))
  const topRisks = calcSensitivity(scenario.activities).slice(0, 3)

  writeLine('Scheduler Risk Analysis Report', { size: 18, bold: true, gap: 24 })
  writeLine(`Project: ${project.name}`, { bold: true })
  writeLine(`Scenario: ${scenario.name}`)
  writeLine(`Generated: ${new Date().toLocaleString('id-ID')}`)
  writeLine(`Mode analisis: ${project.calendarConfig.analysisMode === 'remaining' ? 'Remaining risk' : 'Plan risk'}`)
  writeLine(`Kalender kerja: ${project.calendarConfig.workweekDays} hari kerja per minggu`, { gap: 22 })

  writeLine('Ringkasan percentile', { size: 13, bold: true, gap: 16 })
  ;[
    `P10: ${simResult.statistics.p10} hari`,
    `P50: ${simResult.statistics.p50} hari`,
    `P80: ${simResult.statistics.p80} hari`,
    `P90: ${simResult.statistics.p90} hari`,
    `Contingency: ${contingency} hari`,
  ].forEach(text => writeLine(text))

  currentY += 8
  writeLine('Top risk activity', { size: 13, bold: true, gap: 16 })
  if (topRisks.length === 0) {
    writeLine('Belum ada data sensitivitas.')
  } else {
    topRisks.forEach(item => writeLine(`${item.name} | Range ${item.range} hari | ${item.riskLevel}`))
  }

  if (comparison) {
    currentY += 8
    writeLine('Perbandingan skenario', { size: 13, bold: true, gap: 16 })
    comparison.metrics.forEach(metric => {
      writeLine(`${metric.label}: ${metric.left} -> ${metric.right} (delta ${metric.delta > 0 ? '+' : ''}${metric.delta})`)
    })
  }

  if (node) {
    try {
      const imageData = await toPng(node, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      })

      const imgWidth = pageWidth - (margin * 2)
      const imgHeight = imgWidth * 0.62

      if (currentY + imgHeight > 760) {
        doc.addPage()
        currentY = 46
      }

      doc.addImage(imageData, 'PNG', margin, currentY, imgWidth, imgHeight)
    } catch {
      // Fall back to text-only PDF if DOM capture is unavailable.
    }
  }

  doc.save(`${baseFileName(project.name, scenario.name)}.pdf`)
}
