import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Determine the path to the JSON file
        // Assuming the Next.js app is running in 'web' directory, and the file is in the parent 'sproject' directory
        // Absolute path is the source of truth for the scraper
        const dbPath = path.join(process.cwd(), '..', 'header_data.json');

        if (!fs.existsSync(dbPath)) {
            return NextResponse.json({
                nasdaq: { price: "...", change: "0%" },
                nasdaq_futures: { price: "...", change: "0%" },
                btc: { price: "...", change: "0%" },
                eth: { price: "...", change: "0%" },
                gld: { price: "...", change: "0%" },
                slv: { price: "...", change: "0%" },
                last_updated: "File Missing"
            });
        }

        // Use Async Read to prevent blocking the event loop
        const fileContents = await fs.promises.readFile(dbPath, 'utf8');
        const data = JSON.parse(fileContents);

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        });
    } catch (error) {
        console.error('Error reading header data:', error);
        return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
    }
}
