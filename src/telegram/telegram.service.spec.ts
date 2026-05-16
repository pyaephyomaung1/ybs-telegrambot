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
    askForBusNumber: jest.fn(),
    askForStopName: jest.fn(),
    handleBusNumberInput: jest.fn(),
    handleIdle: jest.fn(),
    handleStopChoice: jest.fn(),
    handleStopNameInput: jest.fn(),
  };

  beforeEach(async () => {
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
});
