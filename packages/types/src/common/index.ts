import {
  AllSuccessCodes,
  AllErrorCode,
  ValidationErrorCode,
} from "../i18n/index";
export type FieldError = {
  key: ValidationErrorCode;
  params?: Record<string, string | number>;
};
export type APIResult<T = unknown> =
  | {
      success: true;
      data: T;
      meta?: { requestId?: string; timestamp?: number };
      message?: {
        key: AllSuccessCodes;
        params?: Record<string, string | number>;
      };
    }
  | {
      success: false;
      error: {
        code: AllErrorCode;
        params?: Record<string, string | number>;
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

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPage: number;
}