// apps/api/src/sms/console.provider.ts
import type { SmsGateway } from "@repo/types";

export class ConsoleSmsProvider implements SmsGateway {
  
  async send(phone: string, text: string): Promise<void> {
    console.log(`${phone} : ${text}`);
  }
  sendTemplate(
    phone: string,
    templateId: string,
    text: Record<string, string>,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
