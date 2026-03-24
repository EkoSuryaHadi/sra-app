import React from 'react'
import InputStage from './InputStage'
import ResultsStage from './ResultsStage'
import InsightsStage from './InsightsStage'

export default function StageContent({
  activeSection,
  currentSimResult,
  currentProject,
  currentScenario,
  activities,
  diagnostics,
  iterations,
  selectedActivityId,
  setSelectedActivityId,
  updateCurrentScenario,
  handleImportCSV,
  handleApplyPreset,
  handleAutoFixIssue,
  setDismissedIssueIds,
  handleJumpToIssue,
  downloadActivityTemplateCSV,
  reportCaptureRef,
  compareLeftId,
  compareRightId,
  setCompareLeftId,
  setCompareRightId,
  compareState,
  storedNetworkSummary,
  networkSummary,
}) {
  if (activeSection === 'input') {
    return (
      <InputStage
        activities={activities}
        diagnostics={diagnostics}
        iterations={iterations}
        selectedActivityId={selectedActivityId}
        onSelectedActivityChange={setSelectedActivityId}
        onActivitiesChange={(nextActivities) => updateCurrentScenario(scenario => ({ ...scenario, activities: nextActivities }))}
        onImportCSV={handleImportCSV}
        onDownloadTemplate={downloadActivityTemplateCSV}
        onApplyPreset={handleApplyPreset}
        onDismissIssue={(issueId) => setDismissedIssueIds(current => [...current, issueId])}
        onAutoFixIssue={handleAutoFixIssue}
        onJumpToIssue={handleJumpToIssue}
      />
    )
  }

  if (activeSection === 'results') {
    return (
      <ResultsStage
        currentSimResult={currentSimResult}
        currentProject={currentProject}
        currentScenario={currentScenario}
        activities={activities}
        reportCaptureRef={reportCaptureRef}
        compareLeftId={compareLeftId}
        compareRightId={compareRightId}
        setCompareLeftId={setCompareLeftId}
        setCompareRightId={setCompareRightId}
        compareState={compareState}
        storedNetworkSummary={storedNetworkSummary}
        networkSummary={networkSummary}
      />
    )
  }

  return (
    <InsightsStage
      currentSimResult={currentSimResult}
      activities={activities}
      storedNetworkSummary={storedNetworkSummary}
      networkSummary={networkSummary}
      sensitivityData={currentSimResult?.sensitivityData ?? currentScenario?.lastRunSummary?.sensitivityData}
    />
  )
}
