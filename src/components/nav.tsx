'use client'

import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

const routes = [
  {
    href: '/',
    label: 'Settings'
  },
  {
    href: '/analysis',
    label: 'Campaign Analysis'
  },
  {
    href: '/trends',
    label: 'Daily Trends'
  },
  {
    href: '/curve',
    label: 'Profit Curve'
  }
]

export function MainNav() {
  const location = useLocation()

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
      {routes.map((route) => (
        <Link
          key={route.href}
          to={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            location.pathname === route.href
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  )
} 