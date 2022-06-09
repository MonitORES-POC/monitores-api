import { Injectable } from '@nestjs/common';
import { AppConstants } from 'src/app.constants';
import { PguStateUpdateDto } from '../dto/pgu-state-update.dto';
import { Constraint } from '../entities/constraint';
import { Infractions } from '../entities/infractions';
import { MeasureEvent } from '../events/measure.event';

@Injectable()
export class StateBufferService {
  private stateBufferArray: { [key: number]: Array<PguStateUpdateDto> } = {};

  initBuffer(id: number) {
    this.stateBufferArray[id] = new Array<PguStateUpdateDto>();
    const currentBuffer = this.stateBufferArray[id];
    const initialConstraint: Constraint = {
      applicationTime: null,
      powerLimit: -1,
    };
    const initialInfractionList: Infractions = {
      minor: { timeStamp: null, count: 0 },
      major: { timeStamp: null, count: 0 },
      critical: { timeStamp: null, count: 0 },
    };
    let now = new Date();
    now = new Date(
      now.getTime() -
        (AppConstants.STATE_BUFFER_SIZE + 1) * AppConstants.MINUTES,
    );
    for (let i = 0; i < AppConstants.STATE_BUFFER_SIZE; i++) {
      currentBuffer.push(
        new PguStateUpdateDto(
          id,
          0,
          this.generateInitialMeasures(id, now),
          initialInfractionList,
          initialConstraint,
        ),
      );
      now = new Date(now.getTime() + AppConstants.MINUTES);
    }
  }

  getBuffer(id: number): Array<PguStateUpdateDto> {
    return this.stateBufferArray[id];
  }

  updateBuffer(id: number, pguUpdate: PguStateUpdateDto) {
    this.stateBufferArray[id].shift();
    this.stateBufferArray[id].push(pguUpdate);
  }

  private generateInitialMeasures(id: number, now: Date) {
    return new MeasureEvent(id, now, 0);
  }
}
