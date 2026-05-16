// src/session/session.module.ts
import { Module } from '@nestjs/common';
import { SessionService } from './session.service';

@Module({
  providers: [SessionService],
  exports: [SessionService], // ← important! TelegramModule needs this
})
export class SessionModule {}
