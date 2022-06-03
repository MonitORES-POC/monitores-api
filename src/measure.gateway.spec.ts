import { Test, TestingModule } from '@nestjs/testing';
import { MeasureGateway } from './measure.gateway';

describe('MeasureGateway', () => {
  let gateway: MeasureGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MeasureGateway],
    }).compile();

    gateway = module.get<MeasureGateway>(MeasureGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
