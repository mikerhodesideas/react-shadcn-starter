// src/app/api/save-data/route.ts
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data, filename } = body

    if (!data || !filename) {
      return NextResponse.json({ success: false, message: 'Missing data or filename' }, { status: 400 })
    }

    const dataDir = join(process.cwd(), 'public', 'data')
    await mkdir(dataDir, { recursive: true })

    const filePath = join(dataDir, filename)
    await writeFile(filePath, JSON.stringify(data, null, 2))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}