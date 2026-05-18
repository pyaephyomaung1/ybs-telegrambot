import { BusLineStop } from './bus-line-stop.model';

export class BusLine {
  id!: number;
  number!: string;
  description!: string | null;
  busLineStops!: BusLineStop[];
}
