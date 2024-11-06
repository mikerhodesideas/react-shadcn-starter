// src/types/metrics.d.ts

export interface Metrics {
  impr: number
  clicks: number
  cost: number
  conv: number
  value: number
}

export interface Campaign {
  name: string
  id: string
  metrics: Metrics
}

export interface SheetData extends Metrics {
  date: string
  campaign?: string
}

export interface ProfitCurveProps {
  selectedCampaign: Campaign | null
  setSelectedCampaign: (campaign: Campaign | null) => void
  cost: number
  setCost: (value: number) => void
  convValue: number
  setConvValue: (value: number) => void
  campaigns: Campaign[]
  currentMetrics: Metrics
  profitData: Array<{ spend: number; profit: number; revenue: number }>
  optimalPoint: { x: number; y: number } | null
  optimalZone: { start: number; end: number } | null
  activeChart: string
  setActiveChart: (chart: string) => void
  incrementalData: Array<{ spend: number; cpa: number; cvr: number }>
  cogsPercentage: number
} 