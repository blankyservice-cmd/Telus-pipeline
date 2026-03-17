import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // On initial sign-in, save all tokens
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        return token;
      }

      // If token hasn't expired yet, return as-is
      if (typeof token.expiresAt === "number" && Date.now() < token.expiresAt * 1000) {
        return token;
      }

      // Token has expired -- refresh it
      try {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken as string,
          }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error_description || "Token refresh failed");

        token.accessToken = data.access_token;
        token.expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
        // Google may issue a new refresh token
        if (data.refresh_token) {
          token.refreshToken = data.refresh_token;
        }
      } catch (err) {
        console.error("Failed to refresh token:", err);
        // Force re-sign-in by clearing tokens
        token.accessToken = undefined;
        token.expiresAt = undefined;
      }

      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
});
