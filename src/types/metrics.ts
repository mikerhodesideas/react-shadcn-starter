export interface Campaign {
  id: string
  name: string
  metrics: Metrics
}

export interface Metrics {
  impr: number
  clicks: number
  cost: number
  conv: number
  value: number
}

export interface SheetData extends Metrics {
  date: string
  campaign?: string
} 