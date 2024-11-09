// src/pages/debug.tsx
'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCampaignData } from "@/contexts/campaign-data"
import { STORAGE_KEYS } from '@/lib/constants'

// Component for Table Display
function DataTable({ data, title }: { data: any[], title: string }) {
  if (!data?.length) return null

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>{title}</span>
          <span className="text-sm text-muted-foreground">
            {data.length} rows
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {Object.keys(data[0]).map((header) => (
                  <th
                    key={header}
                    className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 3).map((row, idx) => (
                <tr key={idx} className="border-b">
                  {Object.entries(row).map(([key, value]) => (
                    <td
                      key={key}
                      className="px-4 py-2 whitespace-nowrap"
                    >
                      {typeof value === 'number' 
                        ? Number(value).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2
                          })
                        : String(value)
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Debug() {
  const { 
    dailyData,
    thirtyDayData,
    hourlyTodayData,
    hourlyYesterdayData,
    settings,
    products,
    matchTypes,
    searchTerms,
    channels,
    pmax,
    lastUpdated,
  } = useCampaignData()

  const allDataSets = [
    { data: dailyData, title: 'Daily Data' },
    { data: thirtyDayData, title: '30 Day Data' },
    { data: hourlyTodayData, title: 'Hourly Today' },
    { data: hourlyYesterdayData, title: 'Hourly Yesterday' },
    { data: settings, title: 'Settings' },
    { data: products, title: 'Products' },
    { data: matchTypes, title: 'Match Types' },
    { data: searchTerms, title: 'Search Terms' },
    { data: channels, title: 'Channels' },
    { data: pmax, title: 'Performance Max' }
  ]

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Data Debug View</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}
        </p>
      </div>

      {/* Displaying Colors and Typography */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-primary">Primary Color Text</h2>
        <p className="text-muted-foreground">This is a muted foreground text example.</p>
        <p className="text-secondary">This is a secondary text color.</p>
        <div className="bg-primary text-white p-4 rounded">Primary Background</div>
        <div className="bg-secondary text-white p-4 rounded">Secondary Background</div>
        <div className="bg-muted p-4 rounded text-muted-foreground">Muted Background</div>
      </section>

      {/* Basic Components Showcase */}
      <section className="space-y-6 mt-6">
        <Card className="p-4 bg-background">
          <CardHeader>
            <CardTitle>Sample Card Component</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This card component showcases default padding and background styling.</p>
          </CardContent>
        </Card>

        <Card className="p-4 bg-accent text-accent-foreground">
          <CardHeader>
            <CardTitle>Accent Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This card has accent background and foreground colors applied.</p>
          </CardContent>
        </Card>
      </section>

      {/* Data Tables */}
      <div className="space-y-8 mt-8">
        {allDataSets.map(({ data, title }) => (
          <DataTable key={title} data={data} title={title} />
        ))}
      </div>
    </div>
  )
}
