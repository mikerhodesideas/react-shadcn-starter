import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/components/layouts/root-layout'

// Import all pages
import Analysis from '@/pages/analysis'
import Trends from '@/pages/trends'
import Settings from '@/pages/settings'
import Debug from '@/pages/debug'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Settings />,
      },
      {
        path: 'analysis',
        element: <Analysis />,
      },
      {
        path: 'trends',
        element: <Trends />,
      },
      {
        path: 'debug',
        element: <Debug />,
      }
    ],
  },
]) 