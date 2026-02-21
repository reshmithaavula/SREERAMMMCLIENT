import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Try both possible locations (local + production safe fallback)
        const possiblePaths = [
            path.join(process.cwd(), 'header_data.json'),
            path.join(process.cwd(), '..', 'header_data.json')
        ]

        let filePath: string | null = null

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                filePath = p
                break
            }
        }

        if (!filePath) {
            return NextResponse.json({
                nasdaq: { price: "...", change: "0%" },
                nasdaq_futures: { price: "...", change: "0%" },
                btc: { price: "...", change: "0%" },
                eth: { price: "...", change: "0%" },
                gld: { price: "...", change: "0%" },
                slv: { price: "...", change: "0%" },
                last_updated: "File Missing"
            })
        }

        const fileContents = await fs.promises.readFile(filePath, 'utf8')
        const data = JSON.parse(fileContents)

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'no-store'
            }
        })

    } catch (error) {
        console.error('Error reading header data:', error)

        return NextResponse.json({
            nasdaq: { price: "...", change: "0%" },
            nasdaq_futures: { price: "...", change: "0%" },
            btc: { price: "...", change: "0%" },
            eth: { price: "...", change: "0%" },
            gld: { price: "...", change: "0%" },
            slv: { price: "...", change: "0%" },
            last_updated: "Error"
        })
    }
}
