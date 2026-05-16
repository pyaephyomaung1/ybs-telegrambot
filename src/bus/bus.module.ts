// src/bus/bus.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusLineStop } from '../entities/bus-line-stop.entity';
import { Stop } from '../entities/stop.entity';
import { BusService } from './bus.service';

@Module({
  imports: [TypeOrmModule.forFeature([BusLineStop, Stop])],
  providers: [BusService],
  exports: [BusService], // ← important! TelegramModule needs this
})
export class BusModule {}
