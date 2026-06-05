import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  secret:
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "development" ? "brewcycle-local-development-secret" : undefined),
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.role = user.role;
        token.totalPoints = user.totalPoints;
        token.referralCode = user.referralCode;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role;
        session.user.totalPoints = token.totalPoints ?? 0;
        session.user.referralCode = token.referralCode ?? "";
      }

      return session;
    }
  }
} satisfies NextAuthConfig;
