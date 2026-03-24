import { useCallback } from 'react'
import { runSimulation } from '../utils/simulation'
import { createStoredRunSummary, decorateSimulationResult } from '../utils/resultState'

export function useSimulationActions({
  activities,
  iterations,
  currentProject,
  currentScenario,
  compareComparison,
  reportCaptureRef,
  setError,
  setIsRunning,
  setLastRunMs,
  setRunCount,
  setSimResults,
  setActiveSection,
  updateCurrentScenario,
}) {
  const handleRun = useCallback(async () => {
    setIsRunning(true)
    setError(null)

    await new Promise(resolve => setTimeout(resolve, 10))

    try {
      const start = performance.now()
      const rawResult = runSimulation(activities, iterations, {
        calendarConfig: currentProject.calendarConfig,
      })
      const runAt = new Date().toISOString()
      const result = decorateSimulationResult({
        project: currentProject,
        scenario: currentScenario,
        result: rawResult,
        runAt,
      })
      const storedSummary = createStoredRunSummary({
        project: currentProject,
        scenario: currentScenario,
        result,
        runAt,
      })
      const elapsed = performance.now() - start

      setSimResults(current => ({
        ...current,
        [currentScenario.id]: result,
      }))
      updateCurrentScenario(scenario => ({
        ...scenario,
        lastRunSummary: storedSummary,
      }))
      setLastRunMs(Math.round(elapsed))
      setRunCount(count => count + 1)
      setActiveSection('results')

      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '#results')
      }
    } catch (runError) {
      setError(runError.message)
      setActiveSection('input')
    } finally {
      setIsRunning(false)
    }
  }, [
    activities,
    currentProject,
    currentScenario,
    iterations,
    setActiveSection,
    setError,
    setIsRunning,
    setLastRunMs,
    setRunCount,
    setSimResults,
    updateCurrentScenario,
  ])

  const handleExportPNG = useCallback(async () => {
    const { exportResultsToPNG } = await import('../utils/report')
    await exportResultsToPNG(reportCaptureRef.current, currentProject.name, currentScenario.name)
  }, [currentProject.name, currentScenario.name, reportCaptureRef])

  const handleExportPDF = useCallback(async (currentSimResult) => {
    const { exportResultsToPDF } = await import('../utils/report')
    await exportResultsToPDF({
      node: reportCaptureRef.current,
      project: currentProject,
      scenario: currentScenario,
      simResult: currentSimResult,
      comparison: compareComparison,
    })
  }, [compareComparison, currentProject, currentScenario, reportCaptureRef])

  return {
    handleRun,
    handleExportPNG,
    handleExportPDF,
  }
}
