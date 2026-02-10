import { NextResponse } from 'next/server';
import { getTopOptions } from '@/lib/stock-api';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const options = await getTopOptions();
        return NextResponse.json({ options });
    } catch (error) {
        console.error('Options API Error:', error);
        return NextResponse.json({ options: [] });
    }
}
