import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export const { handlers, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),

    providers: [
        // your providers here (Google, Credentials, etc.)
    ],

    session: {
        strategy: "database",
    },
});
