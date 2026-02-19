export const runtime = "nodejs";

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const handler = NextAuth({
    adapter: PrismaAdapter(prisma),

    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) return null;

                const isValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isValid) return null;

                return user;
            },
        }),
    ],

    session: {
        strategy: "jwt",
    },

    secret: process.env.NEXTAUTH_SECRET,

    pages: {
        signIn: "/login",
    },
});

export { handler as GET, handler as POST };
export const runtime = "nodejs";

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const handler = NextAuth({
    adapter: PrismaAdapter(prisma),

    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) return null;

                const isValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isValid) return null;

                return user;
            },
        }),
    ],

    session: {
        strategy: "jwt",
    },

    secret: process.env.NEXTAUTH_SECRET,

    pages: {
        signIn: "/login",
    },
});

export { handler as GET, handler as POST };
