import React from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export default function DashboardStage({
  activeSection,
  currentResultState,
  staleRunAt,
  currentSimResult,
  activities,
  onExportCSV,
  onExportPNG,
  onExportPDF,
  children,
}) {
  const { t } = useLanguage()
  const activeStage = {
    input: {
      eyebrow: t('app.stage.input.eyebrow'),
      title: t('app.stage.input.title'),
      description: t('app.stage.input.desc'),
    },
    results: {
      eyebrow: t('app.stage.results.eyebrow'),
      title: t('app.stage.results.title'),
      description: t('app.stage.results.desc'),
    },
    insights: {
      eyebrow: t('app.stage.insights.eyebrow'),
      title: t('app.stage.insights.title'),
      description: t('app.stage.insights.desc'),
    },
  }[activeSection]

  return (
    <section className="dashboard-stage" aria-labelledby="active-stage-title">
      <div className="stage-shell">
        <div className="stage-topbar">
          <div className="stage-headline">
            <p className="section-eyebrow">{activeStage.eyebrow}</p>
            <h2 id="active-stage-title" className="stage-title">{activeStage.title}</h2>
            <p className="stage-copy">{activeStage.description}</p>
          </div>

          <div className="stage-actions">
            {activeSection === 'results' && currentSimResult && (
              <>
                <button type="button" className="btn-export" onClick={() => onExportCSV(currentSimResult, activities)}>
                  {t('app.export.csv')}
                </button>
                <button type="button" className="btn-export" onClick={onExportPNG}>
                  {t('app.export.png')}
                </button>
                <button type="button" className="btn-export" onClick={onExportPDF}>
                  {t('app.export.pdf')}
                </button>
              </>
            )}
          </div>
        </div>

        {(activeSection === 'results' || activeSection === 'insights') && currentResultState.isStale && currentResultState.hasStoredResult && (
          <div className="inline-warning" role="status" aria-live="polite">
            <div className="inline-warning-title">{t('app.stale.title')}</div>
            <p className="inline-warning-copy">
              {t('app.stale.desc')}
            </p>
            {staleRunAt && (
              <div className="subtle-copy">
                {t('app.stale.lastRun').replace('{time}', staleRunAt)}
              </div>
            )}
          </div>
        )}

        <div className="stage-frame">
          {children}
        </div>
      </div>
    </section>
  )
}
