import { Constraint } from '../entities/constraint';
import { Infractions } from '../entities/infractions';
import { MeasureEvent } from '../events/measure.event';

export class PguStateUpdateDto {
  constructor(
    public readonly id: number,
    public readonly statusId: number,
    public readonly measure: MeasureEvent,
    public readonly infractionList: Infractions,
    public readonly constraint: Constraint,
    public readonly onBoardPercentage?: number,
  ) {}

  toString() {
    return JSON.stringify({
      id: this.id,
      measure: this.measure,
      statusId: this.statusId,
      infractionList: this.infractionList,
      constraint: this.constraint,
      onBoardPercentage: this.onBoardPercentage,
    });
  }
}
