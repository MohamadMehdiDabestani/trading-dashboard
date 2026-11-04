import { AppError } from "@/errors/appError";
import { IOtpService } from "../types/otp.interface";
import { ITokenService } from "../types/token.interface";
import { UserRepository } from "../types/user.repository";
import { EditProfileDto, MeReply, RegisterDto, Role } from "@repo/types";
import { defineAbilityFor, serializeRules } from "@repo/casl";
import { hashPassword, verifyPassword } from "@/utils/password";
import { LoginHistoryService } from "../infrastructure/services/loginHistory.service.impl";
import { ClientMeta } from "../infrastructure/services/device.service.impl";

type User = NonNullable<Awaited<ReturnType<UserRepository["findById"]>>>;
type Session = { accessToken: string; refreshToken: string };

const MAX_PASSWORD_FAILURES = 5;

// TODO: adjust to however your AppError exposes its code
const reasonOf = (e: unknown) =>
  e instanceof AppError
    ? String((e as any).key ?? (e as any).code ?? "APP_ERROR")
    : "UNKNOWN";

export class AuthService {
  constructor(
    private users: UserRepository,
    private otp: IOtpService,
    readonly tokens: ITokenService,
    private history: LoginHistoryService,
  ) {}

  private async issueSession(user: {
    id: string;
    phone: string;
    role: Role;
  }): Promise<Session> {
    const accessToken = this.tokens.signAccessToken({
      sub: user.id,
      phone: user.phone,
      role: user.role,
    });
    const refreshToken = await this.tokens.createRefreshToken(user.id);
    return { accessToken, refreshToken };
  }

  private async verifyOtpLogged(phone: string, code: string, meta: ClientMeta) {
    try {
      await this.otp.verify(phone, code);
    } catch (err) {
      await this.history.record({
        phone,
        method: "otp",
        status: "failed",
        failureReason: reasonOf(err),
        ...meta,
      });
      throw err;
    }
  }

  async sendOtp(phone: string): Promise<void> {
    await this.otp.send(phone);
  }

  // ─── OTP login ──────────────────────────────────────────────
  async loginWithOtp(
    phone: string,
    code: string,
    meta: ClientMeta,
  ): Promise<Session & { isNew: boolean }> {
    await this.verifyOtpLogged(phone, code, meta);

    const found = await this.users.findByPhone(phone);
    const isNew = !found;
    const user = found ?? (await this.users.create(phone));

    const session = await this.issueSession(user);
    await this.history.record({
      userId: user.id,
      phone,
      method: "otp",
      status: "success",
      isNewUser: isNew,
      ...meta,
    });
    return { ...session, isNew };
  }

  // ─── Classic: phone + password ──────────────────────────────
  async loginWithPassword(
    phone: string,
    password: string,
    meta: ClientMeta,
  ): Promise<Session> {
    const fail = async (reason: string, userId?: string): Promise<never> => {
      await this.history.record({
        userId,
        phone,
        method: "password",
        status: "failed",
        failureReason: reason,
        ...meta,
      });
      // same public error for every cause: no user-enumeration oracle
      throw new AppError("INVALID_CREDENTIALS");
    };

    if (
      (await this.history.recentPasswordFailures(phone)) >=
      MAX_PASSWORD_FAILURES
    ) {
      await this.history.record({
        phone,
        method: "password",
        status: "failed",
        failureReason: "LOCKED",
        ...meta,
      });
      throw new AppError("LOGIN_LOCKED");
    }

    const user = await this.users.findByPhone(phone);
    const valid = await verifyPassword(password, user?.passwordHash);

    if (!user) return fail("NO_USER");
    if (!valid)
      return fail(
        user.passwordHash ? "BAD_PASSWORD" : "NO_PASSWORD_SET",
        user.id,
      );
    if (!user.isActive) return fail("INACTIVE", user.id);

    const session = await this.issueSession(user);
    await this.history.record({
      userId: user.id,
      phone,
      method: "password",
      status: "success",
      ...meta,
    });
    return session;
  }

  // ─── Register
  async register(
    input: RegisterDto,
    meta: ClientMeta,
  ): Promise<Session & { isNew: boolean }> {
    try {
      const { phone, password } = input;
      const userName = input.userName.trim();

      const found = await this.users.findByPhone(phone);
      if (found && !found.isActive) throw new AppError("USER_NOTFOUND");
      if (found?.passwordHash) throw new AppError("USER_EXISTS");

      const passwordHash = await hashPassword(password);
      const isNew = !found;
      const user = await this.users.createWithPassword({
        phone,
        userName,
        passwordHash,
      });

      const session = await this.issueSession(user);
      await this.history.record({
        userId: user.id,
        phone,
        method: "password",
        status: "success",
        isNewUser: isNew,
        ...meta,
      });
      return { ...session, isNew };
    } catch (err: any) {
      const cause = err?.cause;
      if (cause?.code === "23505") {
        if (cause?.constraint_name === "users_phone_unique") {
          throw new AppError("USER_EXISTS");
        }
      }
      throw err;
    }
  }

  async refresh(rawRefreshToken: string): Promise<Session> {
    const result = await this.tokens.rotateRefreshToken(rawRefreshToken);
    if (!result) throw new AppError("INVALID_REFRESH");

    const user = await this.users.findById(result.userId);
    if (!user || !user.isActive) throw new AppError("USER_NOTFOUND");

    const accessToken = this.tokens.signAccessToken({
      sub: user.id,
      phone: user.phone,
      role: user.role,
    });
    return { accessToken, refreshToken: result.refreshToken };
  }

  async getMe(userId: string): Promise<MeReply> {
    const user = await this.users.findById(userId);
    if (!user || !user.isActive) throw new AppError("USER_NOTFOUND");

    const ability = defineAbilityFor({ id: user.id, role: user.role });

    return {
      userId: user.id,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        username: user.userName,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      },
      rules: serializeRules(ability),
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

  async loginHistory(userId: string) {
    return this.history.listForUser(userId);
  }

  async logout(userId: string): Promise<void> {
    await this.tokens.revokeAllForUser(userId);
  }
}
