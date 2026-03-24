import React from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export default function SidebarHealthCard({
  diagnostics,
  currentScenario,
  networkSummary,
  lastRunMs,
  currentStoredResult,
  currentProject,
}) {
  const { t } = useLanguage()

  return (
    <section className="section-card sidebar-health-card">
      <div className="sidebar-health-head">
        <div>
          <p className="summary-eyebrow">{t('app.sidebar.health.eyebrow')}</p>
          <h3 className="summary-title">{t('app.sidebar.health.title')}</h3>
        </div>
        <span className={`risk-badge ${diagnostics.invalidCount > 0 ? 'badge-medium' : 'badge-low'}`}>
          {diagnostics.invalidCount > 0 ? t('app.sidebar.health.review') : t('app.sidebar.health.ready')}
        </span>
      </div>

      <div className="sidebar-stat-grid">
        <div className="sidebar-stat">
          <span className="summary-stat-label">{t('app.sidebar.stat.activities')}</span>
          <strong className="metric-mono">{diagnostics.validCount}/{diagnostics.activityCount}</strong>
        </div>
        <div className="sidebar-stat">
          <span className="summary-stat-label">{t('app.sidebar.stat.scenario')}</span>
          <strong>{currentScenario.name}</strong>
        </div>
        <div className="sidebar-stat">
          <span className="summary-stat-label">{t('app.sidebar.stat.finish')}</span>
          <strong>{networkSummary.projectFinishDate || '--'}</strong>
        </div>
        <div className="sidebar-stat">
          <span className="summary-stat-label">{t('app.sidebar.stat.lastRun')}</span>
          <strong className="metric-mono">{lastRunMs !== null ? `${lastRunMs} ms` : '--'}</strong>
        </div>
      </div>

      <div className="sidebar-note">
        {currentStoredResult
          ? t('app.sidebar.note.p80').replace('{p80}', currentStoredResult.statistics.p80).replace('{project}', currentProject.name)
          : t('app.sidebar.note.wait')}
      </div>
    </section>
  )
}
