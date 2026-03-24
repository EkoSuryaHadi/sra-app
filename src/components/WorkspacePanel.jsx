import React from 'react'
import Icon from './Icon'
import { useLanguage } from '../contexts/LanguageContext'

function ScenarioButton({ scenario, isActive, onSelect }) {
  return (
    <button
      type="button"
      className={`scenario-pill ${isActive ? 'is-active' : ''}`}
      onClick={() => onSelect(scenario.id)}
    >
      {scenario.name}
    </button>
  )
}

export default function WorkspacePanel({
  projects,
  currentProject,
  currentScenario,
  onSelectProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject,
  onRenameProject,
  onCreateScenario,
  onDuplicateScenario,
  onDeleteScenario,
  onSelectScenario,
  onRenameScenario,
  onProjectNotesChange,
  onCalendarChange,
}) {
  const { t } = useLanguage()

  return (
    <section className="section-card workspace-panel">
      <div className="workspace-header">
        <div className="card-brand-group">
          <Icon name="folder" size={24} className="card-brand-icon" />
          <div>
            <h2 className="card-title">{t('workspace.title')}</h2>
            <p className="card-copy">
              {t('workspace.copy')}
            </p>
          </div>
        </div>

        <div className="workspace-actions">
          <button type="button" className="btn-add-row" onClick={onCreateProject}>
            <Icon name="plus" size={14} />
            <span>{t('workspace.project.new')}</span>
          </button>
          <button type="button" className="btn-export" onClick={onDuplicateProject}>
            <Icon name="copy" size={14} />
            <span>{t('workspace.project.copy')}</span>
          </button>
          <button type="button" className="btn-delete workspace-delete" onClick={onDeleteProject} aria-label={t('workspace.project.delete')}>
            <Icon name="trash" size={14} />
          </button>
        </div>
      </div>

      <div className="workspace-grid">
        <div className="workspace-column">
          <label className="control-field" htmlFor="project-select">
            <span className="control-label">{t('workspace.project.active')}</span>
            <select
              id="project-select"
              className="iter-select"
              value={currentProject.id}
              onChange={event => onSelectProject(event.target.value)}
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="control-field" htmlFor="project-name">
            <span className="control-label">{t('workspace.project.name')}</span>
            <input
              id="project-name"
              type="text"
              value={currentProject.name}
              onChange={event => onRenameProject(event.target.value)}
              placeholder={t('workspace.project.namePlaceholder')}
            />
          </label>

          <label className="control-field" htmlFor="project-notes">
            <span className="control-label">{t('workspace.project.notes')}</span>
            <textarea
              id="project-notes"
              className="workspace-textarea"
              value={currentProject.notes}
              onChange={event => onProjectNotesChange(event.target.value)}
              placeholder={t('workspace.project.notesPlaceholder')}
            />
          </label>
        </div>

        <div className="workspace-column">
          <div className="workspace-scenarios">
            <div className="workspace-scenario-header">
              <div className="card-brand-group">
                <Icon name="layers" size={20} className="card-brand-icon" />
                <div>
                  <div className="control-label">{t('workspace.scenario.active')}</div>
                  <div className="subtle-copy">{t('workspace.scenario.copy')}</div>
                </div>
              </div>
              <div className="workspace-actions compact">
                <button type="button" className="btn-add-row" onClick={onCreateScenario} title={t('workspace.scenario.new')}>
                  <Icon name="plus" size={14} />
                </button>
                <button type="button" className="btn-export" onClick={onDuplicateScenario} title={t('workspace.project.copy')}>
                  <Icon name="copy" size={14} />
                </button>
                <button type="button" className="btn-delete workspace-delete" onClick={onDeleteScenario} title={t('workspace.scenario.delete')}>
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>

            <div className="scenario-pill-group">
              {currentProject.scenarios.map(scenario => (
                <ScenarioButton
                  key={scenario.id}
                  scenario={scenario}
                  isActive={currentScenario.id === scenario.id}
                  onSelect={onSelectScenario}
                />
              ))}
            </div>

            <label className="control-field" htmlFor="scenario-name">
              <span className="control-label">{t('workspace.scenario.name')}</span>
              <input
                id="scenario-name"
                type="text"
                value={currentScenario.name}
                onChange={event => onRenameScenario(event.target.value)}
                placeholder={t('workspace.scenario.namePlaceholder')}
              />
            </label>
          </div>

          <div className="workspace-calendar">
            <div className="workspace-scenario-header">
              <div>
                <div className="control-label">{t('workspace.calendar.title')}</div>
                <div className="subtle-copy">{t('workspace.calendar.copy')}</div>
              </div>
            </div>

            <div className="workspace-calendar-grid">
              <label className="control-field" htmlFor="project-start-date">
                <span className="control-label">{t('workspace.calendar.startDate')}</span>
                <input
                  id="project-start-date"
                  type="date"
                  value={currentProject.calendarConfig.projectStartDate}
                  onChange={event => onCalendarChange('projectStartDate', event.target.value)}
                />
              </label>

              <label className="control-field" htmlFor="analysis-mode">
                <span className="control-label">{t('workspace.calendar.analysisMode')}</span>
                <select
                  id="analysis-mode"
                  className="iter-select"
                  value={currentProject.calendarConfig.analysisMode}
                  onChange={event => onCalendarChange('analysisMode', event.target.value)}
                >
                  <option value="plan">{t('workspace.calendar.analysis.plan')}</option>
                  <option value="remaining">{t('workspace.calendar.analysis.remaining')}</option>
                </select>
              </label>

              <label className="control-field" htmlFor="workweek-days">
                <span className="control-label">{t('workspace.calendar.workweek')}</span>
                <select
                  id="workweek-days"
                  className="iter-select"
                  value={currentProject.calendarConfig.workweekDays}
                  onChange={event => onCalendarChange('workweekDays', Number(event.target.value))}
                >
                  <option value={7}>{t('workspace.calendar.workweek7')}</option>
                  <option value={6}>{t('workspace.calendar.workweek6')}</option>
                  <option value={5}>{t('workspace.calendar.workweek5')}</option>
                </select>
              </label>
            </div>

            <label className="control-field" htmlFor="holiday-dates">
              <span className="control-label">{t('workspace.calendar.holidayDates')}</span>
              <textarea
                id="holiday-dates"
                className="workspace-textarea"
                value={currentProject.calendarConfig.holidayDates}
                onChange={event => onCalendarChange('holidayDates', event.target.value)}
                placeholder={`2026-03-31\n2026-04-01`}
              />
              <span className="subtle-copy">
                {t('workspace.calendar.holidayDatesHelp')}
              </span>
            </label>

            <label className="control-field" htmlFor="holiday-overrides">
              <span className="control-label">{t('workspace.calendar.holidayOverrides')}</span>
              <textarea
                id="holiday-overrides"
                className="workspace-textarea"
                value={currentProject.calendarConfig.holidayOverrides}
                onChange={event => onCalendarChange('holidayOverrides', event.target.value)}
                placeholder={`Libur Lebaran 1\nLibur Lebaran 2`}
              />
              <span className="subtle-copy">
                {t('workspace.calendar.holidayOverridesHelp')}
              </span>
            </label>
          </div>
        </div>
      </div>
    </section>
  )
}
