import type { AuthenticatedUser } from "@/types/auth/authenticated-user.types";

export type SessionErrorReason = "missing" | "expired" | "invalid";

export type SessionPayload = {
  userId: number;
  username: string;
  expiresAt: string;
};

export type SessionReadResult =
  | {
      status: "authenticated";
      user: AuthenticatedUser;
      expiresAt: Date;
    }
  | {
      status: SessionErrorReason;
    };

