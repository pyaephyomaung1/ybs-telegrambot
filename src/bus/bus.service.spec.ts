import { Test, TestingModule } from '@nestjs/testing';
import { BusService } from './bus.service';

describe('BusService', () => {
  let service: BusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusService],
    }).compile();

    service = module.get<BusService>(BusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns ordered stops for a bus number', async () => {
    const stops = await service.getStopsByBusNumber('4');

    expect(stops).toHaveLength(12);
    expect(stops[0].stopOrder).toBe(1);
    expect(stops[11].stopOrder).toBe(12);
    expect(stops.every((stop) => stop.busLine.number === '4')).toBe(true);
  });
});
