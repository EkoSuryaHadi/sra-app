import React, { Suspense, lazy } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import LockedSection from './LockedSection'

const ChartsTab = lazy(() => import('./ChartsTab'))
const SensitivityTab = lazy(() => import('./SensitivityTab'))

export default function InsightsStage({
  currentSimResult,
  activities,
  storedNetworkSummary,
  networkSummary,
  sensitivityData,
}) {
  const { t } = useLanguage()

  if (!currentSimResult) {
    return (
      <LockedSection
        title={t('app.locked.insightsWait.title')}
        description={t('app.locked.insightsWait.desc')}
      />
    )
  }

  return (
    <Suspense
      fallback={
        <div className="locked-panel">
          <h3 className="locked-title">{t('app.locked.insights.title')}</h3>
          <p className="locked-copy">
            {t('app.locked.insights.desc')}
          </p>
        </div>
      }
    >
      <div className="insights-stack">
        <ChartsTab simResult={currentSimResult} />
        <SensitivityTab
          activities={activities}
          networkSummary={storedNetworkSummary ?? networkSummary}
          sensitivityData={sensitivityData}
        />
      </div>
    </Suspense>
  )
}
