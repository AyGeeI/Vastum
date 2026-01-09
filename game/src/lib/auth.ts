import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                // Use the Google ID (stored in token.googleId) as session.user.id
                session.user.id = token.googleId as string || token.sub || "";
            }
            return session;
        },
        async jwt({ token, account, profile }) {
            if (account && profile) {
                token.accessToken = account.access_token;
                // Store Google's profile.sub as googleId
                token.googleId = profile.sub;
            }
            return token;
        },
    },
    session: {
        strategy: "jwt",
    },
});
