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

  it('can search exact stops without road-name broad matches', async () => {
    const stops = await service.searchExactStops('စွမ်းအင်');

    expect(stops.length).toBeGreaterThan(0);
    expect(stops.every((stop) => stop.name === 'စွမ်းအင်')).toBe(true);
  });

  it('matches stops with Myanmar digits and optional punctuation', async () => {
    const stops = await service.searchStops('108 တောင်');

    expect(stops.length).toBeGreaterThan(0);
    expect(stops.some((stop) => stop.name === '၁၀၈တောင်စေတီ')).toBe(true);
  });

  it('returns buses that reach a township', async () => {
    const townships = await service.searchTownships('ရန်ကင်း');
    const buses = await service.getBusesByTownship(townships[0].id);

    expect(townships[0].name).toBe('ရန်ကင်း');
    expect(buses.length).toBeGreaterThan(0);
  });
});
