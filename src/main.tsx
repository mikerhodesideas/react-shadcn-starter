import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { router } from './Router';
import './index.css'

// Update the initial theme setup
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.classList.add(systemPrefersDark ? 'dark' : 'light');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme={systemPrefersDark ? "dark" : "light"}>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
)
