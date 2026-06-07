import { JwtPayload } from "@repo/types";

export interface ITokenService {
  signAccessToken(payload: JwtPayload): string;

  createRefreshToken(userId: string): Promise<string>;

  rotateRefreshToken(
    token: string
  ): Promise<{
    refreshToken: string;
    userId: string;
  } | null>;

  revokeAllForUser(userId: string): Promise<void>;
}
