import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusLineStop } from '../entities/bus-line-stop.entity';
import { Stop } from '../entities/stop.entity';
import { BusService } from './bus.service';

describe('BusService', () => {
  let service: BusService;
  const busLineStopRepo = {
    find: jest.fn(),
  };
  const stopRepo = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusService,
        {
          provide: getRepositoryToken(BusLineStop),
          useValue: busLineStopRepo,
        },
        {
          provide: getRepositoryToken(Stop),
          useValue: stopRepo,
        },
      ],
    }).compile();

    service = module.get<BusService>(BusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
