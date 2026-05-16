// src/telegram/telegram.service.ts
import { Injectable } from '@nestjs/common';
import { SessionService } from '../session/session.service';
import { TelegramHandler } from './telegram.handler';
import { TELEGRAM_KEYBOARD_TEXT } from './telegram.keyboard';

interface TelegramTextUpdate {
  message: {
    text: string;
    from: {
      id: number;
    };
    chat: {
      id: number;
    };
  };
}

@Injectable()
export class TelegramService {
  constructor(
    private readonly sessionService: SessionService,
    private readonly handler: TelegramHandler,
  ) {}

  async handleUpdate(body: unknown): Promise<void> {
    if (!this.isTelegramTextUpdate(body)) return;

    const telegramId = body.message.from.id;
    const text = body.message.text.trim();
    const chatId = body.message.chat.id;

    // Handle navigation commands first (always works regardless of state)
    if (await this.handleNavigation(chatId, telegramId, text)) return;

    const session = await this.sessionService.getOrCreate(telegramId);

    switch (session.state) {
      case 'IDLE':
        await this.handler.handleIdle(chatId);
        break;
      case 'WAITING_BUS_NUMBER':
        await this.handler.handleBusNumberInput(chatId, telegramId, text);
        break;
      case 'WAITING_STOP_NAME':
        await this.handler.handleStopNameInput(chatId, telegramId, text);
        break;
      case 'WAITING_STOP_CHOICE':
        await this.handler.handleStopChoice(
          chatId,
          telegramId,
          text,
          session.tempData,
        );
        break;
      default:
        await this.sessionService.setState(telegramId, 'IDLE');
        await this.handler.handleIdle(chatId);
    }
  }

  private async handleNavigation(
    chatId: number,
    telegramId: number,
    text: string,
  ): Promise<boolean> {
    if (text === '/start' || text === TELEGRAM_KEYBOARD_TEXT.mainMenu) {
      await this.sessionService.setState(telegramId, 'IDLE');
      await this.handler.handleIdle(chatId);
      return true;
    }

    if (
      text === TELEGRAM_KEYBOARD_TEXT.searchByBusLine ||
      text === TELEGRAM_KEYBOARD_TEXT.oldSearchByBusLine
    ) {
      await this.sessionService.setState(telegramId, 'WAITING_BUS_NUMBER');
      await this.handler.askForBusNumber(chatId);
      return true;
    }

    if (
      text === TELEGRAM_KEYBOARD_TEXT.searchByStopName ||
      text === TELEGRAM_KEYBOARD_TEXT.oldSearchByStopName
    ) {
      await this.sessionService.setState(telegramId, 'WAITING_STOP_NAME');
      await this.handler.askForStopName(chatId);
      return true;
    }

    return false;
  }

  private isTelegramTextUpdate(body: unknown): body is TelegramTextUpdate {
    if (!body || typeof body !== 'object') return false;

    const message = (body as { message?: unknown }).message;
    if (!message || typeof message !== 'object') return false;

    const text = (message as { text?: unknown }).text;
    const from = (message as { from?: unknown }).from;
    const chat = (message as { chat?: unknown }).chat;
    if (typeof text !== 'string') return false;
    if (!from || typeof from !== 'object') return false;
    if (!chat || typeof chat !== 'object') return false;

    return (
      typeof (from as { id?: unknown }).id === 'number' &&
      typeof (chat as { id?: unknown }).id === 'number'
    );
  }
}
