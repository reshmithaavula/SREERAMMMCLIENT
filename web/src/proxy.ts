import { withAuth } from "next-auth/middleware";

export default withAuth;

export const config = {
    // Protect everything except these paths
    matcher: ["/((?!api/auth|login|register|_next/static|_next/image|favicon.ico).*)"],
};
