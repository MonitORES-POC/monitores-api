import { Pgu } from '../entities/pgu.entity';

export class CreatePgusDto {
  newPgu: Pgu;
  isRespectful: boolean;
  fromHistoricalData: boolean;
}
