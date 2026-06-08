import { AppError } from "@/errors/appError";
import { IOtpService } from "./interfaces/otp.interface";
import { ITokenService } from "./interfaces/token.interface";
import { UserRepository } from "./interfaces/user.repository";
import { EditProfileDto } from "@repo/types";

export class AuthService {
  constructor(
    private users: UserRepository,
    private otp: IOtpService,
    readonly tokens: ITokenService,
  ) {}

  async sendOtp(phone: string): Promise<void> {
    await this.otp.send(phone);
  }

  async loginWithOtp(
    phone: string,
    code: string,
  ): Promise<{ accessToken: string; refreshToken: string; isNew: boolean }> {
    await this.otp.verify(phone, code);

    const found = await this.users.findByPhone(phone);

    const isNew = !found;

    const user = found ?? (await this.users.create(phone));

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

    if (!result) throw new AppError("INVALID_REFRESH");

    const user = await this.users.findById(result.userId);

    if (!user || !user.isActive) {
      throw new AppError("USER_NOTFOUND");
    }

    const accessToken = this.tokens.signAccessToken({
      sub: user.id,
      phone: user.phone,
    });

    return {
      accessToken,
      refreshToken: result.refreshToken,
    };
  }
  async editProfile(userId: string, data: EditProfileDto): Promise<void> {
    try {
      const user = await this.users.findById(userId);
      if (!user) throw new AppError("USER_NOTFOUND");
      await this.users.simpleUpdate(userId, data);
    } catch (error) {
      throw new AppError("INTERNAL_SERVER_ERROR");
    }
  }

  async logout(userId: string): Promise<void> {
    await this.tokens.revokeAllForUser(userId);
  }
}
