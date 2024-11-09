// src/main.tsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from "@/components/theme-provider"
import { CampaignDataProvider } from "@/contexts/campaign-data"
import { router } from './Router'
import './index.css'
import { RouterProvider } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="app-theme">
      <CampaignDataProvider>
        <RouterProvider router={router} />
      </CampaignDataProvider>
    </ThemeProvider>
  </React.StrictMode>
)
