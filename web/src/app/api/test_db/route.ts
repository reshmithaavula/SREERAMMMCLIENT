import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        const latestMover = await prisma.marketMover.findFirst({
            orderBy: { updatedAt: 'desc' }
        });
        const latestTs = latestMover?.updatedAt || null;

        return NextResponse.json({
            status: 'success',
            latestTs: latestTs,
            time: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[API Test DB] Error:', error);
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
