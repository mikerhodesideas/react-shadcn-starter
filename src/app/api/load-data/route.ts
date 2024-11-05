// src/app/api/load-data/route.ts
import { readFile } from 'fs/promises'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  console.log('Load endpoint hit')
  try {
    const url = new URL(req.url)
    const filename = url.searchParams.get('filename')

    if (!filename) {
      console.log('No filename provided')
      return NextResponse.json(
        { success: false, message: 'Filename is required' },
        { status: 400 }
      )
    }

    const dataDir = join(process.cwd(), 'public', 'data')
    const filePath = join(dataDir, filename)
    console.log('Attempting to read:', filePath)

    try {
      const fileContent = await readFile(filePath, 'utf-8')
      const data = JSON.parse(fileContent)
      console.log('File read successfully')
      return NextResponse.json(data)
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        console.log(`File not found: ${filePath}`)
        return NextResponse.json([])
      }
      console.error('Error reading file:', err)
      throw err
    }
  } catch (error) {
    console.error('Error in load endpoint:', error)
    return NextResponse.json(
      { success: false, message: 'Error loading data', error: String(error) },
      { status: 500 }
    )
  }
}