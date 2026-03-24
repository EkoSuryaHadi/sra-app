import React from 'react'
import Icon from './Icon'
import { useLanguage } from '../contexts/LanguageContext'

function formatDays(value, t) {
  return typeof value === 'number' ? `${value.toFixed(2)} ${t('results.dayUnit')}` : value
}

function formatMitigationStatus(status, t) {
  const key = {
    not_started: 'results.mitigation.status.not_started',
    in_progress: 'results.mitigation.status.in_progress',
    done: 'results.mitigation.status.done',
  }[status] ?? 'results.mitigation.status.not_started'

  return t(key)
}

export default function ResultsTab({ simResult, activities, project, scenario, networkSummary }) {
  const { t } = useLanguage()

  if (!simResult) {
    return (
      <div className="locked-panel">
        <Icon name="play" size={48} className="locked-icon" />
        <h3 className="locked-title">{t('results.locked.title')}</h3>
        <p className="locked-copy">
          {t('results.locked.desc')}
        </p>
      </div>
    )
  }

  const { statistics, iterations } = simResult
  const contingency = parseFloat((statistics.p80 - statistics.p50).toFixed(2))
  const reserveToP90 = parseFloat((statistics.p90 - statistics.p80).toFixed(2))

  const contributionSource = simResult.sensitivityData?.length
    ? simResult.sensitivityData
    : activities
      .filter(activity => activity.name?.trim() !== '' && parseFloat(activity.mostLikely) > 0)
      .map(activity => ({
        name: activity.name,
        mostLikely: parseFloat(activity.mostLikely) || 0,
        mitigationAction: activity.mitigationAction ?? '',
        mitigationStatus: activity.mitigationStatus ?? 'not_started',
      }))

  const totalML = contributionSource.reduce((sum, activity) => sum + (activity.mostLikely || 0), 0)
  const contributions = contributionSource
    .map(activity => ({
      name: activity.name,
      pct: totalML > 0 ? ((activity.mostLikely / totalML) * 100) : 0,
    }))
    .sort((left, right) => right.pct - left.pct)

  const heroCards = [
    {
      label: 'P50',
      value: formatDays(statistics.p50, t),
      tone: 'p50',
      icon: 'results',
      description: t('results.hero.p50'),
    },
    {
      label: 'P80',
      value: formatDays(statistics.p80, t),
      tone: 'p80',
      icon: 'check',
      description: t('results.hero.p80'),
    },
    {
      label: 'P90',
      value: formatDays(statistics.p90, t),
      tone: 'p90',
      icon: 'alert',
      description: t('results.hero.p90'),
    },
    {
      label: t('results.hero.contingencyLabel'),
      value: formatDays(contingency, t),
      tone: 'contingency',
      icon: 'iteration',
      description: t('results.hero.contingency'),
    },
  ]

  const statCards = [
    { label: 'P10', value: formatDays(statistics.p10, t) },
    { label: 'Mean', value: formatDays(statistics.mean, t) },
    { label: 'Std dev', value: formatDays(statistics.stdDev, t) },
    { label: 'Min', value: formatDays(statistics.min, t) },
    { label: 'Max', value: formatDays(statistics.max, t) },
  ]

  const mitigatedActivities = contributionSource.filter(activity => activity.mitigationAction?.trim() !== '')

  return (
    <div className="results-stack">
      <article className="section-card workspace-results-meta">
        <div className="workspace-meta-grid">
          <div className="meta-item">
            <span className="summary-stat-label">{t('results.meta.project')}</span>
            <div className="meta-value-group">
              <Icon name="folder" size={14} className="meta-icon" />
              <strong>{project?.name ?? '--'}</strong>
            </div>
          </div>
          <div className="meta-item">
            <span className="summary-stat-label">{t('results.meta.scenario')}</span>
            <div className="meta-value-group">
              <Icon name="layers" size={14} className="meta-icon" />
              <strong>{scenario?.name ?? '--'}</strong>
            </div>
          </div>
          <div className="meta-item">
            <span className="summary-stat-label">{t('results.meta.mode')}</span>
            <div className="meta-value-group">
              <Icon name="settings" size={14} className="meta-icon" />
              <strong>{simResult.analysisMode === 'remaining' ? t('results.meta.remaining') : t('results.meta.plan')}</strong>
            </div>
          </div>
          <div className="meta-item">
            <span className="summary-stat-label">{t('results.meta.finish')}</span>
            <div className="meta-value-group">
              <Icon name="activity" size={14} className="meta-icon" />
              <strong>{networkSummary?.projectFinishDate || '--'}</strong>
            </div>
          </div>
        </div>
      </article>

      <div className="hero-grid">
        {heroCards.map(card => (
          <article key={card.label} className={`hero-card hero-card-${card.tone}`}>
            <div className="hero-card-head">
              <span className="hero-card-label">{card.label}</span>
              <Icon name={card.icon || 'results'} size={18} />
            </div>
            <strong className="hero-card-value metric-mono">{card.value}</strong>
            <p className="hero-card-copy">{card.description}</p>
          </article>
        ))}
      </div>

      <div className="secondary-grid">
        {statCards.map(card => (
          <article key={card.label} className="stat-card">
            <span className="stat-card-label">{card.label}</span>
            <strong className="stat-card-value metric-mono">{card.value}</strong>
          </article>
        ))}
      </div>

      <article className="narrative-card">
        <div className="card-brand-group">
          <Icon name="insights" size={24} className="card-brand-icon" />
          <div>
            <p className="narrative-kicker">{t('results.recommendation.kicker')}</p>
            <h3 className="narrative-title">{t('results.recommendation.title')}</h3>
          </div>
        </div>
        <p className="narrative-copy">
          {t('results.recommendation.copy')
            .replace('{iterations}', iterations.toLocaleString())
            .replace('{p80}', statistics.p80)
            .replace('{contingency}', contingency)
            .replace('{reserve}', reserveToP90)}
        </p>
      </article>

      <article className="section-card">
        <div className="card-heading-row compact">
          <div className="card-brand-group">
            <Icon name="activity" size={24} className="card-brand-icon" />
            <div>
              <h3 className="card-title">{t('results.critical.title')}</h3>
              <p className="card-copy">
                {t('results.critical.copy')}
              </p>
            </div>
          </div>
          <span className="subtle-copy">{t('results.critical.duration').replace('{days}', networkSummary?.totalDuration?.toFixed?.(2) ?? '--')}</span>
        </div>

        <div className="network-summary-grid">
          <div className="summary-highlight">
            <span className="summary-highlight-label">{t('results.critical.path')}</span>
            <strong>{networkSummary?.criticalPath?.length ? networkSummary.criticalPath.join(' -> ') : t('results.critical.pathEmpty')}</strong>
          </div>
          <div className="summary-highlight">
            <span className="summary-highlight-label">{t('results.critical.near')}</span>
            <strong>{networkSummary?.nearCriticalPath?.length ? networkSummary.nearCriticalPath.join(', ') : t('results.critical.nearEmpty')}</strong>
          </div>
          <div className="summary-highlight">
            <span className="summary-highlight-label">{t('results.critical.holiday')}</span>
            <strong>
              {networkSummary?.holidayAdjustmentDays
                ? t('results.critical.holidayValue').replace('{days}', networkSummary.holidayAdjustmentDays)
                : t('results.critical.holidayEmpty')}
            </strong>
          </div>
          <div className="summary-highlight">
            <span className="summary-highlight-label">{t('results.critical.date')}</span>
            <strong>
              {networkSummary?.projectStartDate && networkSummary?.projectFinishDate
                ? `${networkSummary.projectStartDate} -> ${networkSummary.projectFinishDate}`
                : t('results.critical.dateEmpty')}
            </strong>
          </div>
        </div>
      </article>

      {contributions.length > 0 && (
        <article className="section-card">
          <div className="card-heading-row compact">
            <div>
              <h3 className="card-title">{t('results.contribution.title')}</h3>
              <p className="card-copy">
                {t('results.contribution.copy')}
              </p>
            </div>
            <span className="subtle-copy">{t('results.contribution.total').replace('{days}', totalML.toFixed(1))}</span>
          </div>

          <div className="activity-contrib-table">
            {contributions.map((item, index) => (
              <div key={index} className="contrib-row">
                <div>
                  <span className="contrib-name">{item.name}</span>
                  <div className="contrib-bar-wrap">
                    <div className="contrib-bar-fill" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
                <span className="contrib-pct metric-mono">{item.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </article>
      )}

      <article className="section-card">
        <div className="card-heading-row compact">
          <div>
            <h3 className="card-title">{t('results.mitigation.title')}</h3>
            <p className="card-copy">
              {t('results.mitigation.copy')}
            </p>
          </div>
          <span className="subtle-copy">{t('results.mitigation.count').replace('{count}', mitigatedActivities.length)}</span>
        </div>

        {mitigatedActivities.length === 0 ? (
          <div className="locked-panel">
            <h3 className="locked-title">{t('results.mitigation.emptyTitle')}</h3>
            <p className="locked-copy">
              {t('results.mitigation.emptyDesc')}
            </p>
          </div>
        ) : (
          <div className="activity-contrib-table">
            {mitigatedActivities.map(activity => (
              <div key={activity.name} className="mitigation-row">
                <div>
                  <span className="contrib-name">{activity.name}</span>
                  <div className="subtle-copy">{activity.mitigationAction}</div>
                </div>
                <span className="risk-badge badge-medium">{formatMitigationStatus(activity.mitigationStatus, t)}</span>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  )
}
