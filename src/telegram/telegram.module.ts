// src/telegram/telegram.module.ts
import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { SessionModule } from '../session/session.module';
import { BusModule } from '../bus/bus.module';

@Module({
  imports: [SessionModule, BusModule],
  controllers: [TelegramController],
  providers: [TelegramService],
})
export class TelegramModule {}
