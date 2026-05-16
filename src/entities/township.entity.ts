import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Stop } from './stop.entity';

@Entity('townships')
export class Township {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @OneToMany(() => Stop, (stop) => stop.township)
  stops!: Stop[];
}
