// src/session/session.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session, SessionStopChoice } from '../entities/session.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
  ) {}

  // Get existing session or create a fresh one
  async getOrCreate(telegramId: number): Promise<Session> {
    let session = await this.sessionRepo.findOne({ where: { telegramId } });
    if (!session) {
      session = this.sessionRepo.create({
        telegramId,
        state: 'IDLE',
        tempData: null,
      });
      await this.sessionRepo.save(session);
    }
    return session;
  }

  async setState(telegramId: number, state: string): Promise<void> {
    await this.sessionRepo.update(
      { telegramId },
      { state, tempData: () => 'NULL' },
    );
  }

  async setTempData(
    telegramId: number,
    data: SessionStopChoice[],
  ): Promise<void> {
    const session = await this.getOrCreate(telegramId);
    session.tempData = data;
    await this.sessionRepo.save(session);
  }
}
