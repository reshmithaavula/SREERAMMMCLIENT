export const dynamic = "force-dynamic";

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const handler = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        // providers
    ],
    session: {
        strategy: "database",
    },
});

export { handler as GET, handler as POST };
