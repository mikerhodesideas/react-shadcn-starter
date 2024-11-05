// src/main.tsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from "@/components/theme-provider"
import { CampaignDataProvider } from "@/contexts/campaign-data"
import Router from './Router'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <CampaignDataProvider>
        <Router />
      </CampaignDataProvider>
    </ThemeProvider>
  </React.StrictMode>
)
