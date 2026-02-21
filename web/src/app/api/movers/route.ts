import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const prisma = new PrismaClient()

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const portfolioTickers = searchParams.get('portfolio')?.split(',') || []
    const portfolioSet = new Set(portfolioTickers.map(t => t.toUpperCase()))

    try {

        // -----------------------
        // WATCHLIST CACHE (UNCHANGED)
        // -----------------------

        const csvPath = path.join(process.cwd(), '../Watchlist_New.csv')

        const CACHE_TTL = 60000
        const getGlobalCache = () => (global as any).watchlistCache
        const setGlobalCache = (val: any) => { (global as any).watchlistCache = val }

        if (!getGlobalCache() || (Date.now() - getGlobalCache().timestamp > CACHE_TTL)) {
            try {
                if (fs.existsSync(csvPath)) {
                    const stats = fs.statSync(csvPath)

                    if (!getGlobalCache() || stats.mtimeMs !== getGlobalCache().fileMtime) {
                        const content = fs.readFileSync(csvPath, 'utf-8')
                        const lines = content.split('\n')
                        const newSet = new Set<string>()

                        for (let i = 1; i < lines.length; i++) {
                            const parts = lines[i].split(',')
                            if (parts.length > 1) {
                                const t = parts[1]?.trim().toUpperCase()
                                if (t) newSet.add(t)
                            }
                        }

                        setGlobalCache({
                            set: newSet,
                            timestamp: Date.now(),
                            fileMtime: stats.mtimeMs
                        })
                    }
                }
            } catch (e) {
                console.error("[API Movers] Error reading Watchlist_New.csv:", e)
            }
        }

        const allowedTickersSet = getGlobalCache()?.set || new Set<string>()

        // -----------------------
        // MOMENTUM FROM POSTGRES (FIXED)
        // -----------------------

        let m1 = { rippers: [] as any[], dippers: [] as any[] }
        let m5 = { rippers: [] as any[], dippers: [] as any[] }
        let m30 = { rippers: [] as any[], dippers: [] as any[] }
        let day = { rippers: [] as any[], dippers: [] as any[] }
        let common: any[] = []

        try {
            const movers = await prisma.market_movers.findMany({
                select: {
                    type: true,
                    ticker: true,
                    price: true,
                    change_percent: true,
                    session: true,
                    common_flag: true
                }
            })

            movers.forEach((m: any) => {
                const entry = {
                    ticker: m.ticker,
                    price: m.price || 0,
                    change: m.change_percent || 0,
                    session: m.session || "Closed"
                }

                if (m.type === "1m_ripper") m1.rippers.push(entry)
                if (m.type === "1m_dipper") m1.dippers.push(entry)

                if (m.type === "5m_ripper") m5.rippers.push(entry)
                if (m.type === "5m_dipper") m5.dippers.push(entry)

                if (m.type === "30m_ripper") m30.rippers.push(entry)
                if (m.type === "30m_dipper") m30.dippers.push(entry)

                if (m.type === "day_ripper") day.rippers.push(entry)
                if (m.type === "day_dipper") day.dippers.push(entry)

                if (m.common_flag === 1) common.push(entry)
            })

        } catch (e: any) {
            console.error("[API Movers] Failed to fetch market_movers:", e.message)
        }

        return NextResponse.json({
            m1,
            m5,
            m30,
            day,
            common,
            watchlist: [],
            quotes: {},
            news: [],
            movers: [],
            sessions: { preMarket: [], regular: [], postMarket: [] },
            engineStatus: {
                lastUpdate: new Date().toISOString(),
                isLive: true,
                statusText: 'Engine Live',
                statusColor: 'green',
                latencyMs: 0,
                session: 'Active'
            },
            botStats: {
                tweetCount: 0,
                lastTweet: null,
                status: 'Online',
                lastLog: '',
                isActive: true
            },
            institutionalStats: {},
            debug: {
                allowedTickersCount: allowedTickersSet.size,
                marketMoversCount:
                    m1.rippers.length + m1.dippers.length +
                    m5.rippers.length + m5.dippers.length +
                    m30.rippers.length + m30.dippers.length +
                    day.rippers.length + day.dippers.length,
                timestamp: new Date().toISOString()
            }
        })

    } catch (error: any) {
        console.error('[API Movers] TOP LEVEL CRASH:', error.message)
        return NextResponse.json({
            error: 'Fatal API error',
            message: error.message
        }, { status: 500 })
    }
}
