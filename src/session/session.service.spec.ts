import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionService],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates and updates an in-memory session', async () => {
    const session = await service.getOrCreate(123);

    expect(session.state).toBe('IDLE');

    await service.setState(123, 'WAITING_BUS_NUMBER');
    const updatedSession = await service.getOrCreate(123);

    expect(updatedSession.state).toBe('WAITING_BUS_NUMBER');
    expect(updatedSession.tempData).toBeNull();
  });
});
