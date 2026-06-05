import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { db } from "@/db";
import { users } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const [user] = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            passwordHash: users.passwordHash,
            totalPoints: users.totalPoints,
            referralCode: users.referralCode,
            isActive: users.isActive
          })
          .from(users)
          .where(eq(users.email, parsed.data.email.toLowerCase()))
          .limit(1);

        if (!user || !user.isActive) {
          return null;
        }

        const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        await writeAuditLog(db, {
          actor: { id: user.id, name: user.name, role: user.role },
          action: "LOGIN",
          module: "AUTH",
          entityId: user.id
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          totalPoints: user.totalPoints,
          referralCode: user.referralCode
        };
      }
    })
  ]
});
