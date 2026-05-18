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

    expect(stops.length).toBeGreaterThan(0);
    expect(stops[0].stopOrder).toBe(1);
    expect(stops.at(-1)?.stopOrder).toBe(stops.length);
    expect(stops.every((stop) => stop.busLine.number === '4')).toBe(true);
  });
});
