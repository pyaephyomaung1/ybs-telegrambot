// src/session/session.service.ts
import { Injectable } from '@nestjs/common';
import { Session, SessionStopChoice } from '../entities/session.entity';

@Injectable()
export class SessionService {
  private readonly sessions = new Map<number, Session>();
  private nextId = 1;

  // Get existing session or create a fresh one
  getOrCreate(telegramId: number): Promise<Session> {
    return Promise.resolve(this.getOrCreateSession(telegramId));
  }

  setState(telegramId: number, state: string): Promise<void> {
    const session = this.getOrCreateSession(telegramId);
    session.state = state;
    session.tempData = null;
    session.updatedAt = new Date();

    return Promise.resolve();
  }

  setTempData(telegramId: number, data: SessionStopChoice[]): Promise<void> {
    const session = this.getOrCreateSession(telegramId);
    session.tempData = data;
    session.updatedAt = new Date();

    return Promise.resolve();
  }

  private getOrCreateSession(telegramId: number): Session {
    let session = this.sessions.get(telegramId);
    if (!session) {
      session = {
        id: this.nextId,
        telegramId,
        state: 'IDLE',
        tempData: null,
        updatedAt: new Date(),
      };
      this.nextId += 1;
      this.sessions.set(telegramId, session);
    }
    return session;
  }
}
