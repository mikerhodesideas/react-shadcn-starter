// src/App.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { CampaignDataProvider } from "@/contexts/campaign-data"
import RootLayout from "@/components/layouts/root-layout"
import Index from "./pages/index"
import Settings from "./pages/settings"
import Setup from "./pages/setup"
import Trends from "./pages/trends"  // Add this import if not already there

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <Index />,
      },
      {
        path: "/settings",
        element: <Settings />,
      },
      {
        path: "/setup",
        element: <Setup />,
      },
      {
        path: "/trends",
        element: <Trends />,
      }
      // Add other routes here
    ]
  }
])

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <CampaignDataProvider>
        <RouterProvider router={router} />
      </CampaignDataProvider>
    </ThemeProvider>
  )
}