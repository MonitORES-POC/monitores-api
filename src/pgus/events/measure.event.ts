export class MeasureEvent {
  constructor(
    public readonly id: number,
    public readonly timeStamp: Date,
    public readonly measuredPower: number,
  ) {}

  toString() {
    return JSON.stringify({
      id: this.id,
      timeStamp: this.timeStamp,
      measuredPower: this.measuredPower,
    });
  }
}
