import { SmsGateway } from "@repo/types";

// services/sms.service.ts
export class SmsService {
  constructor(private readonly gateway: SmsGateway) {}

  sendOtp(phone: string, code: string): Promise<void> {
    return this.gateway.send(phone, `کد تأیید شما: ${code}`);
  }

  sendWelcome(phone: string, name: string): Promise<void> {
    return this.gateway.send(phone, `${name} عزیز، به سیستم خوش آمدید.`);
  }

  sendOrderFilled(phone: string, orderId: string): Promise<void> {
    return this.gateway.send(phone, `سفارش ${orderId} شما با موفقیت انجام شد.`);
  }

  sendPasswordChanged(phone: string): Promise<void> {
    return this.gateway.send(
      phone,
      `رمز عبور شما تغییر کرد. اگر شما نبودید تماس بگیرید.`,
    );
  }

  sendWithdrawalConfirm(phone: string, amount: string): Promise<void> {
    return this.gateway.send(
      phone,
      `برداشت ${amount} تومان از حساب شما ثبت شد.`,
    );
  }
}
