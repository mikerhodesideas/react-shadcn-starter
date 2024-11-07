// raw-data.d.ts

declare namespace RawData {
  // Base interface for raw data
  interface RawBaseData {
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

  interface RawDailyData extends RawBaseData {
    Date: string
  }

  interface RawHourlyData extends RawBaseData {
    Hour: number
  }

  interface RawThirtyDayData extends RawBaseData {
    // Same as base but used for 30-day aggregation
  }

  interface RawPreviousThirtyDayData extends RawBaseData {
    // Same structure as ThirtyDayData
  }

  interface RawSevenDayData extends RawBaseData {
    // Same structure for 7-day period
  }

  interface RawPreviousSevenDayData extends RawBaseData {
    // Same structure for previous 7-day period
  }
}

declare namespace ProcessedData {
  interface ProcessedBaseData {
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

  interface ProcessedDailyData extends ProcessedBaseData {
    date: string
  }

  interface ProcessedHourlyData extends ProcessedBaseData {
    hour: number
  }

  interface ProcessedThirtyDayData extends ProcessedBaseData {
    // Same as base but used for 30-day aggregation
  }

  interface ProcessedPreviousThirtyDayData extends ProcessedBaseData {
    // Same structure as ProcessedThirtyDayData
  }

  interface ProcessedSevenDayData extends ProcessedBaseData {
    // Same structure for 7-day period
  }

  interface ProcessedPreviousSevenDayData extends ProcessedBaseData {
    // Same structure for previous 7-day period
  }
}

interface CachedData {
  timestamp: string
  daily: ProcessedData.ProcessedDailyData[]
  hourly_today: ProcessedData.ProcessedHourlyData[]
  hourly_yesterday: ProcessedData.ProcessedHourlyData[]
  thirty_days: ProcessedData.ProcessedThirtyDayData[]
  previous_thirty_days: ProcessedData.ProcessedPreviousThirtyDayData[]
  seven_days: ProcessedData.ProcessedSevenDayData[]
  previous_seven_days: ProcessedData.ProcessedPreviousSevenDayData[]
  settings: any[] // Add specific type if needed
  products: any[] // Add specific type if needed
  channels: any[] // Add specific type if needed
  pmax: any[] // Add specific type if needed
  match_types: any[] // Add specific type if needed
  search_terms: any[] // Add specific type if needed
}

export = RawData
export as namespace RawData