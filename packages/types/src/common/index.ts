export type FieldError = {
  key: string;
  params?: Record<string, string | number>;
};

export type APIResult<T = unknown> =
  | {
      success: true;
      data: T;
      meta?: { requestId?: string; timestamp?: number };
      message?: { key: string; params?: Record<string, string | number> };
    }
  | {
      success: false;
      error: {
        code: string;
        message: { key: string; params?: Record<string, string | number> };
        fields?: Record<string, FieldError>;
      };
      meta?: { requestId?: string; timestamp?: number };
    };

export interface SmsGateway {
  send(phone: string, text: string): Promise<void>;
  sendTemplate?(
    phone: string,
    templateId: string,
    text: Record<string, string>,
  ): Promise<void>;
}
