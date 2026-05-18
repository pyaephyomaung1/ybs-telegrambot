import { Township } from './township.model';
import { BusLineStop } from './bus-line-stop.model';

export class Stop {
  id!: number;
  name!: string;
  township!: Township;
  busLineStops!: BusLineStop[];
}
