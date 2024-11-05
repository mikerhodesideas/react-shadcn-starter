// Generate mock profit curve data
const generateProfitData = (baseSpend: number, baseProfit: number) => {
  const data = []
  for (let i = 0; i <= 20; i++) {
    const spend = baseSpend * (i / 10)
    // Diminishing returns curve for profit
    const profit = baseProfit * (1 - Math.exp(-i / 10)) - spend
    const revenue = profit + spend
    data.push({
      spend: Number(spend.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      revenue: Number(revenue.toFixed(2))
    })
  }
  return data
}

// Generate mock incremental metrics
const generateIncrementalData = (baseCPA: number, baseCVR: number) => {
  const data = []
  for (let i = 0; i <= 20; i++) {
    const spend = i * 100
    // CPA increases with spend
    const cpa = baseCPA * (1 + i / 20)
    // CVR decreases with spend
    const cvr = baseCVR * (1 - i / 40)
    data.push({
      spend: Number(spend.toFixed(2)),
      cpa: Number(cpa.toFixed(2)),
      cvr: Number(cvr.toFixed(2))
    })
  }
  return data
}

export const mockProfitData = {
  "camp_1": {
    profitData: generateProfitData(500, 2000),
    incrementalData: generateIncrementalData(20, 5),
    optimalPoint: { x: 800, y: 1200 },
    optimalZone: { start: 600, end: 1000 }
  },
  "camp_2": {
    profitData: generateProfitData(1000, 3000),
    incrementalData: generateIncrementalData(30, 4),
    optimalPoint: { x: 1500, y: 2000 },
    optimalZone: { start: 1200, end: 1800 }
  },
  "camp_3": {
    profitData: generateProfitData(300, 1000),
    incrementalData: generateIncrementalData(40, 2),
    optimalPoint: { x: 500, y: 700 },
    optimalZone: { start: 400, end: 600 }
  }
} 