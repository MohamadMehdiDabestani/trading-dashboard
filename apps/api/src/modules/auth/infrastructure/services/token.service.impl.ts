import crypto from "node:crypto";
import { eq, and, gt } from "drizzle-orm";
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
    private jwt: JwtSigner
  ) {}

  signAccessToken(payload: JwtPayload): string {
    return this.jwt.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });
  }

  async createRefreshToken(userId: string): Promise<string> {
    const raw = crypto.randomBytes(40).toString("hex");
    const hash = hashToken(raw);

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.db
      .insert(refreshTokens)
      .values({
        userId,
        tokenHash: hash,
        expiresAt
      });

    return raw;
  }

  async rotateRefreshToken(raw: string) {
  const hash = hashToken(raw);

  return this.db.transaction(async (tx) => {
    const [stored] = await tx
      .delete(refreshTokens)
      .where(and(eq(refreshTokens.tokenHash, hash), gt(refreshTokens.expiresAt, new Date())))
      .returning();

    if (!stored) return null;

    const newRaw = crypto.randomBytes(40).toString("hex");
    await tx.insert(refreshTokens).values({
      userId: stored.userId,
      tokenHash: hashToken(newRaw),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    return { userId: stored.userId, refreshToken: newRaw };
  });
}
  async revokeAllForUser(userId: string): Promise<void> {
    await this.db
      .delete(refreshTokens)
      .where(eq(refreshTokens.userId, userId));
  }
}
