import { BusLine } from './bus-line.model';
import { Stop } from './stop.model';

export class BusLineStop {
  id!: number;
  busLine!: BusLine;
  stop!: Stop;
  stopOrder!: number;
}
