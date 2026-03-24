import React from 'react'
import { render } from '@testing-library/react'
import { LanguageProvider } from '../contexts/LanguageContext'

export function renderWithProviders(ui) {
  return render(
    <LanguageProvider>
      {ui}
    </LanguageProvider>
  )
}
