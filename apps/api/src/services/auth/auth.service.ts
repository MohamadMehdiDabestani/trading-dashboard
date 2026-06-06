import { users, type Db } from "@repo/db/src";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { OtpService } from "./otp.service";
import { TokenService } from "./token.service";

export class AuthService {
  private readonly db: Db;
  private readonly otp: OtpService;
  readonly tokens: TokenService;

  constructor(fastify: FastifyInstance) {
    this.db = fastify.db;
    this.otp = new OtpService(fastify);
    this.tokens = new TokenService(fastify);
  }

  async sendOtp(phone: string): Promise<void> {
    await this.otp.send(phone);
  }

  async loginWithOtp(
    phone: string,
    code: string,
  ): Promise<{ accessToken: string; refreshToken: string; isNew: boolean }> {
    await this.otp.verify(phone, code);

    const [found] = await this.db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    const isNew = !found;
    const user =
      found ??
      (await this.db.insert(users).values({ phone }).returning({id : users.id , phone : users.phone})).at(0);

    if (!user) throw new Error("Failed to create user");
    const accessToken = this.tokens.signAccessToken({
      sub: user.id,
      phone: user.phone,
    });
    const refreshToken = await this.tokens.createRefreshToken(user.id);

    return { accessToken, refreshToken, isNew };
  }

  async refresh(
    rawRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const result = await this.tokens.rotateRefreshToken(rawRefreshToken);
    if (!result)
      throw Object.assign(new Error("Invalid or expired refresh token"), {
        code: "INVALID_REFRESH",
      });

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, result.userId))
      .limit(1);
    if (!user || !user.isActive)
      throw Object.assign(new Error("User not found"), {
        code: "USER_NOT_FOUND",
      });

    const accessToken = this.tokens.signAccessToken({
      sub: user.id,
      phone: user.phone,
    });
    return { accessToken, refreshToken: result.refreshToken };
  }

  async logout(userId: string): Promise<void> {
    await this.tokens.revokeAllForUser(userId);
  }
}
