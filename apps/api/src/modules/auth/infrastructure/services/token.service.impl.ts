import crypto from "node:crypto";
import { eq, and, gt } from "drizzle-orm";
import { refreshTokens, type Db } from "@repo/db/src";
import { JwtPayload } from "@repo/types";
import { ITokenService } from "../../application/interfaces/token.interface";

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
    const now = new Date();

    const [stored] = await this.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, hash),
          gt(refreshTokens.expiresAt, now)
        )
      )
      .limit(1);

    if (!stored || stored.revokedAt) {
      return null;
    }

    await this.db
      .delete(refreshTokens)
      .where(eq(refreshTokens.id, stored.id));

    const newRaw = await this.createRefreshToken(stored.userId);

    return {
      userId: stored.userId,
      refreshToken: newRaw
    };
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db
      .delete(refreshTokens)
      .where(eq(refreshTokens.userId, userId));
  }
}
