export type APIResult<T = unknown> =
  | {
      success: true;
      data: T;
      meta?: {
        requestId?: string;
        timestamp?: number;
      };
      message?: {
        key: string;
        params?: Record<string, string | number>;
      };
    }
  | {
      success: false;
      error: {
        code: string;
        message: {
          key: string;
          params?: Record<string, string | number>;
        };
      };
      meta?: {
        requestId?: string;
        timestamp?: number;
      };
    };
