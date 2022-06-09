import { Test, TestingModule } from '@nestjs/testing';
import { StateBufferService } from './state-buffer.service';

describe('StateBufferService', () => {
  let service: StateBufferService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StateBufferService],
    }).compile();

    service = module.get<StateBufferService>(StateBufferService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
