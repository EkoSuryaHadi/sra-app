import React from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export default function AppStatusBar({
  currentStoredResult,
  runCount,
  currentProject,
  currentScenario,
  diagnostics,
  networkSummary,
  currentResultState,
  lastRunMs,
}) {
  const { t } = useLanguage()

  return (
    <footer className="status-bar" aria-live="polite">
      <div className="content-wrapper status-bar-inner">
        <span className="status-item">
          <span className={`status-dot ${currentStoredResult ? 'dot-green' : 'dot-gray'}`} />
          {currentStoredResult
            ? t('app.status.runDone').replace('{count}', runCount).replace('{project}', currentProject.name).replace('{scenario}', currentScenario.name)
            : t('app.status.ready')}
        </span>

        <span className="status-item">
          <span className="status-dot dot-amber" />
          {t('app.status.activities').replace('{valid}', diagnostics.validCount).replace('{total}', diagnostics.activityCount)}
        </span>

        <span className="status-item">
          <span className="status-dot dot-amber" />
          {t('app.status.mode')
            .replace('{mode}', currentProject.calendarConfig.analysisMode === 'remaining' ? t('app.status.remainingRisk') : t('app.status.planRisk'))
            .replace('{days}', currentProject.calendarConfig.workweekDays)}
        </span>

        {networkSummary.holidayAdjustmentDays > 0 && (
          <span className="status-item">
            <span className="status-dot dot-amber" />
            {t('app.status.holiday').replace('{days}', networkSummary.holidayAdjustmentDays)}
          </span>
        )}

        {networkSummary.projectFinishDate && (
          <span className="status-item">
            <span className="status-dot dot-green" />
            {t('app.status.finish').replace('{date}', networkSummary.projectFinishDate)}
          </span>
        )}

        {currentResultState.isStale && currentResultState.hasStoredResult && (
          <span className="status-item">
            <span className="status-dot dot-amber" />
            {t('app.status.stale')}
          </span>
        )}

        {lastRunMs !== null && (
          <span className="status-item status-item-push metric-mono">
            {t('app.status.time').replace('{ms}', lastRunMs)}
          </span>
        )}
      </div>
    </footer>
  )
}
