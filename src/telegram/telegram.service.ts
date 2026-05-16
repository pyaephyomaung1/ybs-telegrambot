// src/telegram/telegram.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SessionService } from '../session/session.service';
import { BusService } from '../bus/bus.service';
import axios from 'axios';
import { SessionStopChoice } from '../entities/session.entity';

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

interface TelegramReplyMarkup {
  keyboard: string[][];
  resize_keyboard: boolean;
  one_time_keyboard: boolean;
}

interface TelegramRemoveKeyboard {
  remove_keyboard: true;
}

type TelegramMessageMarkup = TelegramReplyMarkup | TelegramRemoveKeyboard;

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly apiUrl: string;

  constructor(
    private readonly sessionService: SessionService,
    private readonly busService: BusService,
  ) {
    this.apiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
  }

  // ── Entry point — every message comes here ──────────────────
  async handleUpdate(body: unknown): Promise<void> {
    if (!this.isTelegramTextUpdate(body)) return; // ignore non-text updates

    const telegramId = body.message.from.id;
    const text = body.message.text.trim();
    const chatId = body.message.chat.id;

    // Get or create session for this user
    const session = await this.sessionService.getOrCreate(telegramId);

    if (await this.handleNavigationCommand(chatId, telegramId, text)) {
      return;
    }

    // Route based on current state
    switch (session.state) {
      case 'IDLE':
        await this.handleIdle(chatId);
        break;
      case 'WAITING_BUS_NUMBER':
        await this.handleBusNumberInput(chatId, telegramId, text);
        break;
      case 'WAITING_STOP_NAME':
        await this.handleStopNameInput(chatId, telegramId, text);
        break;
      case 'WAITING_STOP_CHOICE':
        await this.handleStopChoice(chatId, telegramId, text, session.tempData);
        break;
      default:
        await this.sessionService.setState(telegramId, 'IDLE');
        await this.showMainMenu(chatId);
    }
  }

  // ── IDLE: show main menu ─────────────────────────────────────
  private async handleIdle(chatId: number) {
    // anything else → show menu
    await this.showMainMenu(chatId);
  }

  // ── WAITING_BUS_NUMBER ───────────────────────────────────────
  private async handleBusNumberInput(
    chatId: number,
    telegramId: number,
    text: string,
  ) {
    const stops = await this.busService.getStopsByBusNumber(text);

    if (!stops || stops.length === 0) {
      await this.sendMessage(
        chatId,
        `❌ Bus line "${text}" not found. Try again:`,
        null,
      );
      return; // stay in WAITING_BUS_NUMBER state
    }

    const stopList = stops
      .map((s, i) => `${i + 1}. ${s.stop.name} (${s.stop.township.name})`)
      .join('\n');

    await this.sendMessage(
      chatId,
      `🚌 Bus ${text} stops:\n\n${stopList}`,
      null,
    );

    await this.sessionService.setState(telegramId, 'IDLE');
    await this.showMainMenu(chatId);
  }

  // ── WAITING_STOP_NAME ────────────────────────────────────────
  private async handleStopNameInput(
    chatId: number,
    telegramId: number,
    text: string,
  ) {
    const stops = await this.busService.searchStops(text);

    if (!stops || stops.length === 0) {
      await this.sendMessage(
        chatId,
        `❌ No stops found for "${text}". Try again:`,
        null,
      );
      return;
    }

    // Multiple stops with same name but different townships
    if (stops.length > 1) {
      const choices = stops
        .map((s, i) => `${i + 1}. ${s.name} — ${s.township.name}`)
        .join('\n');

      await this.sendMessage(
        chatId,
        `Found ${stops.length} stops named "${text}":\n\n${choices}\n\nReply with a number (1, 2, ...)`,
        null,
      );

      await this.sessionService.setState(telegramId, 'WAITING_STOP_CHOICE');
      await this.sessionService.setTempData(
        telegramId,
        stops.map((stop) => ({
          id: stop.id,
          name: stop.name,
          township: {
            name: stop.township.name,
          },
        })),
      ); // save for next step
      return;
    }

    // Only 1 result — show buses directly
    await this.showBusesForStop(chatId, telegramId, stops[0]);
  }

  // ── WAITING_STOP_CHOICE ──────────────────────────────────────
  private async handleStopChoice(
    chatId: number,
    telegramId: number,
    text: string,
    tempData: SessionStopChoice[] | null,
  ) {
    if (!this.isStopChoiceArray(tempData)) {
      await this.sessionService.setState(telegramId, 'IDLE');
      await this.sendMessage(chatId, 'Your previous search expired.', null);
      await this.showMainMenu(chatId);
      return;
    }

    const choice = Number(text);

    if (!Number.isInteger(choice) || choice < 1 || choice > tempData.length) {
      await this.sendMessage(
        chatId,
        `Please reply with a number between 1 and ${tempData.length}`,
        null,
      );
      return;
    }

    const selectedStop = tempData[choice - 1];
    await this.showBusesForStop(chatId, telegramId, selectedStop);
  }

  // ── Helper: show buses passing a stop ───────────────────────
  private async showBusesForStop(
    chatId: number,
    telegramId: number,
    stop: SessionStopChoice,
  ) {
    const buses = await this.busService.getBusesByStop(stop.id);

    if (!buses || buses.length === 0) {
      await this.sendMessage(
        chatId,
        `❌ No buses found for stop "${stop.name}".`,
        null,
      );
    } else {
      const busList = buses
        .map((b) => `• Bus ${b.busLine.number} — ${b.busLine.description}`)
        .join('\n');

      await this.sendMessage(
        chatId,
        `🚏 Buses passing ${stop.name} (${stop.township.name}):\n\n${busList}`,
        null,
      );
    }

    await this.sessionService.setState(telegramId, 'IDLE');
    await this.showMainMenu(chatId);
  }

  // ── Helper: show main menu with keyboard buttons ─────────────
  private async showMainMenu(chatId: number) {
    await this.sendMessage(
      chatId,
      '🚌 YBS Bot — Yangon Bus Service\n\nWhat would you like to search?',
      {
        keyboard: [['🚌 Search by Bus Line'], ['🚏 Search by Stop Name']],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    );
  }

  private async handleNavigationCommand(
    chatId: number,
    telegramId: number,
    text: string,
  ): Promise<boolean> {
    if (text === '/start' || text === '🔙 Main Menu') {
      await this.sessionService.setState(telegramId, 'IDLE');
      await this.showMainMenu(chatId);
      return true;
    }

    if (text === '🚌 Search by Bus Line') {
      await this.sessionService.setState(telegramId, 'WAITING_BUS_NUMBER');
      await this.sendMessage(
        chatId,
        'Enter bus line number:\n(e.g. 4, 7, 43)',
        { remove_keyboard: true },
      );
      return true;
    }

    if (text === '🚏 Search by Stop Name') {
      await this.sessionService.setState(telegramId, 'WAITING_STOP_NAME');
      await this.sendMessage(chatId, 'Enter stop name to search:', {
        remove_keyboard: true,
      });
      return true;
    }

    return false;
  }

  // ── Core: send message to Telegram ──────────────────────────
  async sendMessage(
    chatId: number,
    text: string,
    replyMarkup: TelegramMessageMarkup | null,
  ) {
    try {
      await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: chatId,
        text,
        ...(replyMarkup && { reply_markup: replyMarkup }),
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send Telegram message to chat ${chatId}: ${this.getTelegramErrorMessage(error)}`,
      );
    }
  }

  private getTelegramErrorMessage(error: unknown): string {
    if (!axios.isAxiosError(error)) {
      return error instanceof Error ? error.message : 'Unknown error';
    }

    const data: unknown = error.response?.data;
    if (
      data &&
      typeof data === 'object' &&
      'description' in data &&
      typeof (data as { description?: unknown }).description === 'string'
    ) {
      return (data as { description: string }).description;
    }

    return error.message;
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

  private isStopChoiceArray(
    value: SessionStopChoice[] | null,
  ): value is SessionStopChoice[] {
    return (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((stop) => {
        const township = stop.township;
        return (
          typeof stop.id === 'number' &&
          typeof stop.name === 'string' &&
          !!township &&
          typeof township === 'object' &&
          typeof (township as { name?: unknown }).name === 'string'
        );
      })
    );
  }
}
