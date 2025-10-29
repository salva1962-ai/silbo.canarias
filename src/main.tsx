import React from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'

import { RouterProvider } from 'react-router-dom'
import router from './router'
import { DataProvider } from './lib/DataContext'
import { ThemeProvider } from './lib/ThemeProvider'
import { ErrorBoundary } from './components/ErrorBoundary'
import './lib/config'
import './styles.css' // ← ESTO DEBE ESTAR

if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Failed to find the root element')
}

createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
