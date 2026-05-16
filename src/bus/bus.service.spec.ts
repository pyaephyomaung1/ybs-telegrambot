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
    expect(stops[0].stop.name).toBe('Pae Ku River Road');
    expect(stops[11].stop.name).toBe('Mahar Bandula Road');
  });
});
