import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'owner') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });

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

        if (userId) {
            await prisma.user.update({
                where: { id: userId },
                data: { role: role }
            });
        } else if (email) {
            await prisma.user.upsert({
                where: { email: email },
                update: { role: role },
                create: {
                    email: email,
                    name: email.split('@')[0],
                    role: role,
                    password: 'placeholder_' + Math.random().toString(36).slice(-8)
                }
            });
        }

        return NextResponse.json({ message: `User updated successfully` });
    } catch (error: any) {
        console.error("API Error (Update User):", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
