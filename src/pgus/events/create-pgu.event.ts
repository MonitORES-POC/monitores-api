import { Pgu } from '../entities/pgu.entity';

export class createPguEvent {
  constructor(
    public readonly newPgu: Pgu,
    public readonly isRespectful: boolean,
    public readonly fromHistoricalData: boolean,
  ) {}

  toString() {
    return JSON.stringify({
      newPgu: this.newPgu,
      isRespectful: this.isRespectful,
      fromHistoricalData: this.fromHistoricalData,
    });
  }
}
