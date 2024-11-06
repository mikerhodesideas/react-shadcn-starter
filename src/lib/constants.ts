// src/lib/constants.ts

export const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbwre7Zv6QaL9bZsUexe5lhPOadnXCbKpo-hz1oF0RZgWh0rWD6-R7LKfzYCz4xjMIya/exec'

export const STORAGE_KEYS = {
  CAMPAIGN_DATA: 'campaignData',
  ROW_LIMIT: 'campaign_row_limit'
} as const

// Cache duration in milliseconds
export const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// API endpoints
export const API = {
  SHEET_DATA: GOOGLE_SHEET_URL
} as const 