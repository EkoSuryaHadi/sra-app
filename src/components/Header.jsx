import React from 'react'
import Icon from './Icon'
import { useLanguage } from '../contexts/LanguageContext'

export default function Header({
  currentSection,
  invalidCount,
  activityCount,
  iterations,
  isRunning,
  hasResults,
  onSectionChange,
  onRun,
}) {
  const { t, language, setLanguage } = useLanguage()

  const STEPS = [
    { id: 'input', label: t('header.step.input'), index: '1', description: t('header.step.inputDesc'), icon: 'input' },
    { id: 'run', label: t('header.step.run'), index: '2', description: t('header.step.runDesc'), icon: 'play' },
    { id: 'results', label: t('header.step.results'), index: '3', description: t('header.step.resultsDesc'), icon: 'results' },
    { id: 'insights', label: t('header.step.insights'), index: '4', description: t('header.step.insightsDesc'), icon: 'insights' },
  ]

  return (
    <header className="header">
      <div className="header-shell">
        <div className="header-top header-top-compact">
          <div className="header-brand">
            <p className="header-eyebrow">{t('header.eyebrow')}</p>
            <h1 className="header-title">{t('header.title')}</h1>
            <p className="header-copy">
              {t('header.copy')}
            </p>
          </div>

          <div className="header-panel">
            <div className="header-metrics" aria-live="polite">
              <span className="metric-pill">
                <div className="metric-pill-head">
                  <Icon name="activity" size={14} className="metric-icon" />
                  <span className="metric-pill-label">{t('header.metrics.activity')}</span>
                </div>
                <span className="metric-pill-value metric-mono">{activityCount}</span>
              </span>
              <span className={`metric-pill ${invalidCount > 0 ? 'is-warning' : ''}`}>
                <div className="metric-pill-head">
                  <Icon name="alert" size={14} className="metric-icon" />
                  <span className="metric-pill-label">{t('header.metrics.review')}</span>
                </div>
                <span className="metric-pill-value metric-mono">{invalidCount}</span>
              </span>
              <span className="metric-pill">
                <div className="metric-pill-head">
                  <Icon name="iteration" size={14} className="metric-icon" />
                  <span className="metric-pill-label">{t('header.metrics.iteration')}</span>
                </div>
                <span className="metric-pill-value metric-mono">{iterations.toLocaleString()}</span>
              </span>
            </div>

            <div className="header-controls">
              <div className="control-field language-control">
                <span className="control-label">{t('header.controls.languageLabel')}</span>
                <div className="language-switcher" role="group" aria-label={t('header.controls.languageLabel')}>
                  <button
                    type="button"
                    className={`language-option ${language === 'id' ? 'is-active' : ''}`}
                    aria-pressed={language === 'id'}
                    onClick={() => setLanguage('id')}
                  >
                    {t('header.controls.languageId')}
                  </button>
                  <button
                    type="button"
                    className={`language-option ${language === 'en' ? 'is-active' : ''}`}
                    aria-pressed={language === 'en'}
                    onClick={() => setLanguage('en')}
                  >
                    {t('header.controls.languageEn')}
                  </button>
                </div>
              </div>

              <label className="control-field" htmlFor="iteration-select">
                <span className="control-label">{t('header.controls.iterationLabel')}</span>
                <select
                  id="iteration-select"
                  name="iterations"
                  className="iter-select"
                  value={iterations}
                  onChange={event => onSectionChange('input', Number(event.target.value))}
                  disabled={isRunning}
                  aria-label={t('header.controls.iterationLabel')}
                  autoComplete="off"
                >
                  <option value={1000}>{t('header.controls.iter1k')}</option>
                  <option value={5000}>{t('header.controls.iter5k')}</option>
                  <option value={10000}>{t('header.controls.iter10k')}</option>
                </select>
              </label>

              <button
                type="button"
                className={`btn-run ${isRunning ? 'running pulse' : ''}`}
                onClick={onRun}
                disabled={isRunning}
              >
                <Icon name={isRunning ? 'iteration' : 'play'} size={18} className={isRunning ? 'spin' : ''} />
                <span>{isRunning ? t('header.controls.running') : t('header.controls.runBtn')}</span>
              </button>
            </div>
          </div>
        </div>

        <nav className="workflow-stepper workflow-stepper-compact" aria-label={t('header.nav.progress')}>
          {STEPS.map(step => {
            const isCurrent = step.id !== 'run' && currentSection === step.id
            const isDisabled = (step.id === 'results' || step.id === 'insights') && !hasResults

            if (step.id === 'run') {
              return (
                <div
                  key={step.id}
                  className={`workflow-step workflow-step-static ${isRunning ? 'is-current' : ''}`}
                  aria-current={isRunning ? 'step' : undefined}
                >
                  <span className="workflow-step-index">
                    <Icon name={step.icon} size={16} />
                  </span>
                  <span className="workflow-step-copy">
                    <span className="workflow-step-title">{step.label}</span>
                    <span className="workflow-step-desc">
                      {isRunning ? t('header.nav.runningDesc') : t('header.nav.runDescStatic')}
                    </span>
                  </span>
                </div>
              )
            }

            return (
              <button
                key={step.id}
                type="button"
                className={`workflow-step ${isCurrent ? 'is-current' : ''}`}
                onClick={() => onSectionChange(step.id)}
                disabled={isDisabled}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span className="workflow-step-index">
                  <Icon name={step.icon} size={16} />
                </span>
                <span className="workflow-step-copy">
                  <span className="workflow-step-title">{step.label}</span>
                  <span className="workflow-step-desc">{step.description}</span>
                </span>
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
