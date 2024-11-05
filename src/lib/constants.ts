export const GOOGLE_SHEET_URL = "https://script.googleusercontent.com/a/macros/mikerhodes.com.au/echo?user_content_key=qZgjtAm2WehQH_H-vzNntPbEjJaJkzPhPpFa4Ux5yRFf7_l4tJexUTJUuIG2C7j9TI4nHMHolBjL08m94iTdiiL_dVNMyOVCOJmA1Yb3SEsKFZqtv3DaNYcMrmhZHmUMi80zadyHLKDOmt9N35kDW6PTFWt5KsiO9SISUMb73wTrcUZtur22xrInd-YZS-n4u3zWvZab3DzCa2CyRE59YiAsUJmRpKQiUwCYXXw410LUhyACvvkBWC3zkXoba5v7p0vNwDE5V1Vcy6pr-Oj0FQ&lib=MVDl8MzrB0qzTMju7vAqm9_TzXHqrlUpj"

export const STORAGE_KEYS = {
  CAMPAIGN_DATA: 'campaignData'
} as const

// Cache duration in milliseconds
export const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// API endpoints
export const API = {
  SHEET_DATA: GOOGLE_SHEET_URL
} as const 