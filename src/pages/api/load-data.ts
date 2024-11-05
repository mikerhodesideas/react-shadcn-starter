import { readFile } from 'fs/promises'
import { join } from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { filename } = req.query
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ message: 'Filename is required' })
    }

    const dataDir = join(process.cwd(), 'public', 'data')
    const filePath = join(dataDir, filename)

    try {
      const fileContent = await readFile(filePath, 'utf-8')
      const data = JSON.parse(fileContent)
      res.status(200).json(data)
    } catch (err) {
      // If file doesn't exist, return empty array instead of error
      if (err.code === 'ENOENT') {
        res.status(200).json([])
      } else {
        throw err
      }
    }
  } catch (error) {
    console.error('Error loading data:', error)
    res.status(500).json({ message: 'Error loading data', error: error.message })
  }
} 