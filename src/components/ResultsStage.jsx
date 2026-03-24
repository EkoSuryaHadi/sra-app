import React, { Suspense, lazy } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import LockedSection from './LockedSection'

const ResultsTab = lazy(() => import('./ResultsTab'))
const CompareSection = lazy(() => import('./CompareSection'))

export default function ResultsStage({
  currentSimResult,
  currentProject,
  currentScenario,
  activities,
  reportCaptureRef,
  compareLeftId,
  compareRightId,
  setCompareLeftId,
  setCompareRightId,
  compareState,
  storedNetworkSummary,
  networkSummary,
}) {
  const { t } = useLanguage()

  if (!currentSimResult) {
    return (
      <LockedSection
        title={t('app.locked.resultsWait.title')}
        description={t('app.locked.resultsWait.desc')}
      />
    )
  }

  return (
    <Suspense
      fallback={
        <LockedSection
          title={t('app.locked.resultsWait.title')}
          description={t('app.locked.insights.desc')}
          icon="results"
        />
      }
    >
      <div ref={reportCaptureRef} className="report-capture">
        <ResultsTab
          simResult={currentSimResult}
          activities={activities}
          project={currentProject}
          scenario={currentScenario}
          networkSummary={storedNetworkSummary ?? networkSummary}
        />

        {currentProject.scenarios.length > 1 && (
          <CompareSection
            scenarios={currentProject.scenarios}
            leftScenarioId={compareLeftId}
            rightScenarioId={compareRightId}
            onLeftChange={setCompareLeftId}
            onRightChange={setCompareRightId}
            comparison={compareState.comparison}
            leftState={compareState.leftState}
            rightState={compareState.rightState}
            leftScenario={compareState.leftScenario}
            rightScenario={compareState.rightScenario}
            missingSide={compareState.missingSide}
          />
        )}
      </div>
    </Suspense>
  )
}
