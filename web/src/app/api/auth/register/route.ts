import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import crypto from "crypto";

// Helper to hash passwords without bcryptjs
function hashPassword(password: string) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return `${salt}:${hash}`;
}

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: "Missing email or password" },
                { status: 400 }
            );
        }

        const db = getDb();
        if (!db) {
            throw new Error("Database connection failed");
        }

        // Check if user already exists
        let existingUser;
        try {
            existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
        } catch (e: any) {
            console.error("[REGISTRATION] DB Query failed:", e.message);
            // This might happen if the table doesn't exist yet, although getDb() should handle it
            throw new Error("Database error during user verification");
        }

        if (existingUser) {
            // Check if this is a pre-invited owner (placeholder password)
            if (existingUser.password && existingUser.password.startsWith('placeholder_')) {
                console.log(`[REGISTRATION] Claiming placeholder account for: ${email}`);
                const hashedPassword = hashPassword(password);
                db.prepare("UPDATE users SET name = ?, password = ? WHERE id = ?").run(
                    name || existingUser.name || email.split('@')[0],
                    hashedPassword,
                    existingUser.id
                );
                return NextResponse.json(
                    { message: "Account claimed and registration completed", id: existingUser.id },
                    { status: 200 }
                );
            }

            console.log(`[REGISTRATION] User already exists: ${email}`);
            return NextResponse.json(
                { message: "User already exists with this email" },
                { status: 400 }
            );
        }

        // Determine role: if no users exist, the first is owner
        let role = 'user';
        try {
            const userCount = db.prepare("SELECT count(*) as count FROM users").get() as any;
            role = (!userCount || userCount.count === 0) ? 'owner' : 'user';
        } catch (e: any) {
            console.warn("[REGISTRATION] Failed to count users, defaulting to 'user' role:", e.message);
        }

        // Hash password
        const hashedPassword = hashPassword(password);

        // Insert user with role
        console.log(`[REGISTRATION] Creating new user: ${email} with role: ${role}`);
        const result = db.prepare(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)"
        ).run(name || email.split('@')[0], email, hashedPassword, role);

        return NextResponse.json(
            { message: "User created successfully", id: result.lastInsertRowid },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { message: "Internal server error", error: error.message },
            { status: 500 }
        );
    }
}
