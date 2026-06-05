import { type Db, otpCodes } from "@repo/db/src";
import { eq, and, gt, desc } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { SmsService } from "../sms/sms.service";
import { AppError } from "@/errors";

const OTP_TTL_MS = 3 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export class OtpService {
  private readonly db: Db;
  private readonly sms: Pick<SmsService, "sendOtp">;
  constructor(fastify: FastifyInstance) {
    this.db = fastify.db;
    this.sms = fastify.sms;
  }

  async send(phone: string): Promise<void> {
    const [recent] = await this.db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.phone, phone),
          eq(otpCodes.used, false),
          gt(otpCodes.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (recent) {
      const age = Date.now() - recent.createdAt.getTime();
      if (age < 60_000) {
        throw new AppError("OTP_RATE_LIMIT");
      }
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    const [otp] = await this.db
      .insert(otpCodes)
      .values({ phone, code, expiresAt })
      .returning({ id: otpCodes.id });

    try {
      await this.sms.sendOtp(phone, code);
    } catch (err) {
      if (!otp) throw new AppError("OTP_INVALID");
      await this.db
        .update(otpCodes)
        .set({ used: true })
        .where(eq(otpCodes.id, otp.id));
      throw new AppError("OTP_INVALID");
    }
  }

  async verify(phone: string, code: string): Promise<boolean> {
    const [record] = await this.db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.phone, phone),
          eq(otpCodes.used, false),
          gt(otpCodes.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (!record)
      throw new AppError("OTP_INVALID");

    if (record.attempts >= MAX_ATTEMPTS)
      throw new AppError("OTP_MAX_ATTEMPTS");

    if (record.code !== code) {
      await this.db
        .update(otpCodes)
        .set({ attempts: record.attempts + 1 })
        .where(eq(otpCodes.id, record.id));
      throw new AppError("OTP_INVALID");
    }

    await this.db
      .update(otpCodes)
      .set({ used: true })
      .where(eq(otpCodes.id, record.id));
    return true;
  }
}
