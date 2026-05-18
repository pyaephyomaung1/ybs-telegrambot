import { Injectable } from '@nestjs/common';
import { SessionService } from '../session/session.service';
import { BusService } from '../bus/bus.service';
import { TelegramKeyboard } from './telegram.keyboard';
import { SessionStopChoice } from '../entities/session.entity';
import { Stop } from '../entities/stop.entity';
import { parseMyanmarNumber } from './number.util';

const UNKNOWN_TOWNSHIP_NAMES = new Set(['မသိရ', 'Unknown', '']);

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

  async answerCallbackQuery(callbackQueryId: string) {
    await this.keyboard.answerCallbackQuery(callbackQueryId);
  }

  async askForBusNumber(chatId: number) {
    await this.keyboard.sendMessageWithBackButton(
      chatId,
      'ယာဥ်လိုင်းနံပါတ်ရိုက်ထည့်ပါ:\n(ဥပမာ. 4, 7, 43)',
    );
  }

  async askForStopName(chatId: number) {
    await this.keyboard.sendMessageWithBackButton(
      chatId,
      'မှတ်တိုင်အမည်ရိုက်ထည့်ပါ:',
    );
  }

  async handleBusNumberInput(chatId: number, telegramId: number, text: string) {
    const stops = await this.busService.getStopsByBusNumber(text);

    if (!stops || stops.length === 0) {
      await this.keyboard.sendMessage(
        chatId,
        `❌ တောင်းပန်ပါတယ် ယာဥ်လိုင်းနံပါတ် "${text}" ရှာမတွေ့ပါ.`,
      );
      return;
    }

    const stopList = stops
      .map((s, i) => `${i + 1}. ${this.formatStopName(s.stop)}`)
      .join('\n');

    await this.keyboard.sendMessage(
      chatId,
      `🚌 ယာဥ်လိုင်းနံပါတ် ${text} ရောက်ရှိသော မှတ်တိုင်များ:\n\n${stopList}`,
    );
    await this.sessionService.setState(telegramId, 'IDLE');
    await this.keyboard.showMainMenu(chatId);
  }

  async handleStopNameInput(chatId: number, telegramId: number, text: string) {
    const exactStops = this.getUniqueStopChoices(
      await this.busService.searchExactStops(text),
    );
    if (exactStops.length > 0) {
      await this.replyWithStopChoices(chatId, telegramId, text, exactStops);
      return;
    }

    const townships = await this.busService.searchTownships(text);
    if (townships.length === 1) {
      await this.showBusesForTownship(chatId, telegramId, townships[0]);
      return;
    }

    if (townships.length > 1) {
      const choices = townships
        .map((township, index) => `${index + 1}. ${township.name}`)
        .join('\n');

      await this.keyboard.sendMessage(
        chatId,
        `"${text}" နှင့် ကိုက်ညီသော မြို့နယ် ${townships.length} ခု တွေ့ပါသည်:\n\n${choices}\n\nမြို့နယ်အမည်ကို ပိုတိကျစွာ ရိုက်ထည့်ပါ။`,
      );
      await this.keyboard.sendMessageWithBackButton(
        chatId,
        'ရှာဖွေမှုမှ ထွက်ရန် နောက်သို့ ကို နှိပ်ပါ။',
      );
      return;
    }

    const stops = this.getUniqueStopChoices(
      await this.busService.searchStops(text),
    );

    if (!stops || stops.length === 0) {
      await this.keyboard.sendMessage(
        chatId,
        `❌"${text}" မှတ်တိုင်ရှာမတွေ့ပါ ထပ်မံကြိုးစားပါ`,
      );
      return;
    }

    await this.replyWithStopChoices(chatId, telegramId, text, stops);
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

    const choice = parseMyanmarNumber(text);
    if (choice === null || choice < 1 || choice > tempData.length) {
      await this.keyboard.sendMessage(
        chatId,
        `ကျေးဇူးပြု၍ 1 မှ ${tempData.length} အတွင်း နံပါတ်တစ်ခုဖြင့် ရွေးချယ်ပါ။`,
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
        `❌ တောင်းပန်ပါတယ် မှတ်တိုင်ရှာမတွေ့ပါ`,
      );
    } else {
      const busNumbers = this.getUniqueBusNumbers(buses);

      await this.keyboard.sendMessage(
        chatId,
        `🚏 ${this.formatSessionStopName(stop)} သို့ ရောက်ရှိသော ယာဥ်လိုင်းနံပါတ်များ:\n\n${busNumbers.join(', ')}`,
      );
    }

    await this.sessionService.setState(telegramId, 'IDLE');
    await this.keyboard.showMainMenu(chatId);
  }

  private async replyWithStopChoices(
    chatId: number,
    telegramId: number,
    text: string,
    stops: Stop[],
  ) {
    if (stops.length > 1) {
      const choices = (
        await Promise.all(
          stops.map(async (stop, index) => {
            const busNumbers = await this.getBusNumbersForStop(stop.id);
            return `${index + 1}. ${this.formatStopName(stop)}\n   ယာဥ်လိုင်း: ${busNumbers.join(', ') || '-'}`;
          }),
        )
      ).join('\n');

      await this.keyboard.sendMessage(
        chatId,
        `"${text}" အတွက် မှတ်တိုင် ${stops.length} ခု တွေ့ပါသည်:\n\n${choices}\n\nနံပါတ်ဖြင့် ရွေးချယ်ပါ (1, 2, ...)`,
      );
      await this.keyboard.sendMessageWithBackButton(
        chatId,
        'ရွေးချယ်မှုမှ ထွက်ရန် နောက်သို့ ကို နှိပ်ပါ။',
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

  private async showBusesForTownship(
    chatId: number,
    telegramId: number,
    township: { id: number; name: string },
  ) {
    const buses = await this.busService.getBusesByTownship(township.id);

    if (buses.length === 0) {
      await this.keyboard.sendMessage(
        chatId,
        `❌ ${township.name} မြို့နယ်သို့ ရောက်ရှိသော ယာဥ်လိုင်း မတွေ့ပါ။`,
      );
      return;
    }

    const busList = buses
      .map((bus) => `• ယာဥ်လိုင်းနံပါတ် ${bus.number} — ${bus.description}`)
      .join('\n');

    await this.keyboard.sendMessage(
      chatId,
      `🏙️ ${township.name} မြို့နယ်သို့ ရောက်ရှိသော ယာဥ်လိုင်းများ:\n\n${busList}`,
    );
    await this.sessionService.setState(telegramId, 'IDLE');
    await this.keyboard.showMainMenu(chatId);
  }

  private getUniqueStopChoices(stops: Stop[]): Stop[] {
    const uniqueStops = new Map<string, Stop>();

    for (const stop of stops) {
      const key = String(stop.id);
      if (!uniqueStops.has(key)) {
        uniqueStops.set(key, stop);
      }
    }

    return [...uniqueStops.values()];
  }

  private formatStopName(stop: Stop): string {
    if (this.isUnknownTownship(stop.township.name)) {
      return stop.name;
    }

    return `${stop.name} (${stop.township.name})`;
  }

  private formatSessionStopName(stop: SessionStopChoice): string {
    if (this.isUnknownTownship(stop.township.name)) {
      return stop.name;
    }

    return `${stop.name} (${stop.township.name})`;
  }

  private isUnknownTownship(townshipName: string): boolean {
    return UNKNOWN_TOWNSHIP_NAMES.has(townshipName.trim());
  }

  private async getBusNumbersForStop(stopId: number): Promise<string[]> {
    const buses = await this.busService.getBusesByStop(stopId);

    return this.getUniqueBusNumbers(buses);
  }

  private getUniqueBusNumbers(
    buses: Awaited<ReturnType<BusService['getBusesByStop']>>,
  ): string[] {
    return [...new Set(buses.map((bus) => bus.busLine.number))].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  }
}
