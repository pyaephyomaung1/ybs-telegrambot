import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BusLineStop } from './bus-line-stop.entity';

@Entity('bus_lines')
export class BusLine {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  number!: string; // "4", "43", "43B"

  @Column({ type: 'varchar', nullable: true })
  description!: string | null; // "Hledan to Downtown"

  @OneToMany(() => BusLineStop, (bls) => bls.busLine)
  busLineStops!: BusLineStop[];
}
