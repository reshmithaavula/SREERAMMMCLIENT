import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.resolve(process.cwd(), 'data/bot-config.json');

async function isOwner() {
    const session = await getServerSession(authOptions);
    return (session?.user as any)?.role === 'owner';
}

export async function GET() {
    if (!(await isOwner())) {
        return NextResponse.json({ error: 'Unauthorized: Owner only' }, { status: 403 });
    }

    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            return NextResponse.json({ username: '', password: '' });
        }
        const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    if (!(await isOwner())) {
        return NextResponse.json({ error: 'Unauthorized: Owner only' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { username, password } = body;

        const data = { username, password };

        // Ensure data directory exists
        const dataDir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
