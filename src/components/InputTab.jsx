import React, { useCallback, useMemo, useRef, useState } from 'react'
import { PROJECT_TEMPLATES } from '../utils/templates'
import Icon from './Icon'
import { useLanguage } from '../contexts/LanguageContext'

export default function InputTab({
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
  const { t } = useLanguage()
  const fileInputRef = useRef(null)
  const [inspectorView, setInspectorView] = useState('summary')
  const selectedActivity = useMemo(
    () => activities.find(activity => activity.id === selectedActivityId) ?? activities[0] ?? null,
    [activities, selectedActivityId]
  )
  const mitigationStatusOptions = useMemo(() => ([
    { value: 'not_started', label: t('input.activity.status.not_started') },
    { value: 'in_progress', label: t('input.activity.status.in_progress') },
    { value: 'done', label: t('input.activity.status.done') },
  ]), [t])

  const getDependencyLinks = useCallback((activity) => {
    if (Array.isArray(activity?.dependencyLinks) && activity.dependencyLinks.length > 0) {
      return activity.dependencyLinks
    }

    if (Array.isArray(activity?.predecessorIds)) {
      return activity.predecessorIds.map(predecessorId => ({
        predecessorId,
        dependencyType: activity.dependencyType ?? 'FS',
        lag: activity.lag ?? '0',
      }))
    }

    return activity?.predecessorId
      ? [{
          predecessorId: activity.predecessorId,
          dependencyType: activity.dependencyType ?? 'FS',
          lag: activity.lag ?? '0',
        }]
      : []
  }, [])

  const updateActivity = useCallback((activityId, updater) => {
    onActivitiesChange(activities.map(activity => (
      activity.id === activityId ? updater(activity) : activity
    )))
  }, [activities, onActivitiesChange])

  const handleCellChange = useCallback((activityId, field, value) => {
    if (
      !['name', 'actualStart', 'mitigationNote', 'mitigationAction', 'mitigationOwner', 'mitigationDueDate', 'dependencyType', 'mitigationStatus', 'predecessorId', 'predecessorIds', 'dependencyLinks'].includes(field) &&
      value !== '' &&
      !Array.isArray(value) &&
      Number.isNaN(Number(value))
    ) {
      return
    }

    updateActivity(activityId, activity => {
      const next = { ...activity, [field]: value }

      if (field === 'predecessorIds') {
        next.predecessorId = value[0] ?? ''
        next.dependencyLinks = value.map(predecessorId => ({
          predecessorId,
          dependencyType: activity.dependencyType ?? 'FS',
          lag: activity.lag ?? '0',
        }))
      }

      if (field === 'dependencyLinks') {
        next.predecessorIds = value.map(link => link.predecessorId)
        next.predecessorId = value[0]?.predecessorId ?? ''
        next.dependencyType = value[0]?.dependencyType ?? activity.dependencyType ?? 'FS'
        next.lag = value[0]?.lag ?? activity.lag ?? '0'
      }

      return next
    })
  }, [updateActivity])

  const handleAddRow = useCallback(() => {
    const lastActivity = activities[activities.length - 1]
    const newActivity = {
      id: `act-${Date.now()}`,
      name: '',
      optimistic: '',
      mostLikely: '',
      pessimistic: '',
      predecessorId: lastActivity?.id ?? '',
      predecessorIds: lastActivity?.id ? [lastActivity.id] : [],
      dependencyLinks: lastActivity?.id ? [{
        predecessorId: lastActivity.id,
        dependencyType: 'FS',
        lag: '0',
      }] : [],
      dependencyType: 'FS',
      lag: '0',
      progressPercent: '0',
      remainingDuration: '',
      actualStart: '',
      mitigationNote: '',
      mitigationAction: '',
      mitigationOwner: '',
      mitigationDueDate: '',
      mitigationStatus: 'not_started',
    }

    onActivitiesChange([...activities, newActivity])
    onSelectedActivityChange(newActivity.id)
  }, [activities, onActivitiesChange, onSelectedActivityChange])

  const handleDeleteRow = useCallback((activityId) => {
    if (activities.length === 1) return

    const updated = activities
      .filter(activity => activity.id !== activityId)
      .map(activity => {
        const links = getDependencyLinks(activity).filter(link => link.predecessorId !== activityId)
        return {
          ...activity,
          dependencyLinks: links,
          predecessorIds: links.map(link => link.predecessorId),
          predecessorId: links[0]?.predecessorId ?? '',
        }
      })

    onActivitiesChange(updated)
    if (selectedActivityId === activityId) {
      onSelectedActivityChange(updated[0]?.id ?? null)
    }
  }, [activities, getDependencyLinks, onActivitiesChange, onSelectedActivityChange, selectedActivityId])

  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    await onImportCSV(file)
    event.target.value = ''
  }, [onImportCSV])

  const updateSelectedLinks = useCallback((linkIndex, field, value) => {
    if (!selectedActivity) return

    const links = getDependencyLinks(selectedActivity).map((link, index) => (
      index === linkIndex ? { ...link, [field]: value } : link
    ))

    handleCellChange(selectedActivity.id, 'dependencyLinks', links)
  }, [getDependencyLinks, handleCellChange, selectedActivity])

  const addDependencyLink = useCallback(() => {
    if (!selectedActivity) return

    const candidates = activities.filter(activity => activity.id !== selectedActivity.id)
    const currentLinks = getDependencyLinks(selectedActivity)
    const nextOption = candidates.find(option => !currentLinks.some(link => link.predecessorId === option.id))
    if (!nextOption) return

    handleCellChange(selectedActivity.id, 'dependencyLinks', [
      ...currentLinks,
      { predecessorId: nextOption.id, dependencyType: 'FS', lag: '0' },
    ])
  }, [activities, getDependencyLinks, handleCellChange, selectedActivity])

  const removeDependencyLink = useCallback((linkIndex) => {
    if (!selectedActivity) return
    handleCellChange(
      selectedActivity.id,
      'dependencyLinks',
      getDependencyLinks(selectedActivity).filter((_, index) => index !== linkIndex)
    )
  }, [getDependencyLinks, handleCellChange, selectedActivity])

  return (
    <div className="input-stack">
      <div className="section-card">
        <div className="card-heading-row">
          <div className="card-brand-group">
            <Icon name="input" size={24} className="card-brand-icon" />
            <div>
              <h3 className="card-title">{t('input.acceleration.title')}</h3>
              <p className="card-copy">{t('input.acceleration.copy')}</p>
            </div>
          </div>

          <div className="workspace-actions wrap">
            {PROJECT_TEMPLATES.map(template => (
              <button key={template.id} type="button" className="btn-export" onClick={() => onApplyPreset(template.id)}>
                {template.label}
              </button>
            ))}
            <button type="button" className="btn-add-row" onClick={() => fileInputRef.current?.click()}>
              <Icon name="plus" size={14} />
              <span>{t('input.acceleration.import')}</span>
            </button>
            <button type="button" className="btn-export" onClick={onDownloadTemplate}>
              <Icon name="copy" size={14} />
              <span>{t('input.acceleration.template')}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              aria-label={t('input.acceleration.importAria')}
              title={t('input.acceleration.importAria')}
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>

      <div className="input-layout">
        <div className="input-main">
          {diagnostics.invalidCount > 0 && (
            <div className="inline-warning" role="status" aria-live="polite">
              <div className="inline-warning-title">{t('input.warning.title')}</div>
              <p className="inline-warning-copy">{t('input.warning.copy').replace('{count}', diagnostics.invalidCount)}</p>
              <ul className="warning-list">
                {diagnostics.invalidRows.map(row => (
                  <li key={row.index}>
                    <span className="metric-mono">{t('input.warning.row').replace('{index}', row.index)}</span>
                    <span>{row.name}</span>
                    <span className="warning-list-reason">{row.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="section-card">
            <div className="card-heading-row">
              <div className="card-brand-group">
                <Icon name="activity" size={24} className="card-brand-icon" />
                <div>
                  <h3 className="card-title">{t('input.table.title')}</h3>
                  <p className="card-copy">{t('input.table.copy')}</p>
                </div>
              </div>

              <div className="color-legend" aria-label={t('input.table.legendAria')}>
                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--blue)' }} />{t('input.table.optimistic')}</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--border-strong)' }} />{t('input.table.mostLikely')}</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--red)' }} />{t('input.table.pessimistic')}</span>
              </div>
            </div>

            <div className="activity-table-wrapper">
              <table className="activity-table">
                <thead>
                  <tr>
                    <th className="th-num">{t('input.table.no')}</th>
                    <th className="th-name">{t('input.table.activity')}</th>
                    <th className="th-opt">{t('input.table.optimisticCol')}</th>
                    <th className="th-ml">{t('input.table.mostLikelyCol')}</th>
                    <th className="th-pes">{t('input.table.pessimisticCol')}</th>
                    <th className="th-range">{t('input.table.range')}</th>
                    <th className="th-del">{t('input.table.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity, index) => {
                    const row = diagnostics.rows[index]
                    const rowNumber = index + 1
                    const hasIssue = Boolean(row?.reason)

                    return (
                      <tr
                        key={activity.id}
                        className={`${hasIssue ? 'activity-row is-invalid' : 'activity-row'} ${selectedActivity?.id === activity.id ? 'is-selected' : ''}`}
                        onClick={() => onSelectedActivityChange(activity.id)}
                      >
                        <td className="td-num">{rowNumber}</td>
                        <td className="td-name">
                          <label className="sr-only" htmlFor={`activity-name-${activity.id}`}>{t('input.table.activityAria').replace('{index}', rowNumber)}</label>
                          <textarea
                            id={`activity-name-${activity.id}`}
                            rows="1"
                            value={activity.name}
                            placeholder={t('input.table.activityPlaceholder')}
                            aria-label={t('input.table.activityAria').replace('{index}', rowNumber)}
                            onChange={event => handleCellChange(activity.id, 'name', event.target.value)}
                          />
                          {hasIssue && <span className="cell-hint cell-hint-error">{row.reason}</span>}
                        </td>
                        <td className="td-input opt">
                          <label className="sr-only" htmlFor={`activity-opt-${activity.id}`}>{t('input.table.optimisticAria').replace('{index}', rowNumber)}</label>
                          <input
                            id={`activity-opt-${activity.id}`}
                            type="number"
                            value={activity.optimistic}
                            placeholder="0"
                            aria-label={t('input.table.optimisticAria').replace('{index}', rowNumber)}
                            aria-invalid={hasIssue ? 'true' : undefined}
                            onChange={event => handleCellChange(activity.id, 'optimistic', event.target.value)}
                          />
                        </td>
                        <td className="td-input">
                          <label className="sr-only" htmlFor={`activity-ml-${activity.id}`}>{t('input.table.mostLikelyAria').replace('{index}', rowNumber)}</label>
                          <input
                            id={`activity-ml-${activity.id}`}
                            type="number"
                            value={activity.mostLikely}
                            placeholder="0"
                            aria-label={t('input.table.mostLikelyAria').replace('{index}', rowNumber)}
                            aria-invalid={hasIssue ? 'true' : undefined}
                            onChange={event => handleCellChange(activity.id, 'mostLikely', event.target.value)}
                          />
                        </td>
                        <td className="td-input pes">
                          <label className="sr-only" htmlFor={`activity-pes-${activity.id}`}>{t('input.table.pessimisticAria').replace('{index}', rowNumber)}</label>
                          <input
                            id={`activity-pes-${activity.id}`}
                            type="number"
                            value={activity.pessimistic}
                            placeholder="0"
                            aria-label={t('input.table.pessimisticAria').replace('{index}', rowNumber)}
                            aria-invalid={hasIssue ? 'true' : undefined}
                            onChange={event => handleCellChange(activity.id, 'pessimistic', event.target.value)}
                          />
                        </td>
                        <td className="td-range">
                          <span className={`range-badge ${hasIssue ? 'is-warning' : ''}`}>
                            {row?.range !== null && row?.range !== undefined ? `${row.range.toFixed(1)} ${t('input.table.dayUnit')}` : '--'}
                          </span>
                        </td>
                        <td className="td-del">
                          <button
                            type="button"
                            className="btn-delete compact"
                            disabled={activities.length === 1}
                            aria-label={t('input.table.deleteAria').replace('{index}', rowNumber)}
                            onClick={(event) => {
                              event.stopPropagation()
                              handleDeleteRow(activity.id)
                            }}
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="input-actions">
              <button type="button" className="btn-add-row pulse" onClick={handleAddRow}>
                <Icon name="plus" size={16} />
                <span>{t('input.table.add')}</span>
              </button>
              <div className="input-note">{t('input.table.note')}</div>
            </div>
          </div>
        </div>

        <div className="summary-rail">
          <div className="summary-panel inspector-panel">
            <div className="inspector-panel-head">
              <div>
                <p className="summary-eyebrow">{t('input.inspector.eyebrow')}</p>
                <h3 className="summary-title">{t('input.inspector.title')}</h3>
              </div>
              <div className="inspector-tabs" role="tablist" aria-label={t('input.inspector.aria')}>
                <button type="button" role="tab" className={`inspector-tab ${inspectorView === 'summary' ? 'is-active' : ''}`} aria-selected={inspectorView === 'summary'} onClick={() => setInspectorView('summary')}>{t('input.inspector.summary')}</button>
                <button type="button" role="tab" className={`inspector-tab ${inspectorView === 'checks' ? 'is-active' : ''}`} aria-selected={inspectorView === 'checks'} onClick={() => setInspectorView('checks')}>{t('input.inspector.checks')}</button>
                <button type="button" role="tab" className={`inspector-tab ${inspectorView === 'activity' ? 'is-active' : ''}`} aria-selected={inspectorView === 'activity'} onClick={() => setInspectorView('activity')}>{t('input.inspector.activity')}</button>
              </div>
            </div>

            {inspectorView === 'summary' && (
              <>
                <p className="summary-copy">{t('input.summary.copy')}</p>
                <div className="summary-grid">
                  <div className="summary-stat"><span className="summary-stat-label">{t('input.summary.named')}</span><strong className="summary-stat-value metric-mono">{diagnostics.activityCount}</strong></div>
                  <div className="summary-stat"><span className="summary-stat-label">{t('input.summary.valid')}</span><strong className="summary-stat-value metric-mono">{diagnostics.validCount}</strong></div>
                  <div className="summary-stat"><span className="summary-stat-label">{t('input.summary.review')}</span><strong className="summary-stat-value metric-mono">{diagnostics.invalidCount}</strong></div>
                  <div className="summary-stat"><span className="summary-stat-label">{t('input.summary.total')}</span><strong className="summary-stat-value metric-mono">{diagnostics.totalMostLikely} {t('input.table.dayUnit')}</strong></div>
                  <div className="summary-stat"><span className="summary-stat-label">{t('input.summary.range')}</span><strong className="summary-stat-value metric-mono">{diagnostics.largestRange ? `${diagnostics.largestRange.toFixed(1)} ${t('input.table.dayUnit')}` : '--'}</strong></div>
                  <div className="summary-stat"><span className="summary-stat-label">{t('input.summary.iterations')}</span><strong className="summary-stat-value metric-mono">{iterations.toLocaleString()}</strong></div>
                </div>
                <div className="summary-highlight">
                  <span className="summary-highlight-label">{t('input.summary.highlight')}</span>
                  <strong>{diagnostics.largestRangeName || t('input.summary.highlightEmpty')}</strong>
                </div>
              </>
            )}

            {inspectorView === 'checks' && (
              <div className="validation-stack">
                {diagnostics.issues.length === 0 ? (
                  <div className="validation-item is-success">
                    <strong>{t('input.checks.emptyTitle')}</strong>
                    <span className="subtle-copy">{t('input.checks.emptyCopy')}</span>
                  </div>
                ) : diagnostics.issues.slice(0, 8).map(issue => (
                  <div key={issue.id} className={`validation-item severity-${issue.severity}`}>
                    <strong>{issue.title}</strong>
                    <div className="validation-actions">
                      <button type="button" className="btn-export" onClick={() => { setInspectorView('activity'); onJumpToIssue(issue.rowId) }}>{t('input.checks.jump')}</button>
                      {issue.canAutoFix && <button type="button" className="btn-add-row" onClick={() => onAutoFixIssue(issue)}>{t('input.checks.autofix')}</button>}
                      <button type="button" className="btn-delete" onClick={() => onDismissIssue(issue.id)}>{t('input.checks.dismiss')}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {inspectorView === 'activity' && selectedActivity && (
              <>
                <p className="summary-eyebrow">{t('input.activity.eyebrow')}</p>
                <h3 className="summary-title">{selectedActivity.name || t('input.activity.new')}</h3>
                <p className="summary-copy">{t('input.activity.copy')}</p>

                <div className="detail-stack">
                  <div className="control-field">
                    <span className="control-label">{t('input.activity.links')}</span>
                    <div className="dependency-link-stack">
                      {getDependencyLinks(selectedActivity).length === 0 ? (
                        <div className="validation-item severity-low">
                          <strong>{t('input.activity.linksEmptyTitle')}</strong>
                          <span className="subtle-copy">{t('input.activity.linksEmptyCopy')}</span>
                        </div>
                      ) : getDependencyLinks(selectedActivity).map((link, index) => (
                        <div key={`${selectedActivity.id}-${index}`} className="dependency-link-row">
                          <label className="control-field" htmlFor={`dependency-predecessor-${index}`}>
                            <span className="control-label">{t('input.activity.predecessor')}</span>
                            <select id={`dependency-predecessor-${index}`} className="iter-select" value={link.predecessorId} onChange={event => updateSelectedLinks(index, 'predecessorId', event.target.value)}>
                              <option value="">{t('input.activity.predecessorPlaceholder')}</option>
                              {activities.filter(activity => activity.id !== selectedActivity.id).map(activity => (
                                <option key={activity.id} value={activity.id}>{activity.name || t('input.activity.unnamed')}</option>
                              ))}
                            </select>
                          </label>
                          <label className="control-field" htmlFor={`dependency-type-${index}`}>
                            <span className="control-label">{t('input.activity.relation')}</span>
                            <select id={`dependency-type-${index}`} className="iter-select" value={link.dependencyType} onChange={event => updateSelectedLinks(index, 'dependencyType', event.target.value)}>
                              <option value="FS">{t('input.activity.relationFs')}</option>
                              <option value="SS">{t('input.activity.relationSs')}</option>
                            </select>
                          </label>
                          <label className="control-field" htmlFor={`dependency-lag-${index}`}>
                            <span className="control-label">{t('input.activity.lag')}</span>
                            <input id={`dependency-lag-${index}`} type="number" step="any" value={link.lag} onChange={event => updateSelectedLinks(index, 'lag', event.target.value)} />
                          </label>
                          <button type="button" className="btn-delete" aria-label={t('input.activity.deleteLinkAria').replace('{index}', index + 1)} onClick={() => removeDependencyLink(index)}>
                            {t('input.activity.deleteLink')}
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="workspace-actions compact">
                      <button type="button" className="btn-export" onClick={addDependencyLink}>{t('input.activity.addLink')}</button>
                    </div>
                    <span className="subtle-copy">{t('input.activity.linksHelp')}</span>
                  </div>

                  <div className="workspace-calendar-grid">
                    <label className="control-field" htmlFor="activity-progress"><span className="control-label">{t('input.activity.progress')}</span><input id="activity-progress" type="number" min="0" max="100" value={selectedActivity.progressPercent} onChange={event => handleCellChange(selectedActivity.id, 'progressPercent', event.target.value)} /></label>
                    <label className="control-field" htmlFor="activity-remaining"><span className="control-label">{t('input.activity.remaining')}</span><input id="activity-remaining" type="number" min="0" step="any" value={selectedActivity.remainingDuration} onChange={event => handleCellChange(selectedActivity.id, 'remainingDuration', event.target.value)} /></label>
                  </div>

                  <label className="control-field" htmlFor="activity-action">
                    <span className="control-label">{t('input.activity.mitigationAction')}</span>
                    <textarea id="activity-action" className="workspace-textarea" value={selectedActivity.mitigationAction} onChange={event => handleCellChange(selectedActivity.id, 'mitigationAction', event.target.value)} placeholder={t('input.activity.mitigationActionPlaceholder')} />
                  </label>

                  <div className="workspace-calendar-grid">
                    <label className="control-field" htmlFor="activity-owner"><span className="control-label">{t('input.activity.owner')}</span><input id="activity-owner" type="text" value={selectedActivity.mitigationOwner} onChange={event => handleCellChange(selectedActivity.id, 'mitigationOwner', event.target.value)} placeholder={t('input.activity.ownerPlaceholder')} /></label>
                    <label className="control-field" htmlFor="activity-status">
                      <span className="control-label">{t('input.activity.status')}</span>
                      <select id="activity-status" className="iter-select" value={selectedActivity.mitigationStatus} onChange={event => handleCellChange(selectedActivity.id, 'mitigationStatus', event.target.value)}>
                        {mitigationStatusOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="control-field" htmlFor="activity-note">
                    <span className="control-label">{t('input.activity.note')}</span>
                    <textarea id="activity-note" className="workspace-textarea" value={selectedActivity.mitigationNote} onChange={event => handleCellChange(selectedActivity.id, 'mitigationNote', event.target.value)} placeholder={t('input.activity.notePlaceholder')} />
                  </label>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
