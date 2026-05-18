// src/telegram/telegram.service.ts
import { Injectable } from '@nestjs/common';
import { SessionService } from '../session/session.service';
import { TelegramHandler } from './telegram.handler';
import {
  TELEGRAM_CALLBACK_DATA,
  TELEGRAM_KEYBOARD_TEXT,
} from './telegram.keyboard';

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

interface TelegramCallbackUpdate {
  callback_query: {
    id: string;
    data: string;
    from: {
      id: number;
    };
    message: {
      chat: {
        id: number;
      };
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
    if (this.isTelegramCallbackUpdate(body)) {
      await this.handleCallbackUpdate(body);
      return;
    }

    if (!this.isTelegramTextUpdate(body)) return;

    const telegramId = body.message.from.id;
    const text = body.message.text.trim();
    const chatId = body.message.chat.id;

    const session = await this.sessionService.getOrCreate(telegramId);

    // Handle navigation commands first (always works regardless of state)
    if (await this.handleNavigation(chatId, telegramId, text)) return;

    if (session.state === 'WAITING_STOP_CHOICE') {
      await this.handler.handleStopChoice(
        chatId,
        telegramId,
        text,
        session.tempData,
      );
      return;
    }

    await this.handleQuickSearch(chatId, telegramId, text);
  }

  private async handleCallbackUpdate(
    body: TelegramCallbackUpdate,
  ): Promise<void> {
    const telegramId = body.callback_query.from.id;
    const chatId = body.callback_query.message.chat.id;
    const callbackQueryId = body.callback_query.id;
    const data = body.callback_query.data;

    await this.sessionService.getOrCreate(telegramId);
    await this.handler.answerCallbackQuery(callbackQueryId);

    if (data === TELEGRAM_CALLBACK_DATA.searchByBusLine) {
      await this.sessionService.setState(telegramId, 'WAITING_BUS_NUMBER');
      await this.handler.askForBusNumber(chatId);
      return;
    }

    if (data === TELEGRAM_CALLBACK_DATA.searchByStopName) {
      await this.sessionService.setState(telegramId, 'WAITING_STOP_NAME');
      await this.handler.askForStopName(chatId);
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

  private async handleQuickSearch(
    chatId: number,
    telegramId: number,
    text: string,
  ): Promise<void> {
    if (this.isBusNumberInput(text)) {
      await this.handler.handleBusNumberInput(chatId, telegramId, text);
      return;
    }

    await this.handler.handleStopNameInput(chatId, telegramId, text);
  }

  private isBusNumberInput(text: string): boolean {
    return /^\d+[a-z]?$/i.test(text);
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

  private isTelegramCallbackUpdate(
    body: unknown,
  ): body is TelegramCallbackUpdate {
    if (!body || typeof body !== 'object') return false;

    const callbackQuery = (body as { callback_query?: unknown }).callback_query;
    if (!callbackQuery || typeof callbackQuery !== 'object') return false;

    const id = (callbackQuery as { id?: unknown }).id;
    const data = (callbackQuery as { data?: unknown }).data;
    const from = (callbackQuery as { from?: unknown }).from;
    const message = (callbackQuery as { message?: unknown }).message;
    if (typeof id !== 'string') return false;
    if (typeof data !== 'string') return false;
    if (!from || typeof from !== 'object') return false;
    if (!message || typeof message !== 'object') return false;

    const chat = (message as { chat?: unknown }).chat;
    if (!chat || typeof chat !== 'object') return false;

    return (
      typeof (from as { id?: unknown }).id === 'number' &&
      typeof (chat as { id?: unknown }).id === 'number'
    );
  }
}
