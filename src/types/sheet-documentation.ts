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

export interface PreviousThirtyDayMetrics extends ThirtyDayMetrics {}

export interface SevenDayMetrics extends ThirtyDayMetrics {}

export interface PreviousSevenDayMetrics extends ThirtyDayMetrics {}

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
  previous_thirty_days: PreviousThirtyDayMetrics[]
  seven_days: SevenDayMetrics[]
  previous_seven_days: PreviousSevenDayMetrics[]
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
  PREVIOUS_THIRTY_DAYS: 'previous_thirty_days',
  SEVEN_DAYS: 'seven_days',
  PREVIOUS_SEVEN_DAYS: 'previous_seven_days',
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
  [SHEET_TABS.PREVIOUS_THIRTY_DAYS]: '31-60 day comparison metrics',
  [SHEET_TABS.SEVEN_DAYS]: '7-day aggregated metrics',
  [SHEET_TABS.PREVIOUS_SEVEN_DAYS]: '8-14 day comparison metrics',
  [SHEET_TABS.SETTINGS]: 'Campaign settings and configuration',
  [SHEET_TABS.PRODUCTS]: 'Product performance metrics',
  [SHEET_TABS.MATCH_TYPES]: 'Performance by keyword match type',
  [SHEET_TABS.SEARCH_TERMS]: 'Search query performance',
  [SHEET_TABS.CHANNELS]: 'Channel performance metrics',
  [SHEET_TABS.PMAX]: 'Performance Max campaign metrics'
} as const

/**
 * Data Access Patterns
 */

// Accessing data through context
export interface CampaignDataContextType {
  data: StorageData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshData: () => void;
}

// Example usage:
/*
const { data, isLoading, error, lastUpdated, refreshData } = useCampaignData();

// Access specific data sets
const dailyData = data?.daily || [];
const thirtyDayData = data?.thirty_days || [];
const previousThirtyDays = data?.previous_thirty_days || [];
const sevenDayData = data?.seven_days || [];
const previousSevenDays = data?.previous_seven_days || [];
const hourlyToday = data?.hourly_today || [];
const hourlyYesterday = data?.hourly_yesterday || [];
const settings = data?.settings || [];
const products = data?.products || [];
const matchTypes = data?.match_types || [];
const searchTerms = data?.search_terms || [];
const channels = data?.channels || [];
const pmax = data?.pmax || [];
*/

// Storage structure
export interface StorageData {
  timestamp: string;
  daily: DailyMetrics[];
  thirty_days: ThirtyDayMetrics[];
  previous_thirty_days: PreviousThirtyDayMetrics[];
  seven_days: SevenDayMetrics[];
  previous_seven_days: PreviousSevenDayMetrics[];
  hourly_today: HourlyMetrics[];
  hourly_yesterday: HourlyMetrics[];
  settings: CampaignSettings[];
  products: ProductMetrics[];
  match_types: MatchTypeMetrics[];
  search_terms: SearchTermMetrics[];
  channels: ChannelMetrics[];
  pmax: PMaxMetrics[];
}

