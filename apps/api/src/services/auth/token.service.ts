import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { refreshTokens, type Db } from "@repo/db/src";
import { eq, and, gt } from "drizzle-orm";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface JwtPayload {
  sub: string; // userId
  phone: string;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export class TokenService {
  private readonly db: Db;
  constructor(private readonly fastify: FastifyInstance) {
    this.db = fastify.db;
  }

  signAccessToken(payload: JwtPayload): string {
    return this.fastify.jwt.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });
  }

  async createRefreshToken(userId: string): Promise<string> {
    const raw = crypto.randomBytes(40).toString("hex");
    const hash = hashToken(raw);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.db
      .insert(refreshTokens)
      .values({ userId, tokenHash: hash, expiresAt });
    return raw;
  }

  async rotateRefreshToken(raw: string): Promise<{
    accessToken: string;
    refreshToken: string;
    userId: string;
  } | null> {
    const hash = hashToken(raw);
    const now = new Date();

    const [stored] = await this.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, hash),
          gt(refreshTokens.expiresAt, now),
        ),
      )
      .limit(1);

    if (!stored || stored.revokedAt) return null;

    // revoke old token
    await this.db
      .delete(refreshTokens) // Maybe you want to use update :  .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, stored.id));

    const newRaw = await this.createRefreshToken(stored.userId);

    // need phone for access token — caller must fetch user
    return { accessToken: "", refreshToken: newRaw, userId: stored.userId };
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db
      .delete(refreshTokens) // Maybe you want to use update :  .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.userId, userId));
  }
}
