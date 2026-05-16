import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TelegramModule } from './telegram/telegram.module';
import { BusModule } from './bus/bus.module';
import { SessionModule } from './session/session.module';
import { Township } from './entities/township.entity';
import { BusLine } from './entities/bus-line.entity';
import { Stop } from './entities/stop.entity';
import { BusLineStop } from './entities/bus-line-stop.entity';
import { Session } from './entities/session.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Township, BusLine, Stop, BusLineStop, Session],
      synchronize: true, // auto-creates tables in dev — never use in production!
    }),
    TelegramModule,
    BusModule,
    SessionModule,
  ],
})
export class AppModule {}
