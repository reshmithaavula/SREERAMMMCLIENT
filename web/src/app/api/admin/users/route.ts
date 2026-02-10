import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'owner') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = getDb(true);
        const users = db.prepare("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC").all();

        return NextResponse.json({ users });
    } catch (error: any) {
        console.error("API Error (List Users):", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'owner') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, email, role } = await req.json();

        if ((!userId && !email) || !role) {
            return NextResponse.json({ error: 'Missing userId/email or role' }, { status: 400 });
        }

        const db = getDb();

        if (userId) {
            db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, userId);
        } else if (email) {
            const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as any;
            if (user) {
                db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, user.id);
            } else {
                db.prepare("INSERT INTO users (name, email, role, password) VALUES (?, ?, ?, ?)").run(
                    email.split('@')[0],
                    email,
                    role,
                    'placeholder_' + Math.random().toString(36).slice(-8)
                );
            }
        }

        return NextResponse.json({ message: `User updated successfully` });
    } catch (error: any) {
        console.error("API Error (Update User):", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
