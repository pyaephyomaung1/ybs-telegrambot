// src/bus/bus.module.ts
import { Module } from '@nestjs/common';
import { BusService } from './bus.service';

@Module({
  providers: [BusService],
  exports: [BusService], // ← important! TelegramModule needs this
})
export class BusModule {}
