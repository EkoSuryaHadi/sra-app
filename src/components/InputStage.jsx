import React from 'react'
import InputTab from './InputTab'

export default function InputStage({
  activities,
  diagnostics,
  iterations,
  selectedActivityId,
  onSelectedActivityChange,
  onActivitiesChange,
  onImportCSV,
  onDownloadTemplate,
  onApplyPreset,
  onDismissIssue,
  onAutoFixIssue,
  onJumpToIssue,
}) {
  return (
    <InputTab
      activities={activities}
      diagnostics={diagnostics}
      iterations={iterations}
      selectedActivityId={selectedActivityId}
      onSelectedActivityChange={onSelectedActivityChange}
      onActivitiesChange={onActivitiesChange}
      onImportCSV={onImportCSV}
      onDownloadTemplate={onDownloadTemplate}
      onApplyPreset={onApplyPreset}
      onDismissIssue={onDismissIssue}
      onAutoFixIssue={onAutoFixIssue}
      onJumpToIssue={onJumpToIssue}
    />
  )
}
