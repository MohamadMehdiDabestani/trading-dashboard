import crypto from "node:crypto";
import { and, eq, gt, inArray, lt, sql } from "drizzle-orm";
import { deviceLoginRequests as t, type Db } from "@repo/db";
import { AppError } from "@/errors/appError";
import { ITokenService } from "../../types/token.interface";
import { UserRepository } from "../../types/user.repository";

const LINK_TTL_MS = 2 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 3;

const sha256 = (v: string) =>
  crypto.createHash("sha256").update(v).digest("hex");

const randomToken = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("base64url");

const generateCode = () => String(crypto.randomInt(0, 10_000)).padStart(4, "0");

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export interface ClientMeta {
  ip: string;
  userAgent: string;
}

export type ClaimResult =
  | { status: "waiting" | "denied" | "expired" | "consumed" }
  | { status: "approved"; accessToken: string; refreshToken: string };

export class DeviceLinkServiceImpl {
  constructor(
    private db: Db,
    private tokens: ITokenService,
    private users: UserRepository,
  ) {}

  /** Device 1 (authenticated): create a one-time link. */
  async create(userId: string, meta: ClientMeta) {
    // only one active link per user at a time
    await this.db
      .update(t)
      .set({ status: "denied", decidedAt: new Date() })
      .where(
        and(eq(t.userId, userId), inArray(t.status, ["pending", "opened"])),
      );

    const token = randomToken(32);
    const expiresAt = new Date(Date.now() + LINK_TTL_MS);

    const [row] = await this.db
      .insert(t)
      .values({
        userId,
        tokenHash: sha256(token),
        expiresAt,
        creatorIp: meta.ip,
        creatorUserAgent: meta.userAgent.slice(0, 300),
      })
      .returning({ id: t.id });

    if (!row) throw new AppError("INTERNAL_SERVER_ERROR");

    return { id: row.id, token, expiresAt };
  }

  /** Device 2 (anonymous): open the link. First opener wins, atomically. */
  async open(token: string, meta: ClientMeta) {
    const pollSecret = randomToken(32);
    const code = generateCode();
    const now = new Date();

    const [row] = await this.db
      .update(t)
      .set({
        status: "opened",
        pollSecretHash: sha256(pollSecret),
        verificationCode: code,
        openerIp: meta.ip,
        openerUserAgent: meta.userAgent.slice(0, 300),
        openedAt: now,
      })
      .where(
        and(
          eq(t.tokenHash, sha256(token)),
          eq(t.status, "pending"),
          gt(t.expiresAt, now),
        ),
      )
      .returning({ id: t.id, userId: t.userId });

    // same error for unknown / expired / already used: no oracle for attackers
    if (!row) throw new AppError("DEVICE_LINK_INVALID");

    return { id: row.id, userId: row.userId, pollSecret, code };
  }

  /** Device 1: what to show in the "new device wants to login" prompt. */
  async getForOwner(id: string, userId: string) {
    const [row] = await this.db
      .select({
        id: t.id,
        status: t.status,
        openerIp: t.openerIp,
        openerUserAgent: t.openerUserAgent,
        openedAt: t.openedAt,
        expiresAt: t.expiresAt,
      })
      .from(t)
      .where(and(eq(t.id, id), eq(t.userId, userId)))
      .limit(1);

    if (!row) throw new AppError("DEVICE_LINK_INVALID");
    return row;
  }

  /** Device 1: approve, must type the code displayed on device 2. */
  async approve(id: string, userId: string, code: string) {
    const now = new Date();

    const [row] = await this.db
      .select()
      .from(t)
      .where(
        and(
          eq(t.id, id),
          eq(t.userId, userId),
          eq(t.status, "opened"),
          gt(t.expiresAt, now),
        ),
      )
      .limit(1);

    if (!row || !row.verificationCode) throw new AppError("DEVICE_LINK_INVALID");

    if (!safeEqual(row.verificationCode, code)) {
      const [u] = await this.db
        .update(t)
        .set({ attempts: sql`${t.attempts} + 1` })
        .where(and(eq(t.id, id), eq(t.status, "opened")))
        .returning({ attempts: t.attempts });

      if (u && u.attempts >= MAX_CODE_ATTEMPTS) {
        await this.deny(id, userId);
      }
      throw new AppError("DEVICE_LINK_CODE_INVALID");
    }

    const [ok] = await this.db
      .update(t)
      .set({ status: "approved", decidedAt: now })
      .where(
        and(
          eq(t.id, id),
          eq(t.userId, userId),
          eq(t.status, "opened"),
          gt(t.expiresAt, now),
          lt(t.attempts, MAX_CODE_ATTEMPTS),
        ),
      )
      .returning({ id: t.id });

    if (!ok) throw new AppError("DEVICE_LINK_INVALID");
  }

  /** Device 1: reject. */
  async deny(id: string, userId: string) {
    await this.db
      .update(t)
      .set({ status: "denied", decidedAt: new Date() })
      .where(
        and(
          eq(t.id, id),
          eq(t.userId, userId),
          inArray(t.status, ["pending", "opened"]),
        ),
      );
  }

  /**
   * Device 2: poll. Requires the pollSecret cookie, so someone who merely
   * saw the QR/link cannot claim the session.
   * Tokens are issued exactly once (approved -> consumed is atomic).
   */
  async claim(id: string, pollSecret: string): Promise<ClaimResult> {
    const [row] = await this.db.select().from(t).where(eq(t.id, id)).limit(1);

    if (
      !row?.pollSecretHash ||
      !safeEqual(sha256(pollSecret), row.pollSecretHash)
    ) {
      throw new AppError("DEVICE_LINK_INVALID");
    }

    if (row.status === "consumed") return { status: "consumed" };
    if (row.status === "denied") return { status: "denied" };
    if (row.expiresAt <= new Date()) return { status: "expired" };
    if (row.status !== "approved") return { status: "waiting" };

    const [claimed] = await this.db
      .update(t)
      .set({ status: "consumed" })
      .where(
        and(
          eq(t.id, id),
          eq(t.status, "approved"),
          gt(t.expiresAt, new Date()),
        ),
      )
      .returning({ userId: t.userId });

    if (!claimed) return { status: "consumed" }; // lost a race

    const user = await this.users.findById(claimed.userId);
    if (!user || !user.isActive) throw new AppError("USER_NOTFOUND");

    const accessToken = this.tokens.signAccessToken({
      sub: user.id,
      phone: user.phone,
    });
    const refreshToken = await this.tokens.createRefreshToken(user.id);

    return { status: "approved", accessToken, refreshToken };
  }

  async purgeExpired() {
    await this.db
      .delete(t)
      .where(lt(t.expiresAt, new Date(Date.now() - 60 * 60 * 1000)));
  }
}