import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from '../session/session.service';
import { TelegramHandler } from './telegram.handler';
import { TelegramService } from './telegram.service';

describe('TelegramService', () => {
  let service: TelegramService;
  const sessionService = {
    getOrCreate: jest.fn(),
    setState: jest.fn(),
    setTempData: jest.fn(),
  };
  const handler = {
    answerCallbackQuery: jest.fn(),
    askForBusNumber: jest.fn(),
    askForStopName: jest.fn(),
    handleBusNumberInput: jest.fn(),
    handleIdle: jest.fn(),
    handleStopChoice: jest.fn(),
    handleStopNameInput: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    sessionService.getOrCreate.mockResolvedValue({
      id: 1,
      telegramId: 123,
      state: 'IDLE',
      tempData: null,
      updatedAt: new Date(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        {
          provide: SessionService,
          useValue: sessionService,
        },
        {
          provide: TelegramHandler,
          useValue: handler,
        },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('routes typed numbers to bus line search', async () => {
    await service.handleUpdate({
      message: {
        text: '43',
        from: { id: 123 },
        chat: { id: 456 },
      },
    });

    expect(handler.handleBusNumberInput).toHaveBeenCalledWith(456, 123, '43');
    expect(handler.handleStopNameInput).not.toHaveBeenCalled();
  });

  it('routes typed strings to stop quick search', async () => {
    await service.handleUpdate({
      message: {
        text: 'လှည်းတန်း',
        from: { id: 123 },
        chat: { id: 456 },
      },
    });

    expect(handler.handleStopNameInput).toHaveBeenCalledWith(
      456,
      123,
      'လှည်းတန်း',
    );
    expect(handler.handleBusNumberInput).not.toHaveBeenCalled();
  });
});
