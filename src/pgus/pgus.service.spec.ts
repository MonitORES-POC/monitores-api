import { Test, TestingModule } from '@nestjs/testing';
import { PgusService } from './pgus.service';

describe('PgusService', () => {
  let service: PgusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PgusService],
    }).compile();

    service = module.get<PgusService>(PgusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
