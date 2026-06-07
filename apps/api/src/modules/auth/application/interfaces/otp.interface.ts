export interface IOtpService {
  send(phone: string): Promise<void>;
  verify(phone: string, code: string): Promise<void>;
}
