import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Township } from './township.entity';
import { BusLineStop } from './bus-line-stop.entity';

@Entity('stops')
export class Stop {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => Township, (township) => township.stops)
  @JoinColumn({ name: 'township_id' })
  township!: Township;

  @OneToMany(() => BusLineStop, (bls) => bls.stop)
  busLineStops!: BusLineStop[];
}
