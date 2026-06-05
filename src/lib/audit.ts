import { auditLogs, notifications } from "@/db/schema";

type Role = "ADMIN" | "CAFE" | "DRIVER" | "BUYER";

type Actor = {
  id?: string;
  name?: string | null;
  role?: Role;
};

export async function writeAuditLog(
  dbOrTx: any,
  input: {
    actor?: Actor;
    action: string;
    module: string;
    entityId?: string;
    detail?: Record<string, unknown>;
  }
) {
  await dbOrTx.insert(auditLogs).values({
    actorId: input.actor?.id,
    actorName: input.actor?.name ?? null,
    actorRole: input.actor?.role,
    action: input.action,
    module: input.module,
    entityId: input.entityId,
    detail: input.detail ?? {}
  });
}

export async function createNotification(
  dbOrTx: any,
  input: {
    userId?: string;
    role?: Role;
    type?: "SUCCESS" | "ERROR" | "WARNING" | "INFO" | "LOADING" | "CONFIRMATION";
    title: string;
    message?: string;
    module?: string;
    entityId?: string;
  }
) {
  await dbOrTx.insert(notifications).values({
    userId: input.userId,
    role: input.role,
    type: input.type ?? "INFO",
    title: input.title,
    message: input.message,
    module: input.module,
    entityId: input.entityId
  });
}
