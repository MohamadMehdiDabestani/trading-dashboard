import { and, desc, eq, gt, lt, sql, loginEvents as t, type Db } from "@repo/db";

export type LoginMethod = "otp" | "password" | "qr";

export interface ClientMeta {
  ip: string;
  userAgent: string;
}

export interface LoginEventInput extends Partial<ClientMeta> {
  userId?: string | null;
  phone?: string | null;
  method: LoginMethod;
  status: "success" | "failed";
  failureReason?: string | null;
  isNewUser?: boolean;
  deviceLinkRequestId?: string | null;
}

interface Logger {
  error: (obj: unknown, msg?: string) => void;
}

export class LoginHistoryService {
  constructor(
    private db: Db,
    private log?: Logger,
  ) {}

  /** Never throws: history must not break the login itself. */
  async record(e: LoginEventInput): Promise<void> {
    try {
      await this.db.insert(t).values({
        userId: e.userId ?? null,
        phone: e.phone ?? null,
        method: e.method,
        status: e.status,
        failureReason: e.failureReason ?? null,
        isNewUser: e.isNewUser ?? false,
        ip: e.ip ?? null,
        userAgent: e.userAgent?.slice(0, 300) ?? null,
        deviceLinkRequestId: e.deviceLinkRequestId ?? null,
      });
    } catch (err) {
      this.log?.error({ err }, "login history insert failed");
    }
  }

  /** Failed password attempts for a phone since the last successful password login. */
  async recentPasswordFailures(phone: string, windowMs = 15 * 60_000): Promise<number> {
    const since = new Date(Date.now() - windowMs).toISOString();
    const [r] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(t)
      .where(
        and(
          eq(t.phone, phone),
          eq(t.method, "password"),
          eq(t.status, "failed"),
          gt(
            t.createdAt,
            sql`greatest(${since}::timestamptz, coalesce((select max(created_at) from login_events where phone = ${phone} and method = 'password' and status = 'success'), 'epoch'::timestamptz))`,
          ),
        ),
      );
    return r?.n ?? 0;
  }

  async listForUser(userId: string, limit = 20) {
    const rows = await this.db
      .select({
        id: t.id,
        method: t.method,
        status: t.status,
        isNewUser: t.isNewUser,
        ip: t.ip,
        userAgent: t.userAgent,
        createdAt: t.createdAt,
      })
      .from(t)
      .where(eq(t.userId, userId))
      .orderBy(desc(t.createdAt))
      .limit(Math.min(limit, 100));

    return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  }

  async purgeOld(days = 180): Promise<void> {
    await this.db.delete(t).where(lt(t.createdAt, new Date(Date.now() - days * 86_400_000)));
  }
}