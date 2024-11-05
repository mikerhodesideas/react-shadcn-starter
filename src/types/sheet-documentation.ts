/**
 * Documentation for Google Ads Sheet Data Structure
 */

export interface HourlyMetrics {
  Hour: number
  Campaign: string
  CampaignId: string
  Conversions: number
  Clicks: number
  Cost: number
  ConvValue: number
  Impressions: number
  LostToBudget: number
  ImprShare: number
  LostToRank: number
}

export interface DailyMetrics extends Omit<HourlyMetrics, 'Hour'> {
  Date: string
}

export interface ThirtyDayMetrics extends Omit<HourlyMetrics, 'Hour'> {}

export interface CampaignSettings {
  BidStrategy: string
  BidStatus: string
  BidType: string
  Budget: number
  Group: string
  Channel: string
  SubChannel: string
  OptStatus: string
  CampaignId: string
  Labels: string
  Campaign: string
  TargetCPA: number | null
  TargetROAS: number | null
  MaxCPC: number
  RTBOptIn: boolean
  StatusReasons: string
  PrimaryStatus: string
  ServingStatus: string
  Status: string
  OptOutURLExp: boolean
}

export interface ProductMetrics {
  ProductId: string
  ProductTitle: string
  Impressions: number
  Clicks: number
  Cost: number
  Conversions: number
  ConvValue: number
}

export interface MatchTypeMetrics {
  KeywordMatchType: 'Exact' | 'Phrase' | 'Broad'
  Impressions: number
  Clicks: number
  Cost: number
  Conversions: number
  ConvValue: number
}

export interface SearchTermMetrics {
  SearchTerm: string
  Impressions: number
  Clicks: number
  Cost: number
  Conversions: number
  ConvValue: number
}

export interface ChannelMetrics {
  Channel: string
  Impressions: number
  Cost: number
  Conversions: number
  ConvValue: number
}

export interface PMaxMetrics {
  Date: string
  Impressions: number
  Cost: number
  Conversions: number
  ConvValue: number
}

export interface SheetData {
  hourly_today: HourlyMetrics[]
  hourly_yesterday: HourlyMetrics[]
  daily: DailyMetrics[]
  thirty_days: ThirtyDayMetrics[]
  settings: CampaignSettings[]
  products: ProductMetrics[]
  match_types: MatchTypeMetrics[]
  search_terms: SearchTermMetrics[]
  channels: ChannelMetrics[]
  pmax: PMaxMetrics[]
}

export const SHEET_TABS = {
  HOURLY_TODAY: 'hourly_today',
  HOURLY_YESTERDAY: 'hourly_yesterday',
  DAILY: 'daily',
  THIRTY_DAYS: 'thirty_days',
  SETTINGS: 'settings',
  PRODUCTS: 'products',
  MATCH_TYPES: 'match_types',
  SEARCH_TERMS: 'search_terms',
  CHANNELS: 'channels',
  PMAX: 'pmax'
} as const

export type SheetTab = keyof typeof SHEET_TABS

export const TAB_DESCRIPTIONS = {
  [SHEET_TABS.HOURLY_TODAY]: 'Hourly metrics for today',
  [SHEET_TABS.HOURLY_YESTERDAY]: 'Hourly metrics for yesterday',
  [SHEET_TABS.DAILY]: 'Daily campaign metrics',
  [SHEET_TABS.THIRTY_DAYS]: '30-day aggregated metrics',
  [SHEET_TABS.SETTINGS]: 'Campaign settings and configuration',
  [SHEET_TABS.PRODUCTS]: 'Product performance metrics',
  [SHEET_TABS.MATCH_TYPES]: 'Performance by keyword match type',
  [SHEET_TABS.SEARCH_TERMS]: 'Search query performance',
  [SHEET_TABS.CHANNELS]: 'Channel performance metrics',
  [SHEET_TABS.PMAX]: 'Performance Max campaign metrics'
} as const 