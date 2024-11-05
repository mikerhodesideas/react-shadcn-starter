export interface RawDailyData {
  Date: string
  Clicks: number
  LostToBudget: number
  ImprShare: number
  LostToRank: number
  ConvValue: number
  Conversions: number
  Cost: number
  Impressions: number
  'campaign.resourceName': string
  Campaign: string
  CampaignId: number
}

export interface ProcessedDailyData {
  date: string
  campaign: string
  impr: number
  clicks: number
  cost: number
  conv: number
  value: number
  lostToBudget: number
  imprShare: number
  lostToRank: number
  campaignId: number
}

export interface CachedData {
  timestamp: string
  daily: ProcessedDailyData[]
  thirty_days: ProcessedDailyData[]
} 