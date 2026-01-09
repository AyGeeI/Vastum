import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Protected routes that require authentication
const protectedRoutes = ["/dashboard", "/planet", "/map", "/fleet", "/alliance", "/market"];

export default auth((req) => {
    const { pathname } = req.nextUrl;
    const isAuthenticated = !!req.auth;

    // Check if the current path is a protected route
    const isProtectedRoute = protectedRoutes.some(
        (route) => pathname.startsWith(route)
    );

    // Redirect to login if accessing protected route without auth
    if (isProtectedRoute && !isAuthenticated) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect to dashboard if already logged in and accessing login page
    if (pathname === "/login" && isAuthenticated) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
});

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
