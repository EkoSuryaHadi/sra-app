import React from 'react'
import { useLanguage } from '../contexts/LanguageContext'

function formatMetric(metric) {
  return metric.delta > 0 ? `+${metric.delta}` : `${metric.delta}`
}

function ScenarioStatus({ label, state, scenario, t }) {
  if (!scenario) return null

  let badgeLabel = t('compare.status.ready')
  let badgeClass = 'badge-low'

  if (!state?.hasStoredResult) {
    badgeLabel = t('compare.status.missing')
    badgeClass = 'badge-medium'
  } else if (state.isStale) {
    badgeLabel = t('compare.status.stale')
    badgeClass = 'badge-medium'
  }

  return (
    <div className="summary-highlight">
      <span className="summary-highlight-label">{label}</span>
      <strong>{scenario.name}</strong>
      <span className={`risk-badge ${badgeClass}`}>{badgeLabel}</span>
    </div>
  )
}

export default function CompareSection({
  scenarios,
  leftScenarioId,
  rightScenarioId,
  onLeftChange,
  onRightChange,
  comparison,
  leftState,
  rightState,
  leftScenario,
  rightScenario,
  missingSide,
}) {
  const { t } = useLanguage()

  const renderSummary = () => {
    if (!comparison?.summary) return ''

    if (comparison.summary.key === 'changed') {
      return t(`compare.summary.${comparison.summary.direction}`)
        .replace('{name}', comparison.summary.name)
        .replace('{delta}', comparison.summary.delta)
    }

    return t('compare.summary.flat')
  }

  const emptyStateDescription = {
    both: t('compare.empty.both'),
    left: t('compare.empty.left'),
    right: t('compare.empty.right'),
  }[missingSide] ?? t('compare.empty.default')

  return (
    <article className="section-card compare-section">
      <div className="card-heading-row compact">
        <div>
          <h3 className="card-title">{t('compare.title')}</h3>
          <p className="card-copy">
            {t('compare.copy')}
          </p>
        </div>
      </div>

      <div className="compare-controls">
        <label className="control-field" htmlFor="compare-left">
          <span className="control-label">{t('compare.left')}</span>
          <select
            id="compare-left"
            className="iter-select"
            value={leftScenarioId}
            onChange={event => onLeftChange(event.target.value)}
          >
            {scenarios.map(scenario => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
        </label>

        <label className="control-field" htmlFor="compare-right">
          <span className="control-label">{t('compare.right')}</span>
          <select
            id="compare-right"
            className="iter-select"
            value={rightScenarioId}
            onChange={event => onRightChange(event.target.value)}
          >
            {scenarios.map(scenario => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="network-summary-grid">
        <ScenarioStatus label={t('compare.leftStatus')} state={leftState} scenario={leftScenario} t={t} />
        <ScenarioStatus label={t('compare.rightStatus')} state={rightState} scenario={rightScenario} t={t} />
      </div>

      {!comparison ? (
        <div className="locked-panel">
          <h3 className="locked-title">{t('compare.empty.title')}</h3>
          <p className="locked-copy">
            {emptyStateDescription}
          </p>
        </div>
      ) : (
        <div className="compare-grid">
          {comparison.metrics.map(metric => (
            <article key={metric.label} className="compare-card">
              <span className="hero-card-label">{metric.label}</span>
              <strong className="hero-card-value metric-mono">
                {metric.left} {'->'} {metric.right}
              </strong>
              <p className={`compare-delta ${metric.delta === 0 ? 'is-neutral' : metric.delta > 0 ? 'is-up' : 'is-down'}`}>
                {t('compare.delta').replace('{value}', formatMetric(metric))}
              </p>
            </article>
          ))}

          <article className="narrative-card compare-summary-card">
            <p className="narrative-kicker">{t('compare.insightKicker')}</p>
            <h3 className="narrative-title">{t('compare.insightTitle')}</h3>
            <p className="narrative-copy">{renderSummary()}</p>

            {comparison.topRiskShift && (
              <p className="subtle-copy">
                {t('compare.topRisk')
                  .replace('{name}', comparison.topRiskShift.name)
                  .replace('{level}', comparison.topRiskShift.riskLevel)}
              </p>
            )}
          </article>
        </div>
      )}
    </article>
  )
}
