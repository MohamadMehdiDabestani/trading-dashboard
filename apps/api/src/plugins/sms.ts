import fp from 'fastify-plugin';
import { SmsService } from '../services/sms/sms.service';
import { ConsoleSmsProvider } from '../services/sms/smsConsole.provider';

declare module 'fastify' {
  interface FastifyInstance {
    sms: SmsService;
  }
}

export default fp(async (fastify) => {
  const gateway = new ConsoleSmsProvider();

  fastify.decorate('sms', new SmsService(gateway));
});
