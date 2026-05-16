import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BusLine } from './bus-line.entity';
import { Stop } from './stop.entity';

@Entity('bus_line_stops')
export class BusLineStop {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => BusLine, (busLine) => busLine.busLineStops)
  @JoinColumn({ name: 'bus_line_id' })
  busLine!: BusLine;

  @ManyToOne(() => Stop, (stop) => stop.busLineStops)
  @JoinColumn({ name: 'stop_id' })
  stop!: Stop;

  @Column({ name: 'stop_order' })
  stopOrder!: number;
}
