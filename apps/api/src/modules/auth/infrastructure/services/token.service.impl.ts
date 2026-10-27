import crypto from "node:crypto";
import { eq, and, gt, or, lt, isNotNull } from "drizzle-orm";
import { refreshTokens, type Db } from "@repo/db";
import { JwtPayload } from "@repo/types";
import { ITokenService } from "../../types/token.interface";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export interface JwtSigner {
  sign(payload: JwtPayload, options?: { expiresIn: string }): string;
}

export class TokenServiceImpl implements ITokenService {
  constructor(
    private db: Db,
    private jwt: JwtSigner,
  ) {}

  signAccessToken(payload: JwtPayload): string {
    return this.jwt.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });
  }

  async createRefreshToken(userId: string): Promise<string> {
    const raw = crypto.randomBytes(40).toString("hex");
    const hash = hashToken(raw);

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.db.insert(refreshTokens).values({
      userId,
      tokenHash: hash,
      expiresAt,
    });

    return raw;
  }

  async rotateRefreshToken(raw: string) {
    const hash = hashToken(raw);
    const GRACE_MS = 10_000;

    return this.db.transaction(async (tx) => {
      const [stored] = await tx
        .select()
        .from(refreshTokens)
        .where(
          and(
            eq(refreshTokens.tokenHash, hash),
            gt(refreshTokens.expiresAt, new Date()),
          ),
        )
        .for("update");

      if (!stored) return null;

      // قبلاً rotate شده و از grace گذشته
      if (
        stored.replacedAt &&
        Date.now() - stored.replacedAt.getTime() > GRACE_MS
      ) {
        return null;
      }

      const newRaw = crypto.randomBytes(40).toString("hex");

      await tx.insert(refreshTokens).values({
        userId: stored.userId,
        tokenHash: hashToken(newRaw),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      });

      if (!stored.replacedAt) {
        await tx
          .update(refreshTokens)
          .set({ replacedAt: new Date() })
          .where(eq(refreshTokens.id, stored.id));
      }

      return { userId: stored.userId, refreshToken: newRaw };
    });
  }
  async purgeStale(graceMs = 10_000): Promise<void> {
  const now = new Date();
  const replacedBefore = new Date(Date.now() - graceMs);

  await this.db.delete(refreshTokens).where(
    or(
      lt(refreshTokens.expiresAt, now),
      and(
        isNotNull(refreshTokens.replacedAt),
        lt(refreshTokens.replacedAt, replacedBefore),
      ),
    ),
  );
}
  async revokeAllForUser(userId: string): Promise<void> {
    await this.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  }
}
