import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes that require authentication
const protectedRoutes = ["/dashboard", "/planet", "/map", "/fleet", "/alliance", "/market", "/settings"];
const publicRoutes = ["/", "/login"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes and static assets
    if (publicRoutes.includes(pathname)) {
        return NextResponse.next();
    }

    // Check for session cookie (NextAuth stores session in cookies)
    const sessionToken = request.cookies.get("authjs.session-token") ||
        request.cookies.get("__Secure-authjs.session-token");

    // Check if the current path is a protected route
    const isProtectedRoute = protectedRoutes.some(
        (route) => pathname.startsWith(route)
    );

    // Redirect to login if accessing protected route without auth
    if (isProtectedRoute && !sessionToken) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
    ],
};
