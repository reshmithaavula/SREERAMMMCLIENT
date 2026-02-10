import { NextResponse } from 'next/server';
import { generateTwitterPost } from '@/lib/twitter';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const tweet = await generateTwitterPost();

        return NextResponse.json({
            tweet,
            length: tweet.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate tweet' },
            { status: 500 }
        );
    }
}
