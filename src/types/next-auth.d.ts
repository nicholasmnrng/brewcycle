import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";
import type { AppRole } from "@/config/navigation";

declare module "next-auth" {
  interface User {
    role: AppRole;
    totalPoints: number;
    referralCode: string;
  }

  interface Session {
    user: {
      id: string;
      role: AppRole;
      totalPoints: number;
      referralCode: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: AppRole;
    totalPoints: number;
    referralCode: string;
  }
}
