import { Injectable } from '@nestjs/common';
import { SessionService } from '../session/session.service';
import { BusService } from '../bus/bus.service';
import { TelegramKeyboard } from './telegram.keyboard';
import { SessionStopChoice } from '../entities/session.entity';

@Injectable()
export class TelegramHandler {
  constructor(
    private readonly sessionService: SessionService,
    private readonly busService: BusService,
    private readonly keyboard: TelegramKeyboard,
  ) {}

  async handleIdle(chatId: number) {
    await this.keyboard.showMainMenu(chatId);
  }

  async askForBusNumber(chatId: number) {
    await this.keyboard.removeKeyboard(
      chatId,
      'ယာဥ်လိုင်းနံပါတ်ရိုက်ထည့်ပါ:\n(ဥပမာ. 4, 7, 43)',
    );
  }

  async askForStopName(chatId: number) {
    await this.keyboard.removeKeyboard(chatId, 'မှတ်တိုင်အမည်ရိုက်ထည့်ပါ:');
  }

  async handleBusNumberInput(chatId: number, telegramId: number, text: string) {
    const stops = await this.busService.getStopsByBusNumber(text);

    if (!stops || stops.length === 0) {
      await this.keyboard.sendMessage(
        chatId,
        `❌ Bus line "${text}" not found. Try again:`,
      );
      return;
    }

    const stopList = stops
      .map((s, i) => `${i + 1}. ${s.stop.name} (${s.stop.township.name})`)
      .join('\n');

    await this.keyboard.sendMessage(
      chatId,
      `🚌 Bus ${text} stops:\n\n${stopList}`,
    );
    await this.sessionService.setState(telegramId, 'IDLE');
    await this.keyboard.showMainMenu(chatId);
  }

  async handleStopNameInput(chatId: number, telegramId: number, text: string) {
    const stops = await this.busService.searchStops(text);

    if (!stops || stops.length === 0) {
      await this.keyboard.sendMessage(
        chatId,
        `❌ No stops found for "${text}". Try again:`,
      );
      return;
    }

    if (stops.length > 1) {
      const choices = stops
        .map((s, i) => `${i + 1}. ${s.name} — ${s.township.name}`)
        .join('\n');

      await this.keyboard.sendMessage(
        chatId,
        `Found ${stops.length} stops named "${text}":\n\n${choices}\n\nReply with a number (1, 2, ...)`,
      );

      await this.sessionService.setState(telegramId, 'WAITING_STOP_CHOICE');
      await this.sessionService.setTempData(
        telegramId,
        stops.map((s) => ({
          id: s.id,
          name: s.name,
          township: { name: s.township.name },
        })),
      );
      return;
    }

    await this.showBusesForStop(chatId, telegramId, stops[0]);
  }

  async handleStopChoice(
    chatId: number,
    telegramId: number,
    text: string,
    tempData: SessionStopChoice[] | null,
  ) {
    if (!Array.isArray(tempData) || tempData.length === 0) {
      await this.sessionService.setState(telegramId, 'IDLE');
      await this.keyboard.sendMessage(
        chatId,
        '⚠️ Your previous search expired.',
      );
      await this.keyboard.showMainMenu(chatId);
      return;
    }

    const choice = Number(text);
    if (!Number.isInteger(choice) || choice < 1 || choice > tempData.length) {
      await this.keyboard.sendMessage(
        chatId,
        `Please reply with a number between 1 and ${tempData.length}`,
      );
      return;
    }

    await this.showBusesForStop(chatId, telegramId, tempData[choice - 1]);
  }

  private async showBusesForStop(
    chatId: number,
    telegramId: number,
    stop: SessionStopChoice,
  ) {
    const buses = await this.busService.getBusesByStop(stop.id);

    if (!buses || buses.length === 0) {
      await this.keyboard.sendMessage(
        chatId,
        `❌ No buses found for stop "${stop.name}".`,
      );
    } else {
      const busList = buses
        .map((b) => `• Bus ${b.busLine.number} — ${b.busLine.description}`)
        .join('\n');

      await this.keyboard.sendMessage(
        chatId,
        `🚏 Buses passing ${stop.name} (${stop.township.name}):\n\n${busList}`,
      );
    }

    await this.sessionService.setState(telegramId, 'IDLE');
    await this.keyboard.showMainMenu(chatId);
  }
}
