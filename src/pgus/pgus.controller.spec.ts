import { Test, TestingModule } from '@nestjs/testing';
import { PgusController } from './pgus.controller';
import { PgusService } from './pgus.service';

describe('PgusController', () => {
  let controller: PgusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PgusController],
      providers: [PgusService],
    }).compile();

    controller = module.get<PgusController>(PgusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
