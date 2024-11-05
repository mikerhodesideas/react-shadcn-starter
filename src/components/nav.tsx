'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from "@/lib/utils"

const routes = [
  {
    href: '/',
    label: 'Settings'
  },
  {
    href: '/campaign-analysis',
    label: 'Campaign Analysis'
  },
  {
    href: '/daily-trends',
    label: 'Daily Trends'
  },
  {
    href: '/profit-curve',
    label: 'Profit Curve'
  }
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === route.href
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