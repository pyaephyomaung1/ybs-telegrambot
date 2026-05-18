import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Logger } from '@nestjs/common';

export const TELEGRAM_KEYBOARD_TEXT = {
  back: 'နောက်သို့',
  mainMenu: '🔙 ပင်မစာမျက်နှာပြန်သွားရန်',
  searchByBusLine: '🚌 ယာဥ်လိုင်းနံပါတ်ဖြင့် ရှာရန်',
  searchByStopName: '🚏 မှတ်တိုင်ဖြင့်ရှာရန်',
  oldSearchByBusLine: '🚌 Search by Bus Line',
  oldSearchByStopName: '🚏 Search by Stop Name',
} as const;

export const TELEGRAM_CALLBACK_DATA = {
  back: 'BACK',
  searchByBusLine: 'SEARCH_BY_BUS_LINE',
  searchByStopName: 'SEARCH_BY_STOP_NAME',
} as const;

interface TelegramReplyMarkup {
  keyboard: string[][];
  resize_keyboard: boolean;
  one_time_keyboard: boolean;
}

interface TelegramInlineMarkup {
  inline_keyboard: {
    text: string;
    callback_data: string;
  }[][];
}

interface TelegramRemoveKeyboard {
  remove_keyboard: true;
}

type TelegramMessageMarkup =
  | TelegramReplyMarkup
  | TelegramInlineMarkup
  | TelegramRemoveKeyboard;

@Injectable()
export class TelegramKeyboard {
  private readonly logger = new Logger(TelegramKeyboard.name);
  private readonly apiUrl: string;

  constructor() {
    this.apiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
  }

  async sendMessage(
    chatId: number,
    text: string,
    replyMarkup: TelegramMessageMarkup | null = null,
  ) {
    try {
      await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: chatId,
        text,
        ...(replyMarkup && { reply_markup: replyMarkup }),
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send message to ${chatId}: ${this.getError(error)}`,
      );
    }
  }

  async showMainMenu(chatId: number) {
    await this.sendMessage(
      chatId,
      '🚌 မင်္ဂလာပါ YBS Bot — ဝိုင်ဘီအက်စ်ဘော့တ် မှ ကြိုဆိုပါတယ်\n\nဘာများရှာချင်ပါသလဲ?',
      {
        inline_keyboard: [
          [
            {
              text: TELEGRAM_KEYBOARD_TEXT.searchByBusLine,
              callback_data: TELEGRAM_CALLBACK_DATA.searchByBusLine,
            },
          ],
          [
            {
              text: TELEGRAM_KEYBOARD_TEXT.searchByStopName,
              callback_data: TELEGRAM_CALLBACK_DATA.searchByStopName,
            },
          ],
        ],
      },
    );

    await this.removeKeyboard(
      chatId,
      'ရွေးချယ်ရန် အပေါ်က ခလုတ်များကို နှိပ်ပါ။',
    );
  }

  async removeKeyboard(chatId: number, text: string) {
    await this.sendMessage(chatId, text, { remove_keyboard: true });
  }

  async sendMessageWithBackButton(chatId: number, text: string) {
    await this.sendMessage(chatId, text, {
      inline_keyboard: [
        [
          {
            text: TELEGRAM_KEYBOARD_TEXT.back,
            callback_data: TELEGRAM_CALLBACK_DATA.back,
          },
        ],
      ],
    });
  }

  async answerCallbackQuery(callbackQueryId: string) {
    try {
      await axios.post(`${this.apiUrl}/answerCallbackQuery`, {
        callback_query_id: callbackQueryId,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to answer Telegram callback query: ${this.getError(error)}`,
      );
    }
  }

  private getError(error: unknown): string {
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
}
