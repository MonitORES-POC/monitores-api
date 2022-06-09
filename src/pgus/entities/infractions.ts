export class Infractions {
  public minor: Infraction;
  public major: Infraction;
  public critical: Infraction;
}

export class Infraction {
  public timeStamp: string;
  public count: number;
}
