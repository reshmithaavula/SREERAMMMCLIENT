import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
const STATUS_PATH = path.resolve(process.cwd(), 'data/bot-status.json');
const CONFIG_PATH = path.resolve(process.cwd(), 'data/bot-config.json');

export async function GET() {
    try {
        let status = { status: 'Stopped', lastUpdate: null, lastLog: 'Bot is not running' };
        if (fs.existsSync(STATUS_PATH)) {
            try {
                const fileContent = fs.readFileSync(STATUS_PATH, 'utf-8');
                if (fileContent.trim()) {
                    const data = JSON.parse(fileContent);
                    // Check if process is still alive (simple heuristic)
                    const lastUpdate = new Date(data.lastUpdate).getTime();
                    const now = new Date().getTime();

                    // If hasn't updated in 10 minutes, consider it stale/stopped
                    if (now - lastUpdate > 10 * 60 * 1000) {
                        status = { ...status, status: 'Stale / Stopped', lastLog: 'Bot has not reported status in 10 minutes.' };
                    } else {
                        status = data;
                    }
                }
            } catch (readError) {
                console.error("Error reading/parsing bot status:", readError);
            }
        }

        let config = { username: '', password: '' };
        if (fs.existsSync(CONFIG_PATH)) {
            try {
                const fileContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
                if (fileContent.trim()) {
                    config = JSON.parse(fileContent);
                }
            } catch (readError) {
                console.error("Error reading/parsing bot config:", readError);
            }
        }

        return NextResponse.json({ status, config });
    } catch (error) {
        console.error("API Error in /api/automation/bot:", error);
        return NextResponse.json({ error: 'Failed to fetch bot status' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, username, password } = body;

        if (action === 'updateConfig') {
            const config = { username, password };
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
            return NextResponse.json({ message: 'Configuration updated' });
        }

        if (action === 'stop') {
            if (fs.existsSync(STATUS_PATH)) {
                const data = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
                if (data.pid) {
                    process.kill(data.pid, 'SIGTERM');
                    fs.writeFileSync(STATUS_PATH, JSON.stringify({ status: 'Stopped', lastUpdate: new Date().toISOString(), lastLog: 'Bot stopped by user' }, null, 2));
                    return NextResponse.json({ message: 'Bot stop command sent' });
                }
            }
            return NextResponse.json({ error: 'PID not found' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }
}
