import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getDb } from "./db";
import crypto from "crypto";

// Force reload: 2025-12-25
// Helper to verify passwords using native crypto
function verifyPassword(password: string, hash: string) {
    const [salt, key] = hash.split(":");
    const derivedKey = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return key === derivedKey;
}

import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    console.log("[AUTH] Missing email or password");
                    return null;
                }

                try {
                    console.log(`[AUTH] Attempting login for: ${credentials.email}`);
                    const db = getDb();
                    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(credentials.email) as any;

                    if (!user) {
                        console.log(`[AUTH] User not found: ${credentials.email}`);
                        throw new Error("USER_NOT_FOUND");
                    }

                    if (!user.password) {
                        console.log(`[AUTH] User has no password (likely social login): ${credentials.email}`);
                        return null;
                    }

                    const isPasswordValid = verifyPassword(credentials.password, user.password);

                    if (!isPasswordValid) {
                        console.log(`[AUTH] Invalid password for: ${credentials.email}`);
                        return null;
                    }

                    // Emergency Fallback: If no owner exists in the DB, make the first person who logs in the owner
                    let currentRole = user.role || 'user';
                    try {
                        const ownerExists = db.prepare("SELECT 1 FROM users WHERE role = 'owner' LIMIT 1").get();
                        if (!ownerExists) {
                            db.prepare("UPDATE users SET role = 'owner' WHERE id = ?").run(user.id);
                            currentRole = 'owner';
                            console.log(`[AUTH] No owner found in DB. Auto-promoted ${user.email} to owner.`);
                        }
                    } catch (e: any) {
                        console.warn("[AUTH] Role check/promotion failed:", e.message);
                    }

                    console.log(`[AUTH] Login successful: ${credentials.email} (${currentRole})`);
                    return {
                        id: user.id.toString(),
                        name: user.name,
                        email: user.email,
                        image: user.image || null,
                        role: currentRole
                    };
                } catch (error: any) {
                    console.error("[AUTH] Fatal error during authorize:", error);
                    throw new Error(error.message || "Authentication service unavailable");
                }
            },
        }),
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                try {
                    const db = getDb();
                    const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(user.email);
                    if (!existingUser) {
                        db.prepare("INSERT INTO users (name, email, image, role) VALUES (?, ?, ?, 'user')")
                            .run(user.name, user.email, user.image);
                    }
                    return true;
                } catch (e) {
                    console.error("Google Signin DB Error", e);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = (user as any).id;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.id as string;
                (session.user as any).role = token.role as string;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev-only",
};
