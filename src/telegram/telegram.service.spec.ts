import { Test, TestingModule } from '@nestjs/testing';
import { BusService } from '../bus/bus.service';
import { SessionService } from '../session/session.service';
import { TelegramService } from './telegram.service';

describe('TelegramService', () => {
  let service: TelegramService;
  const sessionService = {
    getOrCreate: jest.fn(),
    setState: jest.fn(),
    setTempData: jest.fn(),
  };
  const busService = {
    getBusesByStop: jest.fn(),
    getStopsByBusNumber: jest.fn(),
    searchStops: jest.fn(),
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
          provide: BusService,
          useValue: busService,
        },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
