export class MeasureEvent {
  constructor(
    public readonly timeStamp: Date,
    public readonly measuredPower: number,
  ) {}

  toString() {
    return JSON.stringify({
      timeStamp: this.timeStamp,
      measuredPower: this.measuredPower,
    });
  }
}
