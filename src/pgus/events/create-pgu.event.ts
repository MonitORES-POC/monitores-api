import { Pgu } from '../entities/pgu.entity';

export class createPguEvent {
  constructor(public readonly newPgu: Pgu) {}

  toString() {
    return JSON.stringify({
      newPgu: this.newPgu,
    });
  }
}
