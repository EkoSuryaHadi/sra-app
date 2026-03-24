import { useCallback, useEffect, useState } from 'react'

export function resolveSection(hash, hasResults) {
  const normalized = hash.replace('#', '')
  if (normalized === 'input') return 'input'
  if ((normalized === 'results' || normalized === 'insights') && hasResults) return normalized
  return 'input'
}

export function useStageNavigation({ hasResults, onIterationsChange }) {
  const [activeSection, setActiveSection] = useState(() =>
    typeof window === 'undefined' ? 'input' : resolveSection(window.location.hash, hasResults)
  )

  const goToSection = useCallback((nextSection, nextIterations) => {
    const resolvedSection = (nextSection === 'results' || nextSection === 'insights') && !hasResults
      ? 'input'
      : nextSection

    if (typeof nextIterations === 'number') {
      onIterationsChange(nextIterations)
    }

    setActiveSection(resolvedSection)

    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${resolvedSection}`)
    }
  }, [hasResults, onIterationsChange])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handleHashChange = () => {
      const nextSection = resolveSection(window.location.hash, hasResults)
      setActiveSection(nextSection)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [hasResults])

  return {
    activeSection,
    goToSection,
    setActiveSection,
  }
}
