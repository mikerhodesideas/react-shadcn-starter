import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { data, filename } = req.body
    const dataDir = join(process.cwd(), 'public', 'data')
    
    // Create data directory if it doesn't exist
    try {
      await mkdir(dataDir, { recursive: true })
    } catch (err) {
      console.log('Directory exists or creation failed:', err)
    }

    const filePath = join(dataDir, filename)
    await writeFile(filePath, JSON.stringify(data, null, 2))
    
    res.status(200).json({ message: 'Data saved successfully' })
  } catch (error) {
    console.error('Error saving data:', error)
    res.status(500).json({ message: 'Error saving data' })
  }
} 