import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import { calcSensitivity } from '../utils/simulation'
import { useLanguage } from '../contexts/LanguageContext'

const TornadoTooltip = ({ active, payload, t }) => {
  if (!active || !payload?.length) return null
  const data = payload[0]?.payload
  return (
    <div className="custom-tooltip">
      <div className="tooltip-value" style={{ marginBottom: 4 }}>{data?.name}</div>
      <div className="tooltip-label">{t('sensitivity.tooltip.range')}</div>
      <div className="tooltip-value">{data?.range} {t('sensitivity.dayShort')}</div>
      <div className="tooltip-label" style={{ marginTop: 4 }}>{t('sensitivity.tooltip.optimistic')}</div>
      <div className="tooltip-value">{data?.optimistic} {t('sensitivity.dayShort')}</div>
      <div className="tooltip-label" style={{ marginTop: 4 }}>{t('sensitivity.tooltip.pessimistic')}</div>
      <div className="tooltip-value">{data?.pessimistic} {t('sensitivity.dayShort')}</div>
    </div>
  )
}

function RiskBadge({ level, t }) {
  const cls = { HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low' }[level] || 'badge-low'
  const label = {
    HIGH: t('sensitivity.level.high'),
    MEDIUM: t('sensitivity.level.medium'),
    LOW: t('sensitivity.level.low'),
  }[level] ?? t('sensitivity.level.low')

  return <span className={`risk-badge ${cls}`}>{label}</span>
}

function RiskCell({ label, value, className = '', align = 'left' }) {
  return (
    <span className={`risk-cell ${className}`.trim()} style={{ textAlign: align }}>
      <span className="risk-mobile-label">{label}</span>
      <span className="risk-cell-value">{value}</span>
    </span>
  )
}

export default function SensitivityTab({ activities, networkSummary, sensitivityData }) {
  const { t } = useLanguage()
  const sourceData = sensitivityData?.length ? sensitivityData : calcSensitivity(activities)

  if (sourceData.length === 0) return null

  const barColor = (level) => ({
    HIGH: '#ef4444',
    MEDIUM: '#b7791f',
    LOW: '#3b82f6',
  }[level] || '#3b82f6')

  return (
    <div className="sensitivity-section">
      <div className="insight-note">
        {t('sensitivity.note')}
      </div>

      <div className="section-card">
        <div className="card-heading-row compact">
          <div>
            <h3 className="card-title">{t('sensitivity.context.title')}</h3>
            <p className="card-copy">
              {t('sensitivity.context.copy')}
            </p>
          </div>
        </div>

        <div className="network-summary-grid">
          <div className="summary-highlight">
            <span className="summary-highlight-label">{t('sensitivity.context.path')}</span>
            <strong>{networkSummary?.criticalPath?.length ? networkSummary.criticalPath.join(' -> ') : t('sensitivity.context.pathEmpty')}</strong>
          </div>
          <div className="summary-highlight">
            <span className="summary-highlight-label">{t('sensitivity.context.near')}</span>
            <strong>{networkSummary?.nearCriticalPath?.length ? networkSummary.nearCriticalPath.join(', ') : t('sensitivity.context.nearEmpty')}</strong>
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <div className="chart-title">{t('sensitivity.chart.title')}</div>
            <div className="chart-subtitle">
              {t('sensitivity.chart.copy').replace('{count}', sourceData.length)}
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={Math.max(240, sourceData.length * 48)}>
          <BarChart
            layout="vertical"
            data={sourceData}
            margin={{ top: 10, right: 60, left: 140, bottom: 10 }}
            barSize={22}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5dece" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#55615a', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#d8d2c4' }}
              label={{
                value: t('sensitivity.chart.axis'),
                position: 'insideBottom',
                offset: -5,
                fill: '#55615a',
                fontSize: 11,
                fontFamily: 'IBM Plex Sans',
              }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#55615a', fontSize: 11, fontFamily: 'IBM Plex Sans' }}
              tickLine={false}
              axisLine={false}
              width={132}
            />
            <Tooltip content={<TornadoTooltip t={t} />} />
            <Bar dataKey="range" radius={[0, 6, 6, 0]}>
              {sourceData.map((entry, index) => (
                <Cell key={index} fill={barColor(entry.riskLevel)} fillOpacity={0.86} />
              ))}
              <LabelList
                dataKey="range"
                position="right"
                style={{ fill: '#55615a', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                formatter={value => `${value}${t('sensitivity.dayShort')}`}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="section-card">
        <div className="card-heading-row compact">
          <div>
            <h3 className="card-title">{t('sensitivity.table.title')}</h3>
            <p className="card-copy">
              {t('sensitivity.table.copy')}
            </p>
          </div>
        </div>

        <div className="risk-table">
          <div className="risk-row risk-header">
            <span className="risk-label">{t('sensitivity.table.no')}</span>
            <span className="risk-label">{t('sensitivity.table.activity')}</span>
            <span className="risk-label">{t('sensitivity.table.optimistic')}</span>
            <span className="risk-label">{t('sensitivity.table.mostLikely')}</span>
            <span className="risk-label">{t('sensitivity.table.pessimistic')}</span>
            <span className="risk-label" style={{ textAlign: 'center' }}>{t('sensitivity.table.level')}</span>
          </div>

          {sourceData.map((item, index) => (
            <div key={index} className="risk-row">
              <RiskCell
                label={t('sensitivity.table.no')}
                className="risk-value subtle-copy"
                value={index + 1}
              />
              <RiskCell
                label={t('sensitivity.table.activity')}
                className="risk-value"
                value={item.name}
              />
              <RiskCell
                label={t('sensitivity.table.optimistic')}
                className="risk-value metric-mono risk-value-opt"
                value={`${item.optimistic}${t('sensitivity.dayShort')}`}
              />
              <RiskCell
                label={t('sensitivity.table.mostLikely')}
                className="risk-value metric-mono"
                value={`${item.mostLikely}${t('sensitivity.dayShort')}`}
              />
              <RiskCell
                label={t('sensitivity.table.pessimistic')}
                className="risk-value metric-mono risk-value-pes"
                value={`${item.pessimistic}${t('sensitivity.dayShort')}`}
              />
              <RiskCell
                label={t('sensitivity.table.level')}
                className="risk-value"
                align="center"
                value={
                  <span className="risk-level-stack">
                    <RiskBadge level={item.riskLevel} t={t} />
                    {!item.mitigationReady && item.riskLevel === 'HIGH' && (
                      <span className="subtle-copy">{t('sensitivity.table.noMitigation')}</span>
                    )}
                  </span>
                }
              />
            </div>
          ))}
        </div>
      </div>

      {sourceData.some(item => item.riskLevel === 'HIGH') && (
        <div className="mitigation-card">
          <div className="mitigation-kicker">{t('sensitivity.mitigation.kicker')}</div>
          <div className="mitigation-copy">
            {t('sensitivity.mitigation.copy')}
          </div>
          <ul className="mitigation-list">
            {sourceData
              .filter(item => item.riskLevel === 'HIGH')
              .map((item, index) => (
                <li key={index}>
                  <strong>{item.name}</strong>
                  <span className="subtle-copy">
                    {t('sensitivity.mitigation.item')
                      .replace('{range}', item.range)
                      .replace('{status}', item.mitigationReady ? t('sensitivity.mitigation.available') : t('sensitivity.mitigation.missing'))}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}
