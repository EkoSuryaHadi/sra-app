import React from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function riskColor(ratio) {
  if (ratio < 0.5) {
    const t = ratio * 2
    const r = Math.round(59 + t * (245 - 59))
    const g = Math.round(130 + t * (158 - 130))
    const b = Math.round(246 + t * (11 - 246))
    return `rgb(${r},${g},${b})`
  }

  const t = (ratio - 0.5) * 2
  const r = Math.round(245 + t * (239 - 245))
  const g = Math.round(158 + t * (68 - 158))
  const b = Math.round(11 + t * (68 - 11))
  return `rgb(${r},${g},${b})`
}

const HistTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <div className="tooltip-label">Durasi</div>
      <div className="tooltip-value">{payload[0]?.payload?.x?.toFixed(1)} hari</div>
      <div className="tooltip-label" style={{ marginTop: 4 }}>Frekuensi</div>
      <div className="tooltip-value">{payload[0]?.value?.toLocaleString()} iterasi</div>
    </div>
  )
}

const SCurveTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <div className="tooltip-label">Durasi</div>
      <div className="tooltip-value">{payload[0]?.payload?.x?.toFixed(1)} hari</div>
      <div className="tooltip-label" style={{ marginTop: 4 }}>Probabilitas selesai</div>
      <div className="tooltip-value">{payload[0]?.value?.toFixed(1)}%</div>
    </div>
  )
}

export default function ChartsTab({ simResult }) {
  if (!simResult) return null

  const { histData, sCurveData, statistics } = simResult
  const { p50, p80, p90 } = statistics

  const nearestPoint = (target) => histData.reduce((closest, point) =>
    Math.abs(point.x - target) < Math.abs(closest.x - target) ? point : closest
  )

  return (
    <div className="insights-charts-grid">
      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <div className="chart-title">Distribusi durasi</div>
            <div className="chart-subtitle">
              {histData.length} bin histogram untuk hasil simulasi Monte Carlo.
            </div>
          </div>
          <div className="chart-legend">
            <span className="legend-pill">
              <span className="legend-line" style={{ borderColor: '#b7791f' }} />
              P50
            </span>
            <span className="legend-pill">
              <span className="legend-line" style={{ borderColor: '#f97316' }} />
              P80
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={histData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }} barCategoryGap={1}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5dece" vertical={false} />
            <XAxis
              dataKey="x"
              tick={{ fill: '#55615a', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#d8d2c4' }}
              tickFormatter={value => value.toFixed(0)}
              label={{
                value: 'Durasi (hari)',
                position: 'insideBottom',
                offset: -5,
                fill: '#55615a',
                fontSize: 11,
                fontFamily: 'IBM Plex Sans',
              }}
            />
            <YAxis
              tick={{ fill: '#55615a', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              tickLine={false}
              axisLine={false}
              label={{
                value: 'Frekuensi',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                fill: '#55615a',
                fontSize: 11,
                fontFamily: 'IBM Plex Sans',
              }}
            />
            <Tooltip content={<HistTooltip />} />

            <ReferenceLine
              x={nearestPoint(p50).x}
              stroke="#b7791f"
              strokeDasharray="6 3"
              strokeWidth={2}
              label={{
                value: `P50: ${p50}`,
                position: 'top',
                fill: '#b7791f',
                fontSize: 10,
                fontFamily: 'IBM Plex Mono',
              }}
            />
            <ReferenceLine
              x={nearestPoint(p80).x}
              stroke="#f97316"
              strokeDasharray="6 3"
              strokeWidth={2}
              label={{
                value: `P80: ${p80}`,
                position: 'top',
                fill: '#f97316',
                fontSize: 10,
                fontFamily: 'IBM Plex Mono',
              }}
            />

            <Bar dataKey="frequency" radius={[4, 4, 0, 0]}>
              {histData.map((entry, index) => (
                <Cell key={index} fill={riskColor(entry.risk)} fillOpacity={0.82} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="risk-scale">
          <span className="subtle-copy">Risiko rendah</span>
          <div className="risk-scale-bar" />
          <span className="subtle-copy">Risiko tinggi</span>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <div className="chart-title">S-curve probabilitas kumulatif</div>
            <div className="chart-subtitle">
              CDF hasil {simResult.iterations.toLocaleString()} iterasi.
            </div>
          </div>
          <div className="chart-legend">
            <span className="legend-pill">
              <span className="legend-line" style={{ borderColor: '#b7791f' }} />
              P50
            </span>
            <span className="legend-pill">
              <span className="legend-line" style={{ borderColor: '#f97316' }} />
              P80
            </span>
            <span className="legend-pill">
              <span className="legend-line" style={{ borderColor: '#ef4444' }} />
              P90
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={sCurveData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="sCurveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#b7791f" stopOpacity={0.26} />
                <stop offset="95%" stopColor="#b7791f" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5dece" />
            <XAxis
              dataKey="x"
              tick={{ fill: '#55615a', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#d8d2c4' }}
              tickFormatter={value => value.toFixed(0)}
              label={{
                value: 'Durasi (hari)',
                position: 'insideBottom',
                offset: -10,
                fill: '#55615a',
                fontSize: 11,
                fontFamily: 'IBM Plex Sans',
              }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#55615a', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={value => `${value}%`}
              label={{
                value: 'Probabilitas (%)',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                fill: '#55615a',
                fontSize: 11,
                fontFamily: 'IBM Plex Sans',
              }}
            />
            <Tooltip content={<SCurveTooltip />} />

            <ReferenceLine
              y={50}
              stroke="#b7791f"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: `P50 = ${p50}d`,
                position: 'right',
                fill: '#b7791f',
                fontSize: 10,
                fontFamily: 'IBM Plex Mono',
              }}
            />
            <ReferenceLine
              y={80}
              stroke="#f97316"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: `P80 = ${p80}d`,
                position: 'right',
                fill: '#f97316',
                fontSize: 10,
                fontFamily: 'IBM Plex Mono',
              }}
            />
            <ReferenceLine
              y={90}
              stroke="#ef4444"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: `P90 = ${p90}d`,
                position: 'right',
                fill: '#ef4444',
                fontSize: 10,
                fontFamily: 'IBM Plex Mono',
              }}
            />

            <Area
              type="monotone"
              dataKey="probability"
              stroke="#b7791f"
              strokeWidth={2.5}
              fill="url(#sCurveGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#b7791f', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
