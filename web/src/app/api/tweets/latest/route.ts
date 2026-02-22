import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const news = await prisma.news.findMany({
            orderBy: { ts: 'desc' },
            take: 4
        });

        return NextResponse.json(news.map(n => ({
            ...n,
            time: n.ts
        })));
    } catch (e) {
        return NextResponse.json([]);
    }
}
