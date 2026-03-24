import React, { useMemo, useRef, useState } from 'react'
import Header from './components/Header'
import DashboardSidebar from './components/DashboardSidebar'
import DashboardStage from './components/DashboardStage'
import AppStatusBar from './components/AppStatusBar'
import StageContent from './components/StageContent'
import { exportToCSV } from './utils/export'
import { downloadActivityTemplateCSV } from './utils/import'
import { useLanguage } from './contexts/LanguageContext'
import { useDashboardUiState } from './hooks/useDashboardUiState'
import { useScenarioRunState } from './hooks/useScenarioRunState'
import { useStageNavigation } from './hooks/useStageNavigation'
import { useWorkspaceActions } from './hooks/useWorkspaceActions'
import { buildNetworkSummary, getActivityDiagnostics } from './utils/simulation'
import { useSimulationActions } from './hooks/useSimulationActions'
import { useWorkspaceModel } from './hooks/useWorkspaceModel'

export default function App() {
  const { t, language } = useLanguage()
  const {
    workspace,
    setWorkspace,
    currentProject,
    currentScenario,
    updateWorkspace,
    updateCurrentProject,
    updateCurrentScenario,
  } = useWorkspaceModel()
  const [simResults, setSimResults] = useState({})
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState(null)
  const [runCount, setRunCount] = useState(0)
  const [lastRunMs, setLastRunMs] = useState(null)

  const reportCaptureRef = useRef(null)
  const activities = currentScenario?.activities ?? []
  const iterations = currentScenario?.iterations ?? 5000
  const {
    selectedActivityId,
    setSelectedActivityId,
    dismissedIssueIds,
    setDismissedIssueIds,
    compareLeftId,
    setCompareLeftId,
    compareRightId,
    setCompareRightId,
    handleJumpToIssue,
  } = useDashboardUiState({
    currentProject,
    currentScenario,
  })

  const {
    handleSelectProject,
    handleCreateProject,
    handleDuplicateProject,
    handleDeleteProject,
    handleCreateScenario,
    handleDuplicateScenario,
    handleDeleteScenario,
    handleImportCSV,
    handleApplyPreset,
    handleAutoFixIssue,
  } = useWorkspaceActions({
    workspace,
    setWorkspace,
    setSimResults,
    currentProject,
    currentScenario,
    updateWorkspace,
    updateCurrentProject,
    updateCurrentScenario,
    setSelectedActivityId,
  })

  const { currentResultState, compareState } = useScenarioRunState({
    currentProject,
    currentScenario,
    compareLeftId,
    compareRightId,
    simResults,
  })

  const currentSimResult = simResults[currentScenario?.id] ?? null
  const currentStoredResult = currentResultState.result
  const storedNetworkSummary = currentStoredResult?.networkSummary ?? null

  const { activeSection, goToSection, setActiveSection } = useStageNavigation({
    hasResults: currentResultState.hasCharts,
    onIterationsChange: (nextIterations) => updateCurrentScenario(scenario => ({ ...scenario, iterations: nextIterations })),
  })

  const rawDiagnostics = getActivityDiagnostics(activities)
  const diagnostics = useMemo(() => ({
    ...rawDiagnostics,
    issues: rawDiagnostics.issues.filter(issue => !dismissedIssueIds.includes(issue.id)),
  }), [dismissedIssueIds, rawDiagnostics])
  const networkSummary = useMemo(
    () => buildNetworkSummary(activities, { calendarConfig: currentProject.calendarConfig }),
    [activities, currentProject.calendarConfig]
  )

  const staleRunAt = currentStoredResult?.runAt
    ? new Date(currentStoredResult.runAt).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')
    : null

  const {
    handleRun,
    handleExportPNG,
    handleExportPDF,
  } = useSimulationActions({
    activities,
    iterations,
    currentProject,
    currentScenario,
    compareComparison: compareState.comparison,
    reportCaptureRef,
    setError,
    setIsRunning,
    setLastRunMs,
    setRunCount,
    setSimResults,
    setActiveSection,
    updateCurrentScenario,
  })

  return (
    <div className="app-shell">
      <Header
        currentSection={activeSection}
        invalidCount={diagnostics.invalidCount}
        activityCount={diagnostics.activityCount}
        iterations={iterations}
        isRunning={isRunning}
        hasResults={Boolean(currentResultState.hasCharts)}
        onRun={handleRun}
        onSectionChange={goToSection}
      />

      {error && (
        <div className="app-banner app-banner-error" role="alert" aria-live="assertive">
          <div className="content-wrapper app-banner-inner">
            <strong>{t('app.banner.error.title')}</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      <main className="main-content">
        <div className="content-wrapper dashboard-layout">
          <DashboardSidebar
            workspace={workspace}
            currentProject={currentProject}
            currentScenario={currentScenario}
            updateCurrentProject={updateCurrentProject}
            updateCurrentScenario={updateCurrentScenario}
            workspaceActions={{
              handleSelectProject,
              handleCreateProject,
              handleDuplicateProject,
              handleDeleteProject,
              handleCreateScenario,
              handleDuplicateScenario,
              handleDeleteScenario,
            }}
            healthProps={{
              diagnostics,
              currentScenario,
              networkSummary,
              lastRunMs,
              currentStoredResult,
              currentProject,
            }}
          />

          <DashboardStage
            activeSection={activeSection}
            currentResultState={currentResultState}
            staleRunAt={staleRunAt}
            currentSimResult={currentSimResult}
            activities={activities}
            onExportCSV={exportToCSV}
            onExportPNG={handleExportPNG}
            onExportPDF={() => handleExportPDF(currentSimResult)}
          >
            <StageContent
              activeSection={activeSection}
              currentSimResult={currentSimResult}
              currentProject={currentProject}
              currentScenario={currentScenario}
              activities={activities}
              diagnostics={diagnostics}
              iterations={iterations}
              selectedActivityId={selectedActivityId}
              setSelectedActivityId={setSelectedActivityId}
              updateCurrentScenario={updateCurrentScenario}
              handleImportCSV={handleImportCSV}
              handleApplyPreset={handleApplyPreset}
              handleAutoFixIssue={handleAutoFixIssue}
              setDismissedIssueIds={setDismissedIssueIds}
              handleJumpToIssue={handleJumpToIssue}
              downloadActivityTemplateCSV={downloadActivityTemplateCSV}
              reportCaptureRef={reportCaptureRef}
              compareLeftId={compareLeftId}
              compareRightId={compareRightId}
              setCompareLeftId={setCompareLeftId}
              setCompareRightId={setCompareRightId}
              compareState={compareState}
              storedNetworkSummary={storedNetworkSummary}
              networkSummary={networkSummary}
            />
          </DashboardStage>
        </div>
      </main>

      <AppStatusBar
        currentStoredResult={currentStoredResult}
        runCount={runCount}
        currentProject={currentProject}
        currentScenario={currentScenario}
        diagnostics={diagnostics}
        networkSummary={networkSummary}
        currentResultState={currentResultState}
        lastRunMs={lastRunMs}
      />
    </div>
  )
}
